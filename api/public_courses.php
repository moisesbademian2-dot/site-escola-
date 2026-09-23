<?php
require __DIR__ . '/config.php';
$courses = db()->query("SELECT DISTINCT TRIM(course) FROM classes WHERE TRIM(course) <> '' ORDER BY 1")->fetchAll(PDO::FETCH_COLUMN);
respond(['courses' => $courses]);
