<?php
// Uploaded files: where they live, what is allowed, and how they are removed.
// Nothing here is reachable by URL; api/attachments.php is the only door and checks who may read.

const ATTACH_MAX_BYTES = 5 * 1024 * 1024;
const ATTACH_MAX_PER_OWNER = ['activity' => 10, 'lesson' => 10, 'justification' => 3];
const ATTACH_OWNER_TYPES = ['activity', 'lesson', 'justification'];

// extension => [mime, kind of content check, safe to show inline in the browser]
const ATTACH_TYPES = [
    'pdf'  => ['application/pdf', 'pdf', true],
    'png'  => ['image/png', 'png', true],
    'jpg'  => ['image/jpeg', 'jpeg', true],
    'jpeg' => ['image/jpeg', 'jpeg', true],
    'gif'  => ['image/gif', 'gif', true],
    'webp' => ['image/webp', 'webp', true],
    'doc'  => ['application/msword', 'ole', false],
    'xls'  => ['application/vnd.ms-excel', 'ole', false],
    'ppt'  => ['application/vnd.ms-powerpoint', 'ole', false],
    'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'zip', false],
    'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'zip', false],
    'pptx' => ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'zip', false],
    'odt'  => ['application/vnd.oasis.opendocument.text', 'zip', false],
    'ods'  => ['application/vnd.oasis.opendocument.spreadsheet', 'zip', false],
    'odp'  => ['application/vnd.oasis.opendocument.presentation', 'zip', false],
    'txt'  => ['text/plain', 'text', false],
    'csv'  => ['text/csv', 'text', false],
];

function storage_dir(): string {
    $dir = __DIR__ . '/storage';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    // Apache honors this; the PHP development server does not, which is why names are random
    // and every download still goes through api/attachments.php.
    $ht = $dir . '/.htaccess';
    if (!file_exists($ht)) file_put_contents($ht, "Require all denied\n<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n");
    return $dir;
}

// The bytes must look like what the extension claims (a renamed program is refused).
function attach_content_ok(string $kind, string $bytes): bool {
    $head = substr($bytes, 0, 16);
    return match ($kind) {
        'pdf' => str_starts_with($head, '%PDF'),
        'png' => str_starts_with($head, "\x89PNG\r\n\x1a\n"),
        'jpeg' => str_starts_with($head, "\xFF\xD8\xFF"),
        'gif' => str_starts_with($head, 'GIF87a') || str_starts_with($head, 'GIF89a'),
        'webp' => str_starts_with($head, 'RIFF') && substr($head, 8, 4) === 'WEBP',
        'ole' => str_starts_with($head, "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"),
        'zip' => str_starts_with($head, "PK\x03\x04"),
        'text' => !str_contains(substr($bytes, 0, 8192), "\0"),
        default => false,
    };
}

// What people see as the file name: no path, no control characters, at most 200 characters.
function clean_file_name(string $name): string {
    $name = str_replace('\\', '/', $name);
    $name = basename($name);
    $name = preg_replace('/[\x00-\x1F\x7F]+/u', '', $name) ?? '';
    $name = trim($name);
    if (mb_strlen($name) > 200) {
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $name = mb_substr(pathinfo($name, PATHINFO_FILENAME), 0, 190 - mb_strlen($ext)) . ($ext !== '' ? '.' . $ext : '');
    }
    return $name;
}

function attach_delete_files(array $storedNames): void {
    $dir = storage_dir();
    foreach ($storedNames as $n) {
        if (preg_match('/^[a-f0-9]{40}$/', (string) $n)) @unlink($dir . '/' . $n);
    }
}

// Rows whose owner no longer exists (an activity, lesson or justification deleted, a class cascaded
// away...) lose their file too. Cheap, so it runs after anything that can delete.
function attach_sweep_orphans(): int {
    $rows = db()->query("SELECT id, stored_name FROM attachments a WHERE
        (owner_type = 'activity' AND NOT EXISTS (SELECT 1 FROM activities x WHERE x.id = a.owner_id)) OR
        (owner_type = 'lesson' AND NOT EXISTS (SELECT 1 FROM lessons x WHERE x.id = a.owner_id)) OR
        (owner_type = 'justification' AND NOT EXISTS (SELECT 1 FROM justifications x WHERE x.id = a.owner_id))")->fetchAll();
    if (!$rows) return 0;
    $in = implode(',', array_fill(0, count($rows), '?'));
    $stmt = db()->prepare("DELETE FROM attachments WHERE id IN ($in)");
    $stmt->execute(array_column($rows, 'id'));
    attach_delete_files(array_column($rows, 'stored_name'));
    return count($rows);
}

function attachment_record(array $r): array {
    return [
        'id' => $r['id'], 'ownerType' => $r['owner_type'], 'ownerId' => $r['owner_id'], 'name' => $r['original_name'],
        'mime' => $r['mime'], 'size' => (int) $r['size'], 'uploadedBy' => (string) $r['uploaded_by'], 'createdAt' => $r['created_at'],
    ];
}
