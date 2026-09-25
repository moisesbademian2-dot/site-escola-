<?php
// Closing and reopening the grades of a bimestre (coordenador and diretor). The state of every bimestre
// comes with state.php; this only changes it. POST {action: 'close'|'reopen'|'deadline', bimestre, deadline?}.
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);
if (!in_array($me['role'], ['diretor', 'coordenador'], true)) respond(['ok' => false, 'error' => 'Sem permissão.'], 403);

$in = json_input();
$action = (string) ($in['action'] ?? '');
$bimestre = (string) ($in['bimestre'] ?? '');
if (!in_array($bimestre, BIMESTRES, true) || !in_array($action, ['close', 'reopen', 'deadline'], true)) respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);

$deadline = trim((string) ($in['deadline'] ?? ''));
if ($deadline !== '') {
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $deadline, $m) || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) respond(['ok' => false, 'error' => 'Data inválida.'], 400);
    if ($deadline < date('Y-m-d')) respond(['ok' => false, 'error' => 'O prazo precisa ser hoje ou uma data futura.'], 400);
}

$yearId = active_year_id();
$before = grade_period($bimestre);
// close keeps the deadline as it was; reopen and deadline take the one sent ('' = none)
$newStatus = $action === 'close' ? 'fechado' : ($action === 'reopen' ? 'aberto' : $before['status']);
$newDeadline = $action === 'close' ? ($before['deadline'] !== '' ? $before['deadline'] : null) : ($deadline === '' ? null : $deadline);

db()->prepare('INSERT INTO grade_periods (year_id, bimestre, status, deadline, updated_by) VALUES (?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE status = VALUES(status), deadline = VALUES(deadline), updated_by = VALUES(updated_by)')
    ->execute([$yearId, $bimestre, $newStatus, $newDeadline, $me['id']]);

$after = grade_period($bimestre);
$details = [];
if ($before['status'] !== $after['status']) $details['situacao'] = [$before['status'], $after['status']];
if ($before['deadline'] !== $after['deadline']) $details['prazo'] = [$before['deadline'], $after['deadline']];
audit(['close' => 'fechar_periodo', 'reopen' => 'reabrir_periodo', 'deadline' => 'prazo_periodo'][$action], 'periodo', $yearId . ':' . $bimestre, $bimestre, $details, $me);

respond(['ok' => true, 'periods' => grade_periods()]);
