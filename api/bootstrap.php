<?php
require __DIR__ . '/config.php';
$state = get_state();
respond(['isFirstUser' => empty($state['users'])]);
