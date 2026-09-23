<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

// SameSite=Lax stops the session cookie from riding along on a cross-site POST
// (a form submitted from another page), which is most of what CSRF relies on.
session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();

set_exception_handler(function (Throwable $e): void {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor.']);
    exit;
});

// Second CSRF layer: every state-changing request must carry this header. A plain
// HTML form can't set custom headers, and a cross-site fetch() that tried to would
// trigger a CORS preflight — which fails, since we never send an Access-Control-
// Allow-Origin for other origins. So only same-origin JS (our own script.js) can
// reach this line on a POST.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'PortalOfFuture') {
    http_response_code(403);
    echo json_encode(['error' => 'Requisição inválida.']);
    exit;
}

// Real credentials go in db_config.php (gitignored, never committed). Without it,
// these defaults match a fresh XAMPP install so the project runs out of the box.
$dbConfigFile = __DIR__ . '/db_config.php';
if (file_exists($dbConfigFile)) {
    require $dbConfigFile;
} else {
    define('DB_HOST', '127.0.0.1');
    define('DB_NAME', 'portal_of_future');
    define('DB_USER', 'root');
    define('DB_PASS', '');
}

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

// ---------------------------------------------------------------------------
// Collections: each key of the front end's DB.state and the table behind it.
// Field names are camelCase here and snake_case in the table (classId -> class_id).
// Types: str, text, date (YYYY-MM-DD), num, ref (id of another record), or a list of allowed values.
// ---------------------------------------------------------------------------

const ROLES = ['diretor', 'coordenador', 'professor', 'aluno', 'responsavel'];

const COLLECTIONS = [
    'subjects' => ['name' => 'str', 'code' => 'str'],
    'teachers' => ['name' => 'str', 'email' => 'str', 'phone' => 'str', 'subject' => 'str', 'userId' => 'ref'],
    'classes' => ['name' => 'str', 'course' => 'str', 'semester' => 'str', 'period' => 'str', 'room' => 'str', 'teacherId' => 'ref'],
    'students' => [
        'name' => 'str', 'matricula' => 'str', 'birth' => 'date', 'email' => 'str', 'phone' => 'str', 'classId' => 'ref',
        'course' => 'str', 'period' => 'str', 'guardian' => 'str', 'guardianPhone' => 'str', 'status' => 'str',
    ],
    'users' => [
        'name' => 'str', 'email' => 'str', 'phone' => 'str', 'role' => ROLES, 'avatar' => 'str',
        'status' => ['pendente', 'aprovado', 'rejeitado'], 'matricula' => 'str', 'studentId' => 'ref',
        'cursoPretendido' => 'str', 'turnoPretendido' => 'str', 'createdAt' => 'str',
    ],
    'grades' => ['studentId' => 'ref', 'subjectId' => 'ref', 'assessment' => 'str', 'value' => 'num', 'weight' => 'num', 'date' => 'date'],
    'attendance' => [
        'studentId' => 'ref', 'classId' => 'ref', 'subjectId' => 'ref', 'teacherId' => 'ref', 'date' => 'date',
        'status' => ['Presente', 'Falta', 'Justificada'],
    ],
    'lessons' => ['classId' => 'ref', 'subjectId' => 'ref', 'date' => 'date', 'content' => 'text', 'note' => 'text'],
    'activities' => [
        'classId' => 'ref', 'title' => 'str', 'subject' => 'str', 'dueDate' => 'date', 'value' => 'num',
        'status' => 'str', 'description' => 'text', 'createdAt' => 'str',
    ],
    'occurrences' => ['studentId' => 'ref', 'teacherId' => 'ref', 'date' => 'date', 'category' => 'str', 'situation' => 'str', 'description' => 'text'],
    'announcements' => ['title' => 'str', 'target' => 'str', 'author' => 'str', 'message' => 'text', 'date' => 'date'],
];

