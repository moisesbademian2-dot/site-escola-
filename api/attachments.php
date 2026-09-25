<?php
// Attachments. POST ?action=upload&ownerType=activity|lesson|justification&ownerId=<id>&name=<file name>  (the file is the raw request body)
//              POST {action: 'delete', id}
//              GET  ?action=download&id=<id>[&inline=1]
// Who may add, remove or read a file follows the owner: class material follows the class (professor of it,
// coordination, diretor write; alunos and responsáveis of its students read); a justification's files follow the
// student (the family that sent it and the school staff).
require __DIR__ . '/config.php';
$me = require_login();

const UPLOAD_RATE = 30;
const UPLOAD_WINDOW = 10;

function is_staff(array $me): bool { return in_array($me['role'], ['diretor', 'coordenador'], true); }

// The record an attachment hangs from, with the ids that decide access: ['classId' => ?, 'studentId' => ?, 'yearId' => ?, 'record' => ...].
function attach_owner(string $type, string $id): ?array {
    if ($type === 'activity' || $type === 'lesson') {
        $coll = $type === 'activity' ? 'activities' : 'lessons';
        $rec = fetch_record($coll, $id);
        if (!$rec) return null;
        return ['coll' => $coll, 'record' => $rec, 'classId' => $rec['classId'], 'studentId' => null, 'yearId' => record_year($coll, $id)];
    }
    $stmt = db()->prepare('SELECT * FROM justifications WHERE id = ?');
    $stmt->execute([$id]);
    $j = $stmt->fetch();
    return $j ? ['coll' => null, 'record' => $j, 'classId' => null, 'studentId' => $j['student_id'], 'yearId' => $j['year_id']] : null;
}

function can_write_owner(array $me, array $scope, string $type, array $o): bool {
    if ($type === 'justification') {
        if (is_staff($me)) return true;
        return $o['record']['created_by'] === $me['id'] && $o['record']['status'] === 'pendente';
    }
    return can_write($me, $scope, $o['coll'], $o['record'], $o['record']);
}

function can_read_owner(array $me, array $scope, string $type, array $o): bool {
    if (is_staff($me)) return true;
    if ($type === 'justification') return in_array($o['studentId'], $scope['studentIds'], true) || $o['record']['created_by'] === $me['id'];
    return in_array($o['classId'], $scope['classIds'], true);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (($_GET['action'] ?? '') !== 'download') respond(['error' => 'Requisição inválida.'], 400);
    $id = (string) ($_GET['id'] ?? '');
    if (!valid_id($id)) respond(['error' => 'Requisição inválida.'], 400);
    $stmt = db()->prepare('SELECT * FROM attachments WHERE id = ?'); $stmt->execute([$id]);
    $a = $stmt->fetch();
    $o = $a ? attach_owner($a['owner_type'], $a['owner_id']) : null;
    // one answer for "missing" and "not yours", so ids can't be probed
    if (!$a || !$o || !can_read_owner($me, access_scope($me), $a['owner_type'], $o)) respond(['error' => 'Arquivo não encontrado.'], 404);
    $path = storage_dir() . '/' . $a['stored_name'];
    if (!preg_match('/^[a-f0-9]{40}$/', $a['stored_name']) || !is_file($path)) respond(['error' => 'Arquivo não encontrado.'], 404);

    $ext = strtolower(pathinfo($a['original_name'], PATHINFO_EXTENSION));
    $inline = !empty($_GET['inline']) && (ATTACH_TYPES[$ext][2] ?? false);
    $name = $a['original_name'];
    $ascii = preg_replace('/[^A-Za-z0-9._-]+/', '_', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name) ?: 'arquivo') ?: 'arquivo';
    header_remove('Content-Type');
    header('Content-Type: ' . $a['mime']);
    header('Content-Disposition: ' . ($inline ? 'inline' : 'attachment') . "; filename=\"$ascii\"; filename*=UTF-8''" . rawurlencode($name));
    header('X-Content-Type-Options: nosniff');
    if (!$inline) header("Content-Security-Policy: default-src 'none'; sandbox"); // (Chrome refuses to show a sandboxed PDF)
    header('Cache-Control: private, no-store');
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);
$scope = access_scope($me);

