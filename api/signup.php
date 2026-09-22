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
if ($role === 'aluno' && ($curso === '' || $turno === '')) {
    respond(['ok' => false, 'error' => 'Selecione o curso e o turno.']);
}

$state = get_state();

$exists = false;
foreach ($state['users'] as $u) { if (strtolower($u['email']) === strtolower($email)) { $exists = true; break; } }
if ($exists) respond(['ok' => false, 'error' => 'Este e-mail já está cadastrado.']);

$parts = preg_split('/\s+/', $name);
$initials = strtoupper(implode('', array_map(fn($p) => $p !== '' ? $p[0] : '', array_slice($parts, 0, 2))));

$newUser = [
    'id' => gen_id('u'),
    'name' => $name,
    'email' => $email,
    'phone' => $celular,
    'password' => $password,
    'role' => $role,
    'avatar' => $initials,
    'createdAt' => date('c'),
    'matricula' => '',
    'status' => 'pendente',
];

if ($role === 'aluno') {
    $newUser['cursoPretendido'] = $curso;
    $newUser['turnoPretendido'] = $turno;
} elseif ($role === 'responsavel' && $matricula !== '') {
    foreach ($state['students'] as $s) {
        if ((string) ($s['matricula'] ?? '') === $matricula) { $newUser['studentId'] = $s['id']; break; }
    }
    $newUser['matricula'] = $matricula;
}

$state['users'][] = $newUser;
save_state_raw($state);

respond(['ok' => true]);
