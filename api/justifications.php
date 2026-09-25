<?php
// Justifications of absence. GET (list, scoped to who you are) | GET ?action=pending (how many wait for the coordination)
// POST {action: 'create', studentId, dateFrom, dateTo, reason} | {action: 'review', id, decision: 'aceita'|'recusada', note?} | {action: 'cancel', id}
// A family (aluno, responsável) asks; the coordination or the diretor decides. Accepting turns that student's
// absences in the period into "Justificada" (and api/sync.php does the same for absences recorded afterwards).
require __DIR__ . '/config.php';
$me = require_login();

const JUSTIFICATION_MAX_DAYS = 60;      // longest period one request may cover
const JUSTIFICATION_PAST_DAYS = 120;    // how far back it may start
const JUSTIFICATION_FUTURE_DAYS = 30;   // how far ahead (a planned appointment)
const JUSTIFICATION_MAX_PENDING = 10;   // waiting requests per student

function staff(array $me): bool { return in_array($me['role'], ['diretor', 'coordenador'], true); }

function valid_day($d): bool {
    return is_string($d) && preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $d, $m) && checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
}

function day_diff(string $a, string $b): int { return (int) round((strtotime($b) - strtotime($a)) / 86400); }

// ids of the students this person can see requests about (null = all, for the staff)
function visible_students(array $me): ?array {
    return staff($me) ? null : access_scope($me)['studentIds'];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (($_GET['action'] ?? '') === 'pending') {
        if (!staff($me)) respond(['pending' => 0]);
        respond(['pending' => (int) db()->query("SELECT COUNT(*) FROM justifications WHERE status = 'pendente'")->fetchColumn()]);
    }
    $ids = visible_students($me);
    if ($ids !== null && !$ids) respond(['items' => []]);
    $sql = 'SELECT j.*, s.name AS student_name, c.name AS class_name, cu.name AS created_name, ru.name AS reviewed_name
            FROM justifications j JOIN students s ON s.id = j.student_id LEFT JOIN classes c ON c.id = s.class_id
            LEFT JOIN users cu ON cu.id = j.created_by LEFT JOIN users ru ON ru.id = j.reviewed_by';
    $args = [];
    if ($ids !== null) { $sql .= ' WHERE j.student_id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')'; $args = $ids; }
    $sql .= " ORDER BY (j.status = 'pendente') DESC, j.created_at DESC, j.id DESC LIMIT 500";
    $stmt = db()->prepare($sql); $stmt->execute($args);
    $rows = $stmt->fetchAll();

    $files = [];
    if ($rows) {
        $in = implode(',', array_fill(0, count($rows), '?'));
        $f = db()->prepare("SELECT * FROM attachments WHERE owner_type = 'justification' AND owner_id IN ($in) ORDER BY created_at");
        $f->execute(array_column($rows, 'id'));
        foreach ($f->fetchAll() as $a) $files[$a['owner_id']][] = attachment_record($a);
    }
    respond(['items' => array_map(fn($j) => [
        'id' => $j['id'], 'studentId' => $j['student_id'], 'studentName' => $j['student_name'], 'className' => (string) $j['class_name'],
        'dateFrom' => $j['date_from'], 'dateTo' => $j['date_to'], 'reason' => $j['reason'], 'status' => $j['status'],
        'createdBy' => (string) $j['created_by'], 'createdByName' => (string) $j['created_name'], 'createdAt' => $j['created_at'],
        'reviewedByName' => (string) $j['reviewed_name'], 'reviewedAt' => (string) $j['reviewed_at'], 'reviewNote' => (string) $j['review_note'],
        'attachments' => $files[$j['id']] ?? [],
    ], $rows)]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);
$in = json_input();
$action = (string) ($in['action'] ?? '');
$bad = fn(string $m, int $status = 400) => respond(['ok' => false, 'error' => $m], $status);

if ($action === 'create') {
    $studentId = (string) ($in['studentId'] ?? '');
    $from = (string) ($in['dateFrom'] ?? ''); $to = (string) ($in['dateTo'] ?? '');
    $reason = trim(str_replace("\r\n", "\n", (string) ($in['reason'] ?? '')));
    if (!valid_id($studentId)) $bad('Escolha o aluno.');
    if (!in_array($me['role'], ['aluno', 'responsavel', 'diretor', 'coordenador'], true)) $bad('Sem permissão.', 403);
    if (!staff($me) && !in_array($studentId, access_scope($me)['studentIds'], true)) $bad('Você só pode justificar faltas do(s) seu(s) aluno(s).', 403);
    $student = fetch_record('students', $studentId);
    if (!$student) $bad('Aluno não encontrado.', 404);
    if (!valid_day($from) || !valid_day($to)) $bad('Informe as datas da falta.');
    if ($to < $from) $bad('A data final não pode ser antes da inicial.');
    if (day_diff($from, $to) + 1 > JUSTIFICATION_MAX_DAYS) $bad('O período pode ter no máximo ' . JUSTIFICATION_MAX_DAYS . ' dias.');
    if (day_diff($from, date('Y-m-d')) > JUSTIFICATION_PAST_DAYS) $bad('A falta é antiga demais para justificar por aqui. Procure a coordenação.');
    if (day_diff(date('Y-m-d'), $to) > JUSTIFICATION_FUTURE_DAYS) $bad('A data final é longe demais no futuro.');
    if ($reason === '') $bad('Explique o motivo.');
    if (mb_strlen($reason) > 1000) $bad('O motivo pode ter até 1000 caracteres.');
    $stmt = db()->prepare("SELECT COUNT(*) FROM justifications WHERE student_id = ? AND status = 'pendente'"); $stmt->execute([$studentId]);
    if ((int) $stmt->fetchColumn() >= JUSTIFICATION_MAX_PENDING) $bad('Já há pedidos demais aguardando resposta para este aluno.');

    $pdo = db(); $pdo->beginTransaction();
    $id = gen_id('jf');
    $pdo->prepare('INSERT INTO justifications (id, student_id, year_id, date_from, date_to, reason, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
        ->execute([$id, $studentId, active_year_id(), $from, $to, $reason, $me['id']]);
    audit('criar', 'justificativa', $id, $student['name'], ['de' => $from, 'ate' => $to], $me);
    // the reason itself stays out of the e-mail: it may be about health
    foreach (role_recipients(['coordenador', 'diretor']) as $r) {
        if ($r['id'] === $me['id']) continue;
        queue_email($r['email'], 'Nova justificativa de falta - ' . $student['name'],
            "Olá, {$r['name']}!\n\n{$me['name']} pediu para justificar faltas de {$student['name']} (" . date('d/m/Y', strtotime($from)) . ($to !== $from ? ' a ' . date('d/m/Y', strtotime($to)) : '')
            . ").\n\nAnalise no portal, em Justificativas:\n" . app_url());
    }
    $pdo->commit();
    $payload = ['ok' => true, 'id' => $id];
    if (email_queue_due()) respond_then($payload, fn() => drain_email_queue());
    respond($payload);
}

if ($action === 'review') {
    if (!staff($me)) $bad('Somente a coordenação ou a direção respondem.', 403);
    $id = (string) ($in['id'] ?? ''); $decision = (string) ($in['decision'] ?? ''); $note = trim((string) ($in['note'] ?? ''));
    if (!valid_id($id) || !in_array($decision, ['aceita', 'recusada'], true)) $bad('Requisição inválida.');
    if (mb_strlen($note) > 255) $bad('A observação pode ter até 255 caracteres.');
    $pdo = db(); $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM justifications WHERE id = ? FOR UPDATE'); $stmt->execute([$id]);
    $j = $stmt->fetch();
    if (!$j) { $pdo->rollBack(); $bad('Pedido não encontrado.', 404); }
    if ($j['status'] !== 'pendente') { $pdo->rollBack(); $bad('Esse pedido já foi respondido.'); }
    $pdo->prepare('UPDATE justifications SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE id = ?')
        ->execute([$decision, $me['id'], $note === '' ? null : $note, $id]);
    $changed = 0;
    if ($decision === 'aceita') {
        $stmt = $pdo->prepare("UPDATE attendance SET status = 'Justificada' WHERE student_id = ? AND date BETWEEN ? AND ? AND status = 'Falta' AND (year_id = ? OR year_id IS NULL)");
        $stmt->execute([$j['student_id'], $j['date_from'], $j['date_to'], active_year_id()]);
        $changed = $stmt->rowCount();
    }
    $student = fetch_record('students', $j['student_id']);
    audit($decision === 'aceita' ? 'aceitar_justificativa' : 'recusar_justificativa', 'justificativa', $id, $student['name'] ?? '', ['de' => $j['date_from'], 'ate' => $j['date_to'], 'faltasJustificadas' => $changed, 'observacao' => $note], $me);
    foreach (student_recipients($j['student_id']) as $r) {
        queue_email($r['email'], 'Justificativa de falta ' . ($decision === 'aceita' ? 'aceita' : 'recusada') . ' - ' . ($student['name'] ?? ''),
            "Olá, {$r['name']}!\n\nO pedido de justificativa de faltas de " . ($student['name'] ?? '') . " (" . date('d/m/Y', strtotime($j['date_from'])) . ($j['date_to'] !== $j['date_from'] ? ' a ' . date('d/m/Y', strtotime($j['date_to'])) : '')
            . ') foi ' . ($decision === 'aceita' ? 'aceito' : 'recusado') . '.' . ($note !== '' ? "\n\nObservação da escola: $note" : '') . "\n\nVeja no portal:\n" . app_url());
    }
    $pdo->commit();
    $payload = ['ok' => true, 'absencesJustified' => $changed];
    if (email_queue_due()) respond_then($payload, fn() => drain_email_queue());
    respond($payload);
}

if ($action === 'cancel') {
    $id = (string) ($in['id'] ?? '');
    if (!valid_id($id)) $bad('Requisição inválida.');
    $stmt = db()->prepare('SELECT * FROM justifications WHERE id = ?'); $stmt->execute([$id]);
    $j = $stmt->fetch();
    if (!$j) $bad('Pedido não encontrado.', 404);
    if (!staff($me) && ($j['created_by'] !== $me['id'] || $j['status'] !== 'pendente')) $bad('Você só pode retirar um pedido seu que ainda esteja aguardando.', 403);
    db()->prepare('DELETE FROM justifications WHERE id = ?')->execute([$id]);
    attach_sweep_orphans();
    audit('excluir', 'justificativa', $id, (string) (fetch_record('students', $j['student_id'])['name'] ?? ''), ['de' => $j['date_from'], 'ate' => $j['date_to']], $me);
    respond(['ok' => true]);
}

respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);
