<?php
// Applies the changes the front end made since its last load:
// { "changes": { "<collection>": { "upsert": [records], "delete": [ids] } } }
// Every record is checked against the user's role; one refusal rolls back the whole request.
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$changes = json_input()['changes'] ?? null;
if (!is_array($changes)) respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);
foreach ($changes as $coll => $ops) {
    if (!isset(COLLECTIONS[$coll]) || !is_array($ops)) respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);
}

$scope = access_scope($me);
$pdo = db();

function fail(string $error, int $status): void {
    if (db()->inTransaction()) db()->rollBack();
    respond(['ok' => false, 'error' => $error], $status);
}

function deny(): void {
    fail('Você não tem permissão para fazer essa alteração.', 403);
}

function same_record(array $a, array $b): bool {
    foreach ($a as $k => $v) { if ((string) $v !== (string) ($b[$k] ?? '')) return false; }
    return true;
}

// Everything this request did that somebody should hear about. It becomes queued
// e-mail right before the commit, so a request that fails sends nothing.
$notify = ['approved' => [], 'rejected' => [], 'grades' => [], 'announcements' => []];

// Turns $notify into rows of email_queue: same transaction as the change itself.
function queue_change_notifications(array $n): void {
    $footer = "\n\n--\nVocê recebe este e-mail porque tem conta no Portal of Future. Para deixar de receber\nnotificações, desmarque a opção em \"Minha conta\" (clique no seu nome no menu lateral).";

    foreach ($n['approved'] as $u) {
        queue_email($u['email'], 'Seu cadastro foi aprovado - Portal of Future',
            "Olá, {$u['name']}!\n\nSeu cadastro no Portal of Future foi aprovado. Você já pode entrar:\n\n" . app_url());
    }
    foreach ($n['rejected'] as $u) {
        queue_email($u['email'], 'Seu cadastro não foi aprovado - Portal of Future',
            "Olá, {$u['name']}.\n\nSeu pedido de cadastro no Portal of Future não foi aprovado. Em caso de dúvida, fale com a coordenação da escola.");
    }

    $subjects = [];
    foreach ($n['grades'] as $studentId => $grades) {
        $student = fetch_record('students', $studentId);
        $recipients = $student ? student_recipients($studentId) : [];
        if (!$recipients) continue;
        $lines = array_map(function ($g) use (&$subjects) {
            $sid = $g['subjectId'];
            if (!isset($subjects[$sid])) $subjects[$sid] = ($sid !== '' ? (fetch_record('subjects', $sid)['name'] ?? null) : null) ?? 'Disciplina';
            return '- ' . $subjects[$sid] . ' / ' . ($g['assessment'] !== '' ? $g['assessment'] : 'Avaliação')
                . ': ' . number_format((float) $g['value'], 1, ',', '.') . ($g['bimestre'] !== '' ? ' (' . $g['bimestre'] . ')' : '');
        }, $grades);
        foreach ($recipients as $r) {
            queue_email($r['email'], 'Nova nota lançada - ' . $student['name'],
                "Olá, {$r['name']}!\n\n" . (count($grades) === 1 ? 'Foi lançada uma nova nota' : 'Foram lançadas novas notas') . " para {$student['name']}:\n\n"
                . implode("\n", $lines) . "\n\nVeja os detalhes no portal:\n" . app_url() . $footer);
        }
    }

    $targets = ['Professores' => ['professor'], 'Alunos' => ['aluno'], 'Responsáveis' => ['responsavel']];
    foreach ($n['announcements'] as $a) {
        // Todos (or no target) reaches everyone the announcement is shown to; the staff
        // who publish them aren't e-mailed about their own mural.
        foreach (role_recipients($targets[$a['target']] ?? ['professor', 'aluno', 'responsavel']) as $r) {
            queue_email($r['email'], 'Novo comunicado: ' . $a['title'],
                "Olá, {$r['name']}!\n\n" . ($a['author'] !== '' ? $a['author'] . ' publicou' : 'Foi publicado') . " um comunicado no Portal of Future:\n\n"
                . $a['title'] . "\n\n" . mb_substr($a['message'], 0, 1500) . (mb_strlen($a['message']) > 1500 ? '…' : '')
                . "\n\nLeia no portal:\n" . app_url() . $footer);
        }
    }
}

