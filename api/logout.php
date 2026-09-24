<?php
require __DIR__ . '/config.php';
// POST only: a GET here would let any page log a visitor out just by loading an <img>.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);
$_SESSION = [];
session_destroy();
respond(['ok' => true]);
