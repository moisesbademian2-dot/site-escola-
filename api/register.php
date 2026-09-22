<?php
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$state = get_state();
if (!empty($state['users'])) respond(['ok' => false, 'error' => 'Já existe um administrador cadastrado.']);

$in = json_input();
$name = trim((string) ($in['name'] ?? ''));
$email = trim((string) ($in['email'] ?? ''));
$password = (string) ($in['password'] ?? '');

if ($name === '' || $email === '' || strlen($password) < 4) {
    respond(['ok' => false, 'error' => 'Preencha todos os campos corretamente.']);
}

$parts = preg_split('/\s+/', $name);
$initials = strtoupper(implode('', array_map(fn($p) => $p !== '' ? $p[0] : '', array_slice($parts, 0, 2))));

$user = [
    'id' => gen_id('u'),
    'name' => $name,
    'email' => $email,
    'password' => $password,
    'role' => 'diretor',
    'avatar' => $initials,
    'createdAt' => date('c'),
    'matricula' => '',
    'status' => 'aprovado',
];
$state['users'][] = $user;
save_state_raw($state);
$_SESSION['uid'] = $user['id'];

respond(['ok' => true, 'user' => sanitize_user($user)]);