// Parents before children, so a record can reference one created in the same request.
const UPSERT_ORDER = ['subjects', 'teachers', 'classes', 'students', 'users', 'grades', 'attendance', 'lessons', 'activities', 'occurrences', 'announcements'];
// Teachers go before users: deleting a teacher also removes its professor login (see sync.php).
const DELETE_ORDER = ['announcements', 'occurrences', 'activities', 'lessons', 'attendance', 'grades', 'teachers', 'users', 'students', 'classes', 'subjects'];

const ID_PATTERN = '/^[A-Za-z0-9_-]{1,64}$/';

const DEFAULT_SUBJECTS = [
    ['d1', 'Desenvolvimento Web', 'DWEB'],
    ['d2', 'Programação Mobile', 'PMOB'],
    ['d3', 'Banco de Dados', 'BDAD'],
    ['d4', 'Análise de Sistemas', 'ANSI'],
    ['d5', 'Matemática Aplicada', 'MATE'],
    ['d6', 'Português Instrumental', 'PORT'],
];

class BadInput extends RuntimeException {}

function column(string $field): string {
    return strtolower((string) preg_replace('/(?<!^)[A-Z]/', '_$0', $field));
}

function valid_id($id): bool {
    return is_string($id) && preg_match(ID_PATTERN, $id) === 1;
}

// DB row -> record in the shape the front end uses (missing values become '').
function record_from_row(string $coll, array $row): array {
    $rec = ['id' => (string) $row['id']];
    foreach (COLLECTIONS[$coll] as $field => $type) {
        $v = $row[column($field)] ?? null;
        if ($v === null) $rec[$field] = '';
        elseif ($type === 'num') $rec[$field] = (float) $v;
        else $rec[$field] = (string) $v;
    }
    return $rec;
}

// Record sent by the front end -> validated column values ('' becomes NULL).
function row_from_record(string $coll, array $rec): array {
    $cols = [];
    foreach (COLLECTIONS[$coll] as $field => $type) {
        $v = $rec[$field] ?? null;
        if ($v === null || $v === '') { $cols[column($field)] = null; continue; }
        if (!is_scalar($v)) throw new BadInput("Campo inválido: $field.");
        $v = is_bool($v) ? ($v ? '1' : '0') : (string) $v;
        if (is_array($type)) {
            if (!in_array($v, $type, true)) throw new BadInput("Valor inválido para $field.");
        } elseif ($type === 'ref') {
            if (!valid_id($v)) throw new BadInput("Referência inválida em $field.");
        } elseif ($type === 'date') {
            if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m) || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
                throw new BadInput("Data inválida em $field.");
            }
        } elseif ($type === 'num') {
            if (!is_numeric($v) || abs((float) $v) > 99999) throw new BadInput("Número inválido em $field.");
        } elseif (mb_strlen($v) > ($type === 'text' ? 20000 : 255)) {
            throw new BadInput("Texto muito longo em $field.");
        }
        $cols[column($field)] = $v;
    }
    if ($coll === 'grades' && $cols['value'] !== null && ((float) $cols['value'] < 0 || (float) $cols['value'] > 10)) {
        throw new BadInput('A nota deve estar entre 0 e 10.');
    }
    return $cols;
}

