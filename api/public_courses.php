<?php
require __DIR__ . '/config.php';
$state = get_state();
$courses = [];
foreach ($state['classes'] as $c) {
    $name = trim((string) ($c['course'] ?? ''));
    if ($name !== '' && !in_array($name, $courses, true)) $courses[] = $name;
}
sort($courses);
respond(['courses' => $courses]);
