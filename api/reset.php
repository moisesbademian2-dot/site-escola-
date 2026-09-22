<?php
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);
if ($me['role'] !== 'diretor') respond(['error' => 'Sem permissão.'], 403);

save_state_raw(empty_state());
$_SESSION = [];
session_destroy();
respond(['ok' => true]);
