<?php
// One-off import from the old storage (the whole state as JSON in app_state) into the
// relational tables created by db.sql. Run from the project root after importing db.sql:
//   php scripts/migrate_legacy.php
// Plain-text passwords are hashed on the way in. app_state itself is left untouched.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

ob_start();
require __DIR__ . '/../api/config.php';
ob_end_clean();
header_remove();
set_exception_handler(function (Throwable $e): void {
    fwrite(STDERR, 'Erro: ' . $e->getMessage() . "\nNada foi gravado.\n");
    exit(1);
});

$pdo = db();
$hasLegacy = $pdo->query("SHOW TABLES LIKE 'app_state'")->fetchColumn();
$row = $hasLegacy ? $pdo->query('SELECT data FROM app_state WHERE id = 1')->fetch() : false;
if (!$row) { fwrite(STDERR, "Nenhum dado antigo encontrado (tabela app_state vazia ou inexistente).\n"); exit(1); }

$state = json_decode($row['data'], true);
if (!is_array($state)) { fwrite(STDERR, "O conteúdo de app_state não é um JSON válido.\n"); exit(1); }

if (user_count() > 0) { fwrite(STDERR, "As tabelas novas já têm usuários; a migração não foi executada para não duplicar dados.\n"); exit(1); }

// Records are imported as they were, so references to records that no longer exist are
// cleared instead of failing the whole import.
$ids = [];
foreach (array_keys(COLLECTIONS) as $coll) {
    $ids[$coll] = array_flip(array_column(array_filter($state[$coll] ?? [], 'is_array'), 'id'));
}
$refTarget = ['userId' => 'users', 'teacherId' => 'teachers', 'classId' => 'classes', 'studentId' => 'students', 'subjectId' => 'subjects'];

$pdo->beginTransaction();
$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
$pdo->exec('DELETE FROM subjects'); // replaced by the subjects stored in the old state
$counts = [];
$skipped = [];
foreach (UPSERT_ORDER as $coll) {
    $counts[$coll] = 0;
    foreach (($state[$coll] ?? []) as $rec) {
        if (!is_array($rec) || !valid_id($rec['id'] ?? null)) { $skipped[] = "$coll: registro sem id válido"; continue; }
        // The old code treated a user without status as approved.
        if ($coll === 'users' && empty($rec['status'])) $rec['status'] = 'aprovado';
        foreach ($refTarget as $field => $target) {
            if (isset(COLLECTIONS[$coll][$field]) && !empty($rec[$field]) && !isset($ids[$target][$rec[$field]])) $rec[$field] = '';
        }
        try {
            $cols = ['id' => $rec['id']] + row_from_record($coll, $rec);
        } catch (BadInput $e) {
            $skipped[] = "$coll {$rec['id']}: " . $e->getMessage();
            continue;
        }
        if ($coll === 'users') {
            $p = (string) ($rec['password'] ?? '');
            if ($p === '') { $skipped[] = "users {$rec['id']}: sem senha"; continue; }
            $cols['password'] = is_password_hash($p) ? $p : hash_password($p);
        }
        $names = implode(', ', array_map(fn($c) => "`$c`", array_keys($cols)));
        $marks = implode(', ', array_fill(0, count($cols), '?'));
        $pdo->prepare("INSERT INTO `$coll` ($names) VALUES ($marks)")->execute(array_values($cols));
        $counts[$coll]++;
    }
}
// The old format stored a responsável's single child as users.studentId (same
// field aluno still uses). Move it into guardians -- the table the new access
// rules actually read for responsável -- and clear it off the user row.
$counts['guardians'] = 0;
foreach (($state['users'] ?? []) as $rec) {
    if (!is_array($rec) || ($rec['role'] ?? '') !== 'responsavel' || empty($rec['studentId'])) continue;
    if (!isset($ids['students'][$rec['studentId']]) || !isset($ids['users'][$rec['id']])) continue;
    $pdo->prepare('INSERT INTO guardians (id, user_id, student_id) VALUES (?, ?, ?)')
        ->execute([gen_id('gd'), $rec['id'], $rec['studentId']]);
    $pdo->prepare('UPDATE users SET student_id = NULL WHERE id = ?')->execute([$rec['id']]);
    $counts['guardians']++;
}

if ($counts['subjects'] === 0) seed_default_subjects();
$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
$pdo->commit();

foreach ($counts as $coll => $n) echo str_pad($coll, 15) . $n . "\n";
if ($skipped) echo "\nIgnorados:\n  " . implode("\n  ", $skipped) . "\n";
echo "\nMigração concluída.\n";
