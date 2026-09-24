<?php
// Starts a password reset: e-mails a one-time link if the address belongs to an
// account. Always responds the same way either way, so this can't be used to
// check which e-mails are registered.
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$email = trim((string) (json_input()['email'] ?? ''));
$generic = ['ok' => true, 'message' => 'Se esse e-mail estiver cadastrado, enviamos um link de redefinição. Confira também o spam.'];

if ($email === '') respond($generic);

$ids = reset_identifiers($email);
if (reset_blocked($email)) {
    respond(['ok' => false, 'error' => 'Muitos pedidos. Aguarde um pouco antes de tentar de novo.'], 429);
}
record_attempt($ids);

$user = find_user('email', $email);
if ($user) {
    $token = create_reset_token($user['id']);
    $link = app_url() . '?reset=' . $token;

    $body = "Olá, {$user['name']}!\n\n" .
        "Recebemos um pedido para redefinir sua senha no Portal of Future. Para continuar, acesse o link abaixo (válido por " . RESET_TOKEN_MINUTES . " minutos):\n\n" .
        "$link\n\n" .
        "Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.";
    send_mail($email, 'Redefinir senha - Portal of Future', $body);
}

respond($generic);
