<?php
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$in = json_input();
$email = trim((string) ($in['email'] ?? ''));
$password = (string) ($in['password'] ?? '');

$ids = login_identifiers($email);
if (too_many_attempts($ids)) {
    respond(['ok' => false, 'error' => 'Muitas tentativas. Aguarde alguns minutos antes de tentar de novo.'], 429);
}

$found = $email !== '' ? find_user('email', $email) : null;
if (!$found || !check_password($found, $password)) {
    record_attempt($ids);
    respond(['ok' => false, 'error' => 'E-mail ou senha inválidos.']);
}

if ($found['status'] === 'pendente') {
    respond(['ok' => false, 'error' => 'Seu cadastro ainda está aguardando aprovação do diretor.']);
}
if ($found['status'] === 'rejeitado') {
    respond(['ok' => false, 'error' => 'Seu cadastro foi recusado. Fale com a coordenação da escola.']);
}

clear_attempts($ids);
session_regenerate_id(true);
$_SESSION['uid'] = $found['id'];
respond(['ok' => true, 'user' => sanitize_user($found)]);
