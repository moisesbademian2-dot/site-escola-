<?php
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$in = json_input();
$email = strtolower(trim((string) ($in['email'] ?? '')));
$password = (string) ($in['password'] ?? '');

$state = get_state();
$found = null;
foreach ($state['users'] as $u) {
    if (strtolower($u['email']) === $email && ($u['password'] ?? '') === $password) { $found = $u; break; }
}

if (!$found) respond(['ok' => false, 'error' => 'E-mail ou senha inválidos.']);

$status = $found['status'] ?? 'aprovado';
if ($status === 'pendente') {
    respond(['ok' => false, 'error' => 'Seu cadastro ainda está aguardando aprovação do diretor.']);
}
if ($status === 'rejeitado') {
    respond(['ok' => false, 'error' => 'Seu cadastro foi recusado. Fale com a coordenação da escola.']);
}

$_SESSION['uid'] = $found['id'];
respond(['ok' => true, 'user' => sanitize_user($found)]);
