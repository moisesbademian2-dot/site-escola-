<?php
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$in = json_input();
$token = (string) ($in['token'] ?? '');
$password = (string) ($in['password'] ?? '');

if ($token === '') respond(['ok' => false, 'error' => 'Link inválido.']);
if (mb_strlen($password) < MIN_PASSWORD_LENGTH) respond(['ok' => false, 'error' => 'A senha deve ter no mínimo ' . MIN_PASSWORD_LENGTH . ' caracteres.']);

$user = user_for_reset_token($token);
if (!$user) respond(['ok' => false, 'error' => 'Este link expirou ou já foi usado. Peça um novo.']);

db()->prepare('UPDATE users SET password = ? WHERE id = ?')->execute([hash_password($password), $user['id']]);
consume_reset_token($token);
audit('senha_redefinida', 'sessao', $user['id'], $user['name'], [], $user);
clear_attempts(email_only(login_identifiers($user['email'])));

if ($user['status'] === 'pendente') {
    respond(['ok' => true, 'message' => 'Senha redefinida. Seu cadastro ainda está aguardando aprovação do diretor.']);
}
if ($user['status'] === 'rejeitado') {
    respond(['ok' => true, 'message' => 'Senha redefinida, mas seu cadastro foi recusado. Fale com a coordenação da escola.']);
}

session_regenerate_id(true);
$_SESSION['uid'] = $user['id'];
respond(['ok' => true, 'user' => sanitize_user($user)]);
