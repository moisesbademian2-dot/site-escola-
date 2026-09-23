<?php
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$in = json_input();
$email = trim((string) ($in['email'] ?? ''));
$password = (string) ($in['password'] ?? '');

$found = $email !== '' ? find_user('email', $email) : null;
if (!$found || !check_password($found, $password)) respond(['ok' => false, 'error' => 'E-mail ou senha inválidos.']);

if ($found['status'] === 'pendente') {
    respond(['ok' => false, 'error' => 'Seu cadastro ainda está aguardando aprovação do diretor.']);
}
if ($found['status'] === 'rejeitado') {
    respond(['ok' => false, 'error' => 'Seu cadastro foi recusado. Fale com a coordenação da escola.']);
}

session_regenerate_id(true);
$_SESSION['uid'] = $found['id'];
respond(['ok' => true, 'user' => sanitize_user($found)]);
