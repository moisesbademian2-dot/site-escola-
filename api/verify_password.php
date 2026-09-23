<?php
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$in = json_input();
$password = (string) ($in['password'] ?? '');
respond(['ok' => check_password($me, $password)]);
