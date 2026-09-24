<?php
// Everything the front end renders, filtered by the user's role. Changes go through sync.php.
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(['error' => 'Método inválido.'], 405);
$state = visible_state($me);
// Also the moment to retry e-mails that failed earlier, once the page has its data.
if (email_queue_due()) respond_then($state, fn() => drain_email_queue());
respond($state);
