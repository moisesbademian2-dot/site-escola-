<?php
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$allowedRoles = ['aluno', 'responsavel', 'professor', 'coordenador'];

// Anyone can call this, so cap how many sign-ups one address can pile onto the approval queue.
$ipIds = ['signup:ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown')];
if (too_many_attempts($ipIds, SIGNUP_IP_MAX_ATTEMPTS, SIGNUP_WINDOW_MINUTES)) respond(['ok' => false, 'error' => 'Muitos cadastros deste endereço. Tente mais tarde.'], 429);
record_attempt($ipIds);

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
if ($name === '' || $email === '' || $celular === '') {
    respond(['ok' => false, 'error' => 'Preencha todos os campos corretamente.']);
}
foreach ([$name, $email, $celular, $matricula, $curso, $turno] as $v) {
    if (mb_strlen($v) > 255) respond(['ok' => false, 'error' => 'Preencha todos os campos corretamente.']);
}
if (mb_strlen($password) < MIN_PASSWORD_LENGTH) respond(['ok' => false, 'error' => 'A senha deve ter no mínimo ' . MIN_PASSWORD_LENGTH . ' caracteres.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['ok' => false, 'error' => 'Informe um e-mail válido.']);
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
    audit('cadastro', 'users', $userId, $name, ['papel' => $role], ['id' => $userId, 'name' => $name, 'role' => $role]);
    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    if ($e->getCode() === '23000') respond(['ok' => false, 'error' => 'Este e-mail já está cadastrado.']);
    throw $e;
}

respond(['ok' => true]);