$pdo->beginTransaction();
try {
    foreach (DELETE_ORDER as $coll) {
        foreach (($changes[$coll]['delete'] ?? []) as $id) {
            if (!valid_id($id)) throw new BadInput('Identificador inválido.');
            $old = fetch_record($coll, $id);
            if ($old === null) continue; // already gone, e.g. removed by a cascade earlier in this request
            if (!can_write($me, $scope, $coll, $old, null)) deny();

            if ($coll === 'users') {
                if ($id === $me['id']) fail('Você não pode excluir a própria conta.', 400);
                if ($old['status'] === 'pendente') $notify['rejected'][] = $old; // rejecting a signup deletes it
                $pdo->prepare('UPDATE teachers SET user_id = NULL WHERE user_id = ?')->execute([$id]);
            }
            if ($coll === 'teachers') {
                // A deleted teacher loses its professor login too (same behavior the screen always had).
                $stmt = $pdo->prepare("SELECT id FROM users WHERE role = 'professor' AND (id = ? OR email = ?)");
                $stmt->execute([$old['userId'], $old['email']]);
                foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $uid) {
                    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$uid]);
                }
            }
            $pdo->prepare("DELETE FROM `$coll` WHERE id = ?")->execute([$id]);
            audit('excluir', $coll, $id, audit_label($coll, $old), audit_diff($coll, $old, null), $me);
        }
    }

    foreach (UPSERT_ORDER as $coll) {
        foreach (($changes[$coll]['upsert'] ?? []) as $rec) {
            if (!is_array($rec) || !valid_id($rec['id'] ?? null)) throw new BadInput('Registro inválido.');
            $id = $rec['id'];
            $old = fetch_record($coll, $id);

            // A field missing from the payload keeps its stored value instead of being
            // cleared — the front end always sends full records, but the server doesn't
            // depend on that. An explicit '' still clears a field.
            $merged = $rec;
            if ($old !== null) {
                foreach (COLLECTIONS[$coll] as $field => $type) {
                    if (!array_key_exists($field, $rec)) $merged[$field] = $old[$field];
                }
            }

            $cols = row_from_record($coll, $merged);
            $new = record_from_row($coll, ['id' => $id] + $cols);

            $password = null;
            if ($coll === 'users' && isset($rec['password']) && $rec['password'] !== '') {
                $password = (string) $rec['password'];
                if (mb_strlen($password) < MIN_PASSWORD_LENGTH) throw new BadInput('A senha deve ter no mínimo ' . MIN_PASSWORD_LENGTH . ' caracteres.');
            }

            // The front end resends records it didn't really change (or that a cascade already
            // updated here); those are no-ops and need no permission.
            if ($old !== null && $password === null && same_record($old, $new)) continue;
            if (!can_write($me, $scope, $coll, $old, $new)) deny();

            if ($coll === 'users') {
                if ($password !== null) $cols['password'] = hash_password($password);
                elseif ($old === null) throw new BadInput('Informe a senha do novo usuário.');
            }

            if ($old === null) {
                $cols = ['id' => $id] + $cols;
                $names = implode(', ', array_map(fn($c) => "`$c`", array_keys($cols)));
                $marks = implode(', ', array_fill(0, count($cols), '?'));
                $pdo->prepare("INSERT INTO `$coll` ($names) VALUES ($marks)")->execute(array_values($cols));
            } else {
                $sets = implode(', ', array_map(fn($c) => "`$c` = ?", array_keys($cols)));
                $pdo->prepare("UPDATE `$coll` SET $sets WHERE id = ?")->execute([...array_values($cols), $id]);
            }

            $details = audit_diff($coll, $old, $new);
            if ($password !== null && $old !== null) $details['senha'] = ['', '(alterada)'];
            audit($old === null ? 'criar' : 'alterar', $coll, $id, audit_label($coll, $new), $details, $me);

            if ($coll === 'users' && $old !== null && $old['status'] === 'pendente' && $new['status'] === 'aprovado') $notify['approved'][] = $new;
            // only NEW grades and announcements notify; editing an existing one stays quiet
            if ($old === null && $coll === 'grades' && $new['studentId'] !== '') $notify['grades'][$new['studentId']][] = $new;
            if ($old === null && $coll === 'announcements') $notify['announcements'][] = $new;
        }
    }

    // Demoting or removing accounts must never leave the school with nobody who can manage it
    // (nothing on screen could fix that afterwards).
    if (isset($changes['users']) && (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'diretor' AND status = 'aprovado'")->fetchColumn() < 1) {
        throw new BadInput('O sistema precisa ter pelo menos um diretor aprovado.');
    }

    queue_change_notifications($notify);
    $pdo->commit();
} catch (BadInput $e) {
    fail($e->getMessage(), 400);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') fail('Dados inválidos: e-mail já cadastrado ou registro relacionado inexistente.', 400);
    // 22001 = text longer than its column, 22003 = number out of range: the person's input, not a server fault
    if (in_array($e->getCode(), ['22001', '22003', '22007'], true)) fail('Dados inválidos: algum campo passou do tamanho ou do valor permitido.', 400);
    throw $e;
}

// Send whatever is queued only after answering, so saving never waits on the SMTP server.
if (email_queue_due()) respond_then(['ok' => true], fn() => drain_email_queue());
respond(['ok' => true]);
