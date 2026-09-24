<?php
// The logged-in user's own settings: for now, whether to receive e-mail notifications.
// It has its own endpoint (instead of being a field of the users records that sync.php
// handles) because sync.php only lets the diretor write users, and because a diretor
// re-saving somebody's account must not be able to flip this back.
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$in = json_input();
if (!isset($in['notifyEmail']) || !is_bool($in['notifyEmail'])) respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);

db()->prepare('UPDATE users SET notify_email = ? WHERE id = ?')->execute([$in['notifyEmail'] ? '1' : '0', $me['id']]);
respond(['ok' => true, 'notifyEmail' => $in['notifyEmail'] ? '1' : '0']);
