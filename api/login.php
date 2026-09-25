<?php
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$in = json_input();
$email = trim((string) ($in['email'] ?? ''));
$password = (string) ($in['password'] ?? '');

if (login_blocked($email)) {
    respond(['ok' => false, 'error' => 'Muitas tentativas. Aguarde alguns minutos antes de tentar de novo.'], 429);
}

$found = $email !== '' ? find_user('email', $email) : null;
// Checked even when there's no such account, so the response takes about as long either
// way and can't be used to tell which e-mails are registered.
$hash = $found ? $found['password'] : '$2y$10$9hG0YpxnMb4RSepC6Gf.i.YpY/TKpHTobEiFP9vVnoCUfieEJ6tOC';
$passwordOk = password_verify($password, $hash) && $found !== null;
if (!$passwordOk) {
    record_attempt(login_identifiers($email));
    audit('falha_login', 'sessao', $found['id'] ?? null, mb_substr($email, 0, 255), [], $found ?: ['id' => null, 'name' => null, 'role' => null]);
    respond(['ok' => false, 'error' => 'E-mail ou senha inválidos.']);
}

if ($found['status'] === 'pendente') {
    respond(['ok' => false, 'error' => 'Seu cadastro ainda está aguardando aprovação do diretor.']);
}
if ($found['status'] === 'rejeitado') {
    respond(['ok' => false, 'error' => 'Seu cadastro foi recusado. Fale com a coordenação da escola.']);
}

clear_attempts(email_only(login_identifiers($email)));
session_regenerate_id(true);
$_SESSION['uid'] = $found['id'];
audit('entrar', 'sessao', $found['id'], $found['name'], [], $found);
respond(['ok' => true, 'user' => sanitize_user($found)]);
