<?php
require __DIR__ . '/config.php';
respond(['isFirstUser' => user_count() === 0]);
