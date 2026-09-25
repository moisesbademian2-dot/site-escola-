<?php
// School years. GET ?year=<id>&student=<id>: one student's grades and attendance in a year (the frozen
// history). POST {action: 'update'}: rename the active year. POST {action: 'rollover'}: close the active
// year and open the next one, moving each student to the class they were promoted to (diretor only).
require __DIR__ . '/config.php';
$me = require_login();

const DECISIONS = ['Promovido', 'Retido', 'Concluído'];

function valid_date_or_empty(string $d): bool {
    return $d === '' || (bool) (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $d, $m) && checkdate((int) $m[2], (int) $m[3], (int) $m[1]));
}

function read_year_fields(array $in, ?string $ignoreId): array {
    $name = trim((string) ($in['name'] ?? ''));
    $start = trim((string) ($in['startDate'] ?? '')); $end = trim((string) ($in['endDate'] ?? ''));
    if ($name === '' || mb_strlen($name) > 100) throw new BadInput('Informe o nome do ano letivo (até 100 caracteres).');
    if (!valid_date_or_empty($start) || !valid_date_or_empty($end)) throw new BadInput('Data inválida.');
    if ($start !== '' && $end !== '' && $end < $start) throw new BadInput('A data final não pode ser antes da inicial.');
    $stmt = db()->prepare('SELECT COUNT(*) FROM school_years WHERE name = ? AND id <> ?');
    $stmt->execute([$name, $ignoreId ?? '']);
    if ($stmt->fetchColumn() > 0) throw new BadInput('Já existe um ano letivo com esse nome.');
    return [$name, $start === '' ? null : $start, $end === '' ? null : $end];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $yearId = (string) ($_GET['year'] ?? ''); $studentId = (string) ($_GET['student'] ?? '');
    if (!valid_id($yearId) || !valid_id($studentId)) respond(['error' => 'Requisição inválida.'], 400);
    if (!in_array($me['role'], ['diretor', 'coordenador'], true) && !in_array($studentId, access_scope($me)['studentIds'], true)) {
        respond(['error' => 'Sem permissão.'], 403);
    }
    $stmt = db()->prepare('SELECT * FROM school_years WHERE id = ?'); $stmt->execute([$yearId]);
    $year = $stmt->fetch();
    if (!$year) respond(['error' => 'Ano letivo não encontrado.'], 404);
    $stmt = db()->prepare('SELECT * FROM enrollments WHERE year_id = ? AND student_id = ?'); $stmt->execute([$yearId, $studentId]);
    $enr = $stmt->fetch();
    $data = student_year_data($studentId, $yearId);
    respond([
        'year' => year_record($year), 'enrollment' => $enr ? enrollment_record($enr) : null,
        'grades' => $data['grades'], 'attendance' => $data['attendance'],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);
if ($me['role'] !== 'diretor') respond(['error' => 'Sem permissão.'], 403);
$in = json_input();
$action = (string) ($in['action'] ?? '');

if ($action === 'update') {
    try {
        $activeId = active_year_id();
        [$name, $start, $end] = read_year_fields($in, $activeId);
    } catch (BadInput $e) { respond(['ok' => false, 'error' => $e->getMessage()], 400); }
    $old = db()->prepare('SELECT * FROM school_years WHERE id = ?'); $old->execute([$activeId]); $old = $old->fetch();
    db()->prepare('UPDATE school_years SET name = ?, start_date = ?, end_date = ? WHERE id = ?')->execute([$name, $start, $end, $activeId]);
    $d = [];
    if ($old['name'] !== $name) $d['name'] = [$old['name'], $name];
    if ((string) $old['start_date'] !== (string) $start) $d['startDate'] = [(string) $old['start_date'], (string) $start];
    if ((string) $old['end_date'] !== (string) $end) $d['endDate'] = [(string) $old['end_date'], (string) $end];
    if ($d) audit('alterar', 'ano_letivo', $activeId, $name, $d, $me);
    respond(['ok' => true]);
}

if ($action !== 'rollover') respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);

// Closing a year can't be undone from the screens, so the password is asked for here too.
$ids = ['verify:' . $me['id']];
if (too_many_attempts($ids)) respond(['ok' => false, 'error' => 'Muitas tentativas. Aguarde alguns minutos.'], 429);
if (!check_password($me, (string) ($in['password'] ?? ''))) {
    record_attempt($ids);
    respond(['ok' => false, 'error' => 'Senha incorreta.'], 403);
}
clear_attempts($ids);

$pdo = db();
$pdo->beginTransaction();
try {
    $oldId = active_year_id();
    [$newName, $newStart, $newEnd] = read_year_fields($in, null);

    // Everything the active year holds without a year yet (older data) is now stamped with it for good.
    foreach (YEAR_SCOPED as $t) $pdo->prepare("UPDATE `$t` SET year_id = ? WHERE year_id IS NULL")->execute([$oldId]);

    $classes = [];
    $stmt = $pdo->prepare('SELECT * FROM classes WHERE year_id = ?'); $stmt->execute([$oldId]);
    foreach ($stmt->fetchAll() as $row) $classes[$row['id']] = $row;

    $plan = [];
    foreach ((array) ($in['classes'] ?? []) as $p) {
        if (!is_array($p) || !isset($classes[$p['classId'] ?? ''])) throw new BadInput('Turma inválida no plano de encerramento.');
        $plan[$p['classId']] = $p;
    }

    // Every student of every class needs a decision; whoever is not "Ativo" simply leaves the class.
    $moves = []; // [student row, class row, decision, target key|null]
    foreach ($classes as $cid => $class) {
        $stmt = $pdo->prepare('SELECT * FROM students WHERE class_id = ?'); $stmt->execute([$cid]);
        $students = $stmt->fetchAll();
        if (!$students) continue;
        if (!isset($plan[$cid])) throw new BadInput('Faltam as decisões da turma ' . $class['name'] . '.');
        $p = $plan[$cid];
        $promoteTo = isset($p['promoteTo']) && $p['promoteTo'] !== null ? trim((string) $p['promoteTo']) : null;
        if ($promoteTo !== null && (mb_strlen($promoteTo) > 255)) throw new BadInput('Nome de turma muito longo.');
        foreach ($students as $s) {
            if ($s['status'] !== 'Ativo') { $moves[] = [$s, $class, 'Desligado', null]; continue; }
            $dec = (string) (($p['students'] ?? [])[$s['id']] ?? '');
            if (!in_array($dec, DECISIONS, true)) throw new BadInput('Falta decidir o aluno ' . $s['name'] . ' (turma ' . $class['name'] . ').');
            if ($dec === 'Promovido' && ($promoteTo === null || $promoteTo === '')) throw new BadInput('Informe a turma de destino de ' . $class['name'] . ' ou marque os alunos como concluídos/retidos.');
            $moves[] = [$s, $class, $dec, $dec === 'Promovido' ? $promoteTo : ($dec === 'Retido' ? $class['name'] : null)];
        }
    }

    // Snapshot the school record from the old year's data BEFORE anything moves.
    $enroll = [];
    foreach ($moves as [$s, $class, $dec, $target]) {
        $data = student_year_data($s['id'], $oldId);
        $enroll[] = [$s, $class, $dec, $data];
    }

    $pdo->prepare("UPDATE school_years SET status = 'encerrado', closed_at = NOW() WHERE id = ?")->execute([$oldId]);
    $newId = gen_id('y');
    $pdo->prepare("INSERT INTO school_years (id, name, start_date, end_date, status) VALUES (?, ?, ?, ?, 'ativo')")->execute([$newId, $newName, $newStart, $newEnd]);

    $newClasses = []; // "name|course" => new class id
    $newClassFor = function (string $name, array $from) use ($pdo, $newId, &$newClasses): string {
        $key = mb_strtolower($name) . '|' . mb_strtolower((string) $from['course']);
        if (!isset($newClasses[$key])) {
            $id = gen_id('c');
            $pdo->prepare('INSERT INTO classes (id, name, course, semester, period, room, teacher_id, year_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([$id, $name, $from['course'], $from['semester'], $from['period'], $from['room'], $from['teacher_id'], $newId]);
            $newClasses[$key] = $id;
        }
        return $newClasses[$key];
    };

    $count = ['Promovido' => 0, 'Retido' => 0, 'Concluído' => 0, 'Desligado' => 0];
    foreach ($moves as $i => [$s, $class, $dec, $target]) {
        $newClassId = $target !== null ? $newClassFor($target, $class) : null;
        $status = $dec === 'Concluído' ? 'Concluído' : $s['status'];
        $pdo->prepare('UPDATE students SET class_id = ?, status = ? WHERE id = ?')->execute([$newClassId, $status, $s['id']]);
        $data = $enroll[$i][3];
        $pdo->prepare('INSERT INTO enrollments (id, year_id, student_id, student_name, class_id, class_name, average, frequency, result, decision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([gen_id('en'), $oldId, $s['id'], $s['name'], $class['id'], $class['name'],
                $data['average'] === null ? null : round($data['average'], 2), $data['frequency'] === null ? null : round($data['frequency'], 1), $data['result'], $dec]);
        $count[$dec]++;
    }

    $oldName = (string) $pdo->query('SELECT name FROM school_years WHERE id = ' . $pdo->quote($oldId))->fetchColumn();
    audit('encerrar_ano', 'ano_letivo', $oldId, $oldName, [
        'novoAno' => $newName, 'turmasNovas' => count($newClasses), 'promovidos' => $count['Promovido'], 'retidos' => $count['Retido'],
        'concluidos' => $count['Concluído'], 'desligados' => $count['Desligado'],
    ], $me);
    $pdo->commit();
} catch (BadInput $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    respond(['ok' => false, 'error' => $e->getMessage()], 400);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($e->getCode() === '23000') respond(['ok' => false, 'error' => 'Já existe um ano letivo com esse nome.'], 400);
    throw $e;
}

respond(['ok' => true, 'yearId' => $newId]);