function fetch_record(string $coll, string $id): ?array {
    $stmt = db()->prepare("SELECT * FROM `$coll` WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? record_from_row($coll, $row) : null;
}

function fetch_all(string $coll): array {
    return array_map(fn($row) => record_from_row($coll, $row), db()->query("SELECT * FROM `$coll`")->fetchAll());
}

function seed_default_subjects(): void {
    $stmt = db()->prepare('INSERT IGNORE INTO subjects (id, name, code) VALUES (?, ?, ?)');
    foreach (DEFAULT_SUBJECTS as $s) $stmt->execute($s);
}

// ---------------------------------------------------------------------------
// Users and passwords
// ---------------------------------------------------------------------------

function is_password_hash(string $p): bool {
    return !empty(password_get_info($p)['algo']);
}

function hash_password(string $p): string {
    return password_hash($p, PASSWORD_DEFAULT);
}

function check_password(array $user, string $p): bool {
    $stored = (string) ($user['password'] ?? '');
    return $stored !== '' && password_verify($p, $stored);
}

function user_from_row(array $row): array {
    return record_from_row('users', $row) + ['password' => (string) $row['password']];
}

function find_user(string $column, string $value): ?array {
    $stmt = db()->prepare("SELECT * FROM users WHERE `$column` = ?");
    $stmt->execute([$value]);
    $row = $stmt->fetch();
    return $row ? user_from_row($row) : null;
}

function sanitize_user(array $u): array {
    unset($u['password']);
    return $u;
}

function user_count(): int {
    return (int) db()->query('SELECT COUNT(*) FROM users')->fetchColumn();
}

function initials_of(string $name): string {
    $parts = preg_split('/\s+/', $name);
    return mb_strtoupper(implode('', array_map(fn($p) => $p !== '' ? mb_substr($p, 0, 1) : '', array_slice($parts, 0, 2))));
}

function current_user(): ?array {
    if (empty($_SESSION['uid'])) return null;
    $u = find_user('id', (string) $_SESSION['uid']);
    return ($u && $u['status'] === 'aprovado') ? $u : null;
}

function require_login(): array {
    $u = current_user();
    if (!$u) respond(['error' => 'Não autenticado.'], 401);
    return $u;
}

function gen_id(string $p): string {
    return $p . '-' . dechex((int) round(microtime(true) * 1000)) . bin2hex(random_bytes(3));
}

// ---------------------------------------------------------------------------
// Login rate limiting
// ---------------------------------------------------------------------------

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MINUTES = 15;

// Checked per IP (stops one source from spraying many accounts) and per e-mail
// (stops many sources from hammering a single account) independently.
function login_identifiers(string $email): array {
    $ids = ['ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown')];
    if ($email !== '') $ids[] = 'email:' . strtolower($email);
    return $ids;
}

