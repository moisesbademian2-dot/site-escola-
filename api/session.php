<?php
require __DIR__ . '/config.php';
$u = current_user();
respond(['user' => $u ? sanitize_user($u) : null]);
