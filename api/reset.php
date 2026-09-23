<?php
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);
if ($me['role'] !== 'diretor') respond(['error' => 'Sem permissão.'], 403);

$pdo = db();
$pdo->beginTransaction();
foreach (DELETE_ORDER as $coll) $pdo->exec("DELETE FROM `$coll`");
seed_default_subjects();
$pdo->commit();

$_SESSION = [];
session_destroy();
respond(['ok' => true]);
