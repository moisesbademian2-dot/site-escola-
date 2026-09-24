<?php
// "Confirm your password" for destructive actions. It's a password oracle for whoever
// holds the session, so it is rate limited like the login.
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$ids = ['verify:' . $me['id']];
if (too_many_attempts($ids)) respond(['ok' => false, 'error' => 'Muitas tentativas. Aguarde alguns minutos.'], 429);

$password = (string) (json_input()['password'] ?? '');
if (!check_password($me, $password)) {
    record_attempt($ids);
    respond(['ok' => false]);
}
clear_attempts($ids);
respond(['ok' => true]);
