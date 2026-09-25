<?php
// The audit trail, read-only and for the diretor only. Filters: entity, action, user (name contains),
// q (label/details contains), from/to (YYYY-MM-DD); paged with page/per, or export=1 for up to 5000 lines.
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(['error' => 'Método inválido.'], 405);
if ($me['role'] !== 'diretor') respond(['error' => 'Sem permissão.'], 403);

$where = []; $args = [];
$like = fn(string $s) => '%' . addcslashes($s, '%_\\') . '%';
foreach (['entity', 'action'] as $f) {
    $v = trim((string) ($_GET[$f] ?? ''));
    if ($v !== '') { $where[] = "$f = ?"; $args[] = $v; }
}
$user = trim((string) ($_GET['user'] ?? ''));
if ($user !== '') { $where[] = 'user_name LIKE ?'; $args[] = $like($user); }
$q = trim((string) ($_GET['q'] ?? ''));
if ($q !== '') { $where[] = '(label LIKE ? OR details LIKE ?)'; $args[] = $like($q); $args[] = $like($q); }
$isDate = fn($d) => is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) && checkdate((int) substr($d, 5, 2), (int) substr($d, 8, 2), (int) substr($d, 0, 4));
if ($isDate($_GET['from'] ?? null)) { $where[] = 'created_at >= ?'; $args[] = $_GET['from'] . ' 00:00:00'; }
if ($isDate($_GET['to'] ?? null)) { $where[] = 'created_at < ? + INTERVAL 1 DAY'; $args[] = $_GET['to'] . ' 00:00:00'; }
$sql = $where ? ' WHERE ' . implode(' AND ', $where) : '';

$export = !empty($_GET['export']);
$per = $export ? 5000 : max(1, min(100, (int) ($_GET['per'] ?? 50)));
$page = $export ? 1 : max(1, (int) ($_GET['page'] ?? 1));

$stmt = db()->prepare("SELECT COUNT(*) FROM audit_log$sql");
$stmt->execute($args);
$total = (int) $stmt->fetchColumn();

$stmt = db()->prepare("SELECT id, created_at, user_id, user_name, user_role, action, entity, entity_id, label, details, ip
                       FROM audit_log$sql ORDER BY id DESC LIMIT $per OFFSET " . (($page - 1) * $per));
$stmt->execute($args);
$rows = array_map(function ($r) {
    $r['details'] = $r['details'] !== null ? json_decode($r['details'], true) : null;
    return $r;
}, $stmt->fetchAll());

respond(['rows' => $rows, 'total' => $total, 'page' => $page, 'per' => $per]);