// ---------------------------------------------------------------- delete
if (str_contains((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') && !isset($_GET['action'])) {
    $in = json_input();
    if (($in['action'] ?? '') !== 'delete' || !valid_id($in['id'] ?? null)) respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);
    $stmt = db()->prepare('SELECT * FROM attachments WHERE id = ?'); $stmt->execute([$in['id']]);
    $a = $stmt->fetch();
    $o = $a ? attach_owner($a['owner_type'], $a['owner_id']) : null;
    if (!$a || !$o) respond(['ok' => false, 'error' => 'Arquivo não encontrado.'], 404);
    $isUploader = $a['uploaded_by'] === $me['id'] && can_read_owner($me, $scope, $a['owner_type'], $o);
    if (!can_write_owner($me, $scope, $a['owner_type'], $o) && !(is_staff($me)) && !($isUploader && $a['owner_type'] === 'justification' && $o['record']['status'] === 'pendente')) {
        respond(['ok' => false, 'error' => 'Você não pode remover este arquivo.'], 403);
    }
    if ($o['yearId'] !== null && $o['yearId'] !== active_year_id() && $a['owner_type'] !== 'justification') respond(['ok' => false, 'error' => CLOSED_YEAR_MSG], 400);
    db()->prepare('DELETE FROM attachments WHERE id = ?')->execute([$a['id']]);
    attach_delete_files([$a['stored_name']]);
    audit('excluir', 'anexo', $a['id'], $a['original_name'], ['tipo' => $a['owner_type']], $me);
    respond(['ok' => true]);
}

// ---------------------------------------------------------------- upload
if (($_GET['action'] ?? '') !== 'upload') respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);
$type = (string) ($_GET['ownerType'] ?? ''); $ownerId = (string) ($_GET['ownerId'] ?? '');
if (!in_array($type, ATTACH_OWNER_TYPES, true) || !valid_id($ownerId)) respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);

$declared = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($declared > ATTACH_MAX_BYTES + 1024) respond(['ok' => false, 'error' => 'O arquivo passa de ' . (ATTACH_MAX_BYTES / 1048576) . ' MB.'], 413);

$o = attach_owner($type, $ownerId);
if (!$o) respond(['ok' => false, 'error' => 'Item não encontrado.'], 404);
if (!can_write_owner($me, $scope, $type, $o)) respond(['ok' => false, 'error' => 'Você não pode anexar arquivos a este item.'], 403);
if ($type !== 'justification' && $o['yearId'] !== null && $o['yearId'] !== active_year_id()) respond(['ok' => false, 'error' => CLOSED_YEAR_MSG], 400);

$name = clean_file_name((string) ($_GET['name'] ?? ''));
$ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
if ($name === '' || !isset(ATTACH_TYPES[$ext])) respond(['ok' => false, 'error' => 'Tipo de arquivo não permitido. Aceitos: ' . implode(', ', array_keys(ATTACH_TYPES)) . '.'], 400);

$stmt = db()->prepare('SELECT COUNT(*) FROM attachments WHERE owner_type = ? AND owner_id = ?'); $stmt->execute([$type, $ownerId]);
if ((int) $stmt->fetchColumn() >= ATTACH_MAX_PER_OWNER[$type]) respond(['ok' => false, 'error' => 'No máximo ' . ATTACH_MAX_PER_OWNER[$type] . ' arquivos por item.'], 400);

$ids = ['upload:' . $me['id']];
if (too_many_attempts($ids, UPLOAD_RATE, UPLOAD_WINDOW)) respond(['ok' => false, 'error' => 'Muitos envios em pouco tempo. Espere alguns minutos.'], 429);

$bytes = (string) file_get_contents('php://input', false, null, 0, ATTACH_MAX_BYTES + 1);
if ($bytes === '') respond(['ok' => false, 'error' => 'Arquivo vazio.'], 400);
if (strlen($bytes) > ATTACH_MAX_BYTES) respond(['ok' => false, 'error' => 'O arquivo passa de ' . (ATTACH_MAX_BYTES / 1048576) . ' MB.'], 413);
[$mime, $kind] = ATTACH_TYPES[$ext];
if (!attach_content_ok($kind, $bytes)) respond(['ok' => false, 'error' => 'O conteúdo do arquivo não confere com o tipo ".' . $ext . '".'], 400);
record_attempt($ids);

$stored = bin2hex(random_bytes(20));
$path = storage_dir() . '/' . $stored;
if (file_put_contents($path, $bytes, LOCK_EX) === false) respond(['ok' => false, 'error' => 'Não foi possível guardar o arquivo.'], 500);

$id = gen_id('at');
try {
    db()->prepare('INSERT INTO attachments (id, owner_type, owner_id, class_id, student_id, year_id, original_name, mime, size, stored_name, uploaded_by)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$id, $type, $ownerId, $o['classId'], $o['studentId'], $o['yearId'], $name, $mime, strlen($bytes), $stored, $me['id']]);
} catch (Throwable $e) { @unlink($path); throw $e; }
audit('criar', 'anexo', $id, $name, ['tipo' => $type, 'tamanho' => strlen($bytes)], $me);

$stmt = db()->prepare('SELECT * FROM attachments WHERE id = ?'); $stmt->execute([$id]);
respond(['ok' => true, 'attachment' => attachment_record($stmt->fetch())]);
