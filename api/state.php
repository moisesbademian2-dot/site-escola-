<?php
// Everything the front end renders, filtered by the user's role. Changes go through sync.php.
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(['error' => 'Método inválido.'], 405);
respond(visible_state($me));
