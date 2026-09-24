<?php
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);
if ($me['role'] !== 'diretor') respond(['error' => 'Sem permissão.'], 403);

// Wipes the whole school, so the password is asked for here too, not only on screen.
$ids = ['verify:' . $me['id']];
if (too_many_attempts($ids)) respond(['ok' => false, 'error' => 'Muitas tentativas. Aguarde alguns minutos.'], 429);
if (!check_password($me, (string) (json_input()['password'] ?? ''))) {
    record_attempt($ids);
    respond(['ok' => false, 'error' => 'Senha incorreta.'], 403);
}

$pdo = db();
$pdo->beginTransaction();
foreach (DELETE_ORDER as $coll) $pdo->exec("DELETE FROM `$coll`");
$pdo->exec('DELETE FROM email_queue'); // nobody is left to notify
seed_default_subjects();
$pdo->commit();

$_SESSION = [];
session_destroy();
respond(['ok' => true]);
