<?php
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$allowedRoles = ['aluno', 'responsavel', 'professor', 'coordenador'];

$in = json_input();
$role = (string) ($in['role'] ?? '');
$name = trim((string) ($in['name'] ?? ''));
$email = trim((string) ($in['email'] ?? ''));
$celular = trim((string) ($in['celular'] ?? ''));
$password = (string) ($in['password'] ?? '');
$matricula = trim((string) ($in['matricula'] ?? ''));
$curso = trim((string) ($in['curso'] ?? ''));
$turno = trim((string) ($in['turno'] ?? ''));

if (!in_array($role, $allowedRoles, true)) respond(['ok' => false, 'error' => 'Papel inválido.']);
if ($name === '' || $email === '' || $celular === '' || strlen($password) < 4) {
    respond(['ok' => false, 'error' => 'Preencha todos os campos corretamente.']);
}
foreach ([$name, $email, $celular, $matricula, $curso, $turno] as $v) {
    if (mb_strlen($v) > 255) respond(['ok' => false, 'error' => 'Preencha todos os campos corretamente.']);
}
if ($role === 'aluno' && ($curso === '' || $turno === '')) {
    respond(['ok' => false, 'error' => 'Selecione o curso e o turno.']);
}

if (find_user('email', $email)) respond(['ok' => false, 'error' => 'Este e-mail já está cadastrado.']);

// A matrícula hint for responsável just pre-links the first child, same as
// today; the diretor can add more (or fix a typo) later from Usuários.
$studentId = null;
$savedMatricula = null;
if ($role === 'responsavel' && $matricula !== '') {
    $stmt = db()->prepare('SELECT id FROM students WHERE matricula = ? LIMIT 1');
    $stmt->execute([$matricula]);
    $studentId = $stmt->fetchColumn() ?: null;
    $savedMatricula = $matricula;
}

$userId = gen_id('u');
$pdo = db();
$pdo->beginTransaction();
try {
    $pdo->prepare('INSERT INTO users (id, name, email, phone, password, role, avatar, created_at, matricula, status, curso_pretendido, turno_pretendido)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([
            $userId, $name, $email, $celular, hash_password($password), $role, initials_of($name), date('c'),
            $savedMatricula, 'pendente', $role === 'aluno' ? $curso : null, $role === 'aluno' ? $turno : null,
        ]);
    if ($studentId !== null) {
        $pdo->prepare('INSERT INTO guardians (id, user_id, student_id) VALUES (?, ?, ?)')
            ->execute([gen_id('gd'), $userId, $studentId]);
    }
    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    if ($e->getCode() === '23000') respond(['ok' => false, 'error' => 'Este e-mail já está cadastrado.']);
    throw $e;
}

respond(['ok' => true]);
