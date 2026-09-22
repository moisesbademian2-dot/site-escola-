<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
session_start();

set_exception_handler(function (Throwable $e): void {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor.']);
    exit;
});

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'portal_of_future');
define('DB_USER', 'root');
define('DB_PASS', '');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode((string)$raw, true);
    return is_array($data) ? $data : [];
}

function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function empty_state(): array {
    return [
        'users' => [], 'students' => [], 'classes' => [], 'teachers' => [],
        'subjects' => [
            ['id' => 'd1', 'name' => 'Desenvolvimento Web', 'code' => 'DWEB'],
            ['id' => 'd2', 'name' => 'Programação Mobile', 'code' => 'PMOB'],
            ['id' => 'd3', 'name' => 'Banco de Dados', 'code' => 'BDAD'],
            ['id' => 'd4', 'name' => 'Análise de Sistemas', 'code' => 'ANSI'],
            ['id' => 'd5', 'name' => 'Matemática Aplicada', 'code' => 'MATE'],
            ['id' => 'd6', 'name' => 'Português Instrumental', 'code' => 'PORT'],
        ],
        'attendance' => [], 'grades' => [], 'activities' => [], 'occurrences' => [],
        'announcements' => [], 'lessons' => [],
    ];
}

function get_state(): array {
    static $cached = null;
    if ($cached !== null) return $cached;
    $row = db()->query('SELECT data FROM app_state WHERE id = 1')->fetch();
    if (!$row) {
        $state = empty_state();
        save_state_raw($state);
        $cached = $state;
        return $cached;
    }
    $state = json_decode($row['data'], true);
    $cached = is_array($state) ? array_merge(empty_state(), $state) : empty_state();
    return $cached;
}

function save_state_raw(array $state): void {
    $json = json_encode($state);
    $stmt = db()->prepare('INSERT INTO app_state (id, data) VALUES (1, :d) ON DUPLICATE KEY UPDATE data = :d2, updated_at = CURRENT_TIMESTAMP');
    $stmt->execute(['d' => $json, 'd2' => $json]);
}

function redact_state(array $state): array {
    if (!empty($state['users'])) {
        foreach ($state['users'] as &$u) { unset($u['password']); }
        unset($u);
    }
    return $state;
}

function sanitize_user(array $u): array {
    unset($u['password']);
    return $u;
}

function current_user(): ?array {
    if (empty($_SESSION['uid'])) return null;
    $state = get_state();
    foreach ($state['users'] as $u) { if ($u['id'] === $_SESSION['uid']) return $u; }
    return null;
}

function require_login(): array {
    $u = current_user();
    if (!$u) respond(['error' => 'Não autenticado.'], 401);
    return $u;
}

function gen_id(string $p): string {
    return $p . '-' . dechex((int) round(microtime(true) * 1000)) . bin2hex(random_bytes(3));
}
