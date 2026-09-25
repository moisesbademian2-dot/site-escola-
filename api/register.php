<?php
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$in = json_input();
$name = trim((string) ($in['name'] ?? ''));
$email = trim((string) ($in['email'] ?? ''));
$password = (string) ($in['password'] ?? '');

if ($name === '' || $email === '' || mb_strlen($name) > 255 || mb_strlen($email) > 255) {
    respond(['ok' => false, 'error' => 'Preencha todos os campos corretamente.']);
}

if (mb_strlen($password) < MIN_PASSWORD_LENGTH) respond(['ok' => false, 'error' => 'A senha deve ter no mínimo ' . MIN_PASSWORD_LENGTH . ' caracteres.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['ok' => false, 'error' => 'Informe um e-mail válido.']);

$pdo = db();
$pdo->beginTransaction();
// Lock the table so two simultaneous requests can't both create the first administrator.
$pdo->query('SELECT id FROM users LIMIT 1 FOR UPDATE');
if (user_count() > 0) {
    $pdo->rollBack();
    respond(['ok' => false, 'error' => 'Já existe um administrador cadastrado.']);
}

$user = [
    'id' => gen_id('u'), 'name' => $name, 'email' => $email, 'role' => 'diretor',
    'avatar' => initials_of($name), 'createdAt' => date('c'), 'status' => 'aprovado',
];
$pdo->prepare('INSERT INTO users (id, name, email, password, role, avatar, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    ->execute([$user['id'], $name, $email, hash_password($password), 'diretor', $user['avatar'], $user['createdAt'], 'aprovado']);
audit('cadastro', 'users', $user['id'], $name, ['papel' => 'diretor', 'observacao' => 'primeiro acesso'], $user);
$pdo->commit();

session_regenerate_id(true);
$_SESSION['uid'] = $user['id'];
respond(['ok' => true, 'user' => record_from_row('users', ['id' => $user['id'], 'name' => $name, 'email' => $email, 'role' => 'diretor', 'avatar' => $user['avatar'], 'created_at' => $user['createdAt'], 'status' => 'aprovado'])]);
