<?php
require __DIR__ . '/config.php';
$me = require_login();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(redact_state(get_state()));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $incoming = json_input();
    $current = get_state();
    $isDiretor = ($me['role'] ?? '') === 'diretor';

    $existingById = [];
    foreach ($current['users'] as $u) { $existingById[$u['id']] = $u; }

    $mergedUsers = [];
    foreach (($incoming['users'] ?? []) as $u) {
        $uid = $u['id'] ?? null;
        $existing = $uid !== null ? ($existingById[$uid] ?? null) : null;

        if (!$isDiretor) {
            // Only a diretor session may create new accounts, change roles/approval
            // status, or set passwords — everyone else can only touch other fields
            // (e.g. clearing a studentId link when a student record is deleted).
            if ($existing === null) continue;
            $u['role'] = $existing['role'];
            $u['status'] = $existing['status'] ?? 'aprovado';
            $u['password'] = $existing['password'] ?? '';
        } elseif (!isset($u['password']) || $u['password'] === '') {
            $u['password'] = $existing['password'] ?? '';
        }
        $mergedUsers[] = $u;
    }
    $incoming['users'] = $mergedUsers;

    // Merge onto the currently stored state (not a hardcoded empty one) so that
    // a payload missing a top-level key never wipes existing data for that key.
    $state = array_merge($current, $incoming);
    save_state_raw($state);
    respond(['ok' => true]);
}

respond(['error' => 'Método inválido.'], 405);
