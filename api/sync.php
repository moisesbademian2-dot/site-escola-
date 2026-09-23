<?php
// Applies the changes the front end made since its last load:
// { "changes": { "<collection>": { "upsert": [records], "delete": [ids] } } }
// Every record is checked against the user's role; one refusal rolls back the whole request.
require __DIR__ . '/config.php';
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);

$changes = json_input()['changes'] ?? null;
if (!is_array($changes)) respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);
foreach ($changes as $coll => $ops) {
    if (!isset(COLLECTIONS[$coll]) || !is_array($ops)) respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);
}

$scope = access_scope($me);
$pdo = db();

function fail(string $error, int $status): void {
    if (db()->inTransaction()) db()->rollBack();
    respond(['ok' => false, 'error' => $error], $status);
}

function deny(): void {
    fail('Você não tem permissão para fazer essa alteração.', 403);
}

function same_record(array $a, array $b): bool {
    foreach ($a as $k => $v) { if ((string) $v !== (string) ($b[$k] ?? '')) return false; }
    return true;
}

$pdo->beginTransaction();
try {
    foreach (DELETE_ORDER as $coll) {
        foreach (($changes[$coll]['delete'] ?? []) as $id) {
            if (!valid_id($id)) throw new BadInput('Identificador inválido.');
            $old = fetch_record($coll, $id);
            if ($old === null) continue; // already gone, e.g. removed by a cascade earlier in this request
            if (!can_write($me, $scope, $coll, $old, null)) deny();

            if ($coll === 'users') {
                if ($id === $me['id']) fail('Você não pode excluir a própria conta.', 400);
                $pdo->prepare('UPDATE teachers SET user_id = NULL WHERE user_id = ?')->execute([$id]);
            }
            if ($coll === 'teachers') {
                // A deleted teacher loses its professor login too (same behavior the screen always had).
                $stmt = $pdo->prepare("SELECT id FROM users WHERE role = 'professor' AND (id = ? OR email = ?)");
                $stmt->execute([$old['userId'], $old['email']]);
                foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $uid) {
                    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$uid]);
                }
            }
            $pdo->prepare("DELETE FROM `$coll` WHERE id = ?")->execute([$id]);
        }
    }

    foreach (UPSERT_ORDER as $coll) {
        foreach (($changes[$coll]['upsert'] ?? []) as $rec) {
            if (!is_array($rec) || !valid_id($rec['id'] ?? null)) throw new BadInput('Registro inválido.');
            $id = $rec['id'];
            $cols = row_from_record($coll, $rec);
            $new = record_from_row($coll, ['id' => $id] + $cols);
            $old = fetch_record($coll, $id);

            $password = null;
            if ($coll === 'users' && isset($rec['password']) && $rec['password'] !== '') {
                $password = (string) $rec['password'];
                if (strlen($password) < 4) throw new BadInput('A senha deve ter no mínimo 4 caracteres.');
            }

            // The front end resends records it didn't really change (or that a cascade already
            // updated here); those are no-ops and need no permission.
            if ($old !== null && $password === null && same_record($old, $new)) continue;
            if (!can_write($me, $scope, $coll, $old, $new)) deny();

            if ($coll === 'users') {
                if ($password !== null) $cols['password'] = hash_password($password);
                elseif ($old === null) throw new BadInput('Informe a senha do novo usuário.');
            }

            if ($old === null) {
                $cols = ['id' => $id] + $cols;
                $names = implode(', ', array_map(fn($c) => "`$c`", array_keys($cols)));
                $marks = implode(', ', array_fill(0, count($cols), '?'));
                $pdo->prepare("INSERT INTO `$coll` ($names) VALUES ($marks)")->execute(array_values($cols));
            } else {
                $sets = implode(', ', array_map(fn($c) => "`$c` = ?", array_keys($cols)));
                $pdo->prepare("UPDATE `$coll` SET $sets WHERE id = ?")->execute([...array_values($cols), $id]);
            }
        }
    }

    $pdo->commit();
} catch (BadInput $e) {
    fail($e->getMessage(), 400);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') fail('Dados inválidos: e-mail já cadastrado ou registro relacionado inexistente.', 400);
    throw $e;
}

respond(['ok' => true]);
