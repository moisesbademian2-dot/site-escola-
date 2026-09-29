<?php
// Profile photo: GET serves one (login required, same as any other person's data in
// this app), POST uploads/replaces one (your own; a diretor may also set someone else's).
require __DIR__ . '/config.php';
$me = require_login();

const AVATAR_PATTERN = '/^[a-f0-9]{32}\.(jpg|png|webp)$/';
const AVATAR_MIME = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function avatar_dir(): string {
    $dir = storage_dir() . '/avatars'; // storage_dir() (files.php) also makes sure the deny-all .htaccess exists
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    return $dir;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $target = find_user('id', (string) ($_GET['id'] ?? $me['id']));
    $photo = $target['photo'] ?? '';
    if (!$target || $photo === '' || !preg_match(AVATAR_PATTERN, $photo)) { http_response_code(404); exit; }
    $path = avatar_dir() . '/' . $photo;
    if (!is_file($path)) { http_response_code(404); exit; }
    header('Content-Type: ' . AVATAR_MIME[pathinfo($path, PATHINFO_EXTENSION)]);
    header('Cache-Control: private, max-age=3600');
    header('Content-Length: ' . (string) filesize($path));
    readfile($path);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $targetId = (string) ($_POST['userId'] ?? $me['id']);
    if ($targetId !== $me['id'] && $me['role'] !== 'diretor') respond(['ok' => false, 'error' => 'Sem permissão.'], 403);
    $target = find_user('id', $targetId);
    if (!$target) respond(['ok' => false, 'error' => 'Usuário não encontrado.'], 404);

    $f = $_FILES['photo'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK) respond(['ok' => false, 'error' => 'Envie uma imagem.']);
    if ($f['size'] > AVATAR_MAX_BYTES) respond(['ok' => false, 'error' => 'A imagem deve ter até 2 MB.']);

    $head = file_get_contents($f['tmp_name'], false, null, 0, 16);
    $ext = match (true) {
        str_starts_with((string) $head, "\xFF\xD8\xFF") => 'jpg',
        str_starts_with((string) $head, "\x89PNG\r\n\x1a\n") => 'png',
        substr((string) $head, 8, 4) === 'WEBP' => 'webp',
        default => null,
    };
    if ($ext === null) respond(['ok' => false, 'error' => 'Formato não suportado. Envie JPG, PNG ou WEBP.']);

    $filename = bin2hex(random_bytes(16)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], avatar_dir() . '/' . $filename)) respond(['ok' => false, 'error' => 'Falha ao salvar a imagem.'], 500);

    $old = $target['photo'] ?? '';
    db()->prepare('UPDATE users SET photo = ? WHERE id = ?')->execute([$filename, $targetId]);
    if ($old !== '' && preg_match(AVATAR_PATTERN, $old)) @unlink(avatar_dir() . '/' . $old);

    audit('alterar', 'users', $targetId, $target['name'], ['foto' => ['', 'alterada']], $me);
    respond(['ok' => true, 'photo' => $filename]);
}

respond(['error' => 'Método inválido.'], 405);