function too_many_attempts(array $identifiers): bool {
    if (!$identifiers) return false;
    $in = implode(',', array_fill(0, count($identifiers), '?'));
    $stmt = db()->prepare("SELECT identifier, COUNT(*) c FROM login_attempts
                            WHERE identifier IN ($in) AND created_at > NOW() - INTERVAL ? MINUTE
                            GROUP BY identifier HAVING c >= ?");
    $stmt->execute([...$identifiers, LOGIN_WINDOW_MINUTES, LOGIN_MAX_ATTEMPTS]);
    return (bool) $stmt->fetch();
}

function record_attempt(array $identifiers): void {
    $stmt = db()->prepare('INSERT INTO login_attempts (identifier) VALUES (?)');
    foreach ($identifiers as $id) $stmt->execute([$id]);
    // Opportunistic cleanup so the table doesn't grow forever; cheap enough to run often.
    if (random_int(1, 50) === 1) db()->exec('DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL 1 DAY');
}

function clear_attempts(array $identifiers): void {
    if (!$identifiers) return;
    $in = implode(',', array_fill(0, count($identifiers), '?'));
    db()->prepare("DELETE FROM login_attempts WHERE identifier IN ($in)")->execute($identifiers);
}

// ---------------------------------------------------------------------------
// Access rules
// ---------------------------------------------------------------------------

// What the logged-in user is tied to: a professor's teacher records, classes and
// students; an aluno/responsável's linked student and that student's class.
function access_scope(array $me): array {
    $scope = ['teacherIds' => [], 'classIds' => [], 'studentIds' => []];
    if ($me['role'] === 'professor') {
        $stmt = db()->prepare('SELECT id FROM teachers WHERE user_id = ? OR email = ?');
        $stmt->execute([$me['id'], $me['email']]);
        $scope['teacherIds'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if ($scope['teacherIds']) {
            $in = implode(',', array_fill(0, count($scope['teacherIds']), '?'));
            $stmt = db()->prepare("SELECT id FROM classes WHERE teacher_id IN ($in)");
            $stmt->execute($scope['teacherIds']);
            $scope['classIds'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        }
        if ($scope['classIds']) {
            $in = implode(',', array_fill(0, count($scope['classIds']), '?'));
            $stmt = db()->prepare("SELECT id FROM students WHERE class_id IN ($in)");
            $stmt->execute($scope['classIds']);
            $scope['studentIds'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        }
    } elseif (in_array($me['role'], ['aluno', 'responsavel'], true) && $me['studentId'] !== '') {
        $st = fetch_record('students', $me['studentId']);
        if ($st) {
            $scope['studentIds'] = [$st['id']];
            if ($st['classId'] !== '') $scope['classIds'] = [$st['classId']];
        }
    }
    return $scope;
}

// The whole state the front end needs, limited to what this user may see.
function visible_state(array $me): array {
    $role = $me['role'];
    $state = [];
    foreach (array_keys(COLLECTIONS) as $coll) $state[$coll] = [];

    if ($role === 'diretor' || $role === 'coordenador') {
        foreach (array_keys(COLLECTIONS) as $coll) {
            if ($coll !== 'users') $state[$coll] = fetch_all($coll);
        }
        if ($role === 'diretor') {
            $state['users'] = array_map('sanitize_user', array_map('user_from_row', db()->query('SELECT * FROM users')->fetchAll()));
        }
        return $state;
    }

    $scope = access_scope($me);
    $inClass = fn($r) => in_array($r['classId'], $scope['classIds'], true);
    $ofStudent = fn($r) => in_array($r['studentId'], $scope['studentIds'], true);
    $keep = fn(string $coll, callable $fn) => array_values(array_filter(fetch_all($coll), $fn));

    $state['subjects'] = fetch_all('subjects');
    $state['classes'] = $keep('classes', fn($r) => in_array($r['id'], $scope['classIds'], true));
    $state['students'] = $keep('students', fn($r) => in_array($r['id'], $scope['studentIds'], true));
    $state['grades'] = $keep('grades', $ofStudent);
    $state['attendance'] = $keep('attendance', $ofStudent);
    $state['activities'] = $keep('activities', $inClass);

    $targets = ['Todos'];
    if ($role === 'professor') {
        $targets[] = 'Professores';
        $state['teachers'] = $keep('teachers', fn($r) => in_array($r['id'], $scope['teacherIds'], true));
        $state['lessons'] = $keep('lessons', $inClass);
        $state['occurrences'] = $keep('occurrences', fn($r) => $ofStudent($r) || in_array($r['teacherId'], $scope['teacherIds'], true));
    } else {
        $targets[] = $role === 'aluno' ? 'Alunos' : 'Responsáveis';
        $state['occurrences'] = $keep('occurrences', $ofStudent);
    }
    $state['announcements'] = $keep('announcements', fn($r) => in_array($r['target'], $targets, true) || $r['target'] === '');
    return $state;
}

// Whether $me may change a record: $old is the stored version (null when creating),
// $new the incoming one (null when deleting).
function can_write(array $me, array $scope, string $coll, ?array $old, ?array $new): bool {
    $role = $me['role'];
    if ($role === 'diretor') return true;
    if ($role === 'coordenador') return $coll !== 'users';
    if ($role !== 'professor') return false;

    $check = match ($coll) {
        'attendance', 'lessons', 'activities' => fn($r) => in_array($r['classId'], $scope['classIds'], true),
        'grades', 'occurrences' => fn($r) => in_array($r['studentId'], $scope['studentIds'], true),
        default => null,
    };
    if ($check === null) return false;
    foreach ([$old, $new] as $r) { if ($r !== null && !$check($r)) return false; }
    return true;
}
