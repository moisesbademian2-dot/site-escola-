<?php
// Used by the public signup form (responsável) to show "is this your child?" before
// creating the account. No login required -- same reasoning as public_courses.php --
// but only a name comes back, and lookups are rate-limited so a matrícula can't be
// brute-forced for names at scale.
require __DIR__ . '/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(['error' => 'Método inválido.'], 405);

$ipIds = ['lookup:ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown')];
if (too_many_attempts($ipIds, SIGNUP_IP_MAX_ATTEMPTS, SIGNUP_WINDOW_MINUTES)) respond(['found' => false, 'error' => 'Muitas tentativas. Tente mais tarde.'], 429);
record_attempt($ipIds);

$matricula = trim((string) ($_GET['matricula'] ?? ''));
if ($matricula === '' || mb_strlen($matricula) > 255) respond(['found' => false]);

$stmt = db()->prepare('SELECT id, name FROM students WHERE matricula = ? LIMIT 1');
$stmt->execute([$matricula]);
$student = $stmt->fetch();
if (!$student) respond(['found' => false]);

$stmt = db()->prepare('SELECT 1 FROM guardians WHERE student_id = ? LIMIT 1');
$stmt->execute([$student['id']]);
$hasGuardian = (bool) $stmt->fetchColumn();

respond(['found' => true, 'name' => $student['name'], 'available' => !$hasGuardian]);
