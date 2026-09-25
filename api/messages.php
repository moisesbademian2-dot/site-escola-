<?php
// Direct messages. GET ?action=contacts | threads | unread | thread&with=<userId>[&after=<messageId>]; POST {action: 'send', to, body}.
// Who may write to whom is decided here (contacts_for), never by the screen:
//   diretor/coordenador  -> anyone approved
//   professor            -> the staff and other professors, plus the alunos and responsáveis of their own students
//   aluno/responsável    -> the coordination and the professors of their student's classes
// Messages are private: nothing about them goes to the audit trail, and no role can read other people's threads.
require __DIR__ . '/config.php';
$me = require_login();

const MESSAGE_MAX = 2000;
const MESSAGE_RATE = 30;      // messages per person...
const MESSAGE_WINDOW = 5;     // ...per this many minutes

const ROLE_ORDER = ['diretor' => 0, 'coordenador' => 1, 'professor' => 2, 'aluno' => 3, 'responsavel' => 4];

function in_marks(array $ids): string { return implode(',', array_fill(0, count($ids), '?')); }

// id => ['id', 'name', 'role', 'detail'] for everybody $me may write to.
function contacts_for(array $me): array {
    $pdo = db();
    $rows = [];
    if (in_array($me['role'], ['diretor', 'coordenador'], true)) {
        $stmt = $pdo->prepare("SELECT id, name, role FROM users WHERE status = 'aprovado' AND id <> ? LIMIT 3000");
        $stmt->execute([$me['id']]);
        $rows = $stmt->fetchAll();
    } else {
        $scope = access_scope($me);
        $sql = []; $args = [];
        if ($me['role'] === 'professor') {
            $sql[] = "role IN ('diretor', 'coordenador', 'professor')";
            if ($scope['studentIds']) {
                $m = in_marks($scope['studentIds']);
                $sql[] = "(role = 'aluno' AND student_id IN ($m))"; array_push($args, ...$scope['studentIds']);
                $sql[] = "(role = 'responsavel' AND id IN (SELECT user_id FROM guardians WHERE student_id IN ($m)))"; array_push($args, ...$scope['studentIds']);
            }
        } else {
            $sql[] = "role IN ('diretor', 'coordenador')";
            if ($scope['classIds']) {
                $m = in_marks($scope['classIds']);
                $sql[] = "(role = 'professor' AND id IN (SELECT u2.id FROM classes c JOIN teachers t ON t.id = c.teacher_id JOIN users u2 ON (u2.id = t.user_id OR u2.email = t.email) WHERE c.id IN ($m)))";
                array_push($args, ...$scope['classIds']);
            }
        }
        $stmt = $pdo->prepare("SELECT id, name, role FROM users WHERE status = 'aprovado' AND id <> ? AND (" . implode(' OR ', $sql) . ') LIMIT 3000');
        $stmt->execute([$me['id'], ...$args]);
        $rows = $stmt->fetchAll();
    }

    // What each one is to the school, so a list of 40 "Maria" can be told apart.
    $detail = [];
    foreach ($pdo->query("SELECT u.id, s.name AS sname, c.name AS cname FROM users u JOIN students s ON s.id = u.student_id LEFT JOIN classes c ON c.id = s.class_id WHERE u.role = 'aluno'") as $r) {
        $detail[$r['id']] = 'Aluno(a)' . ($r['cname'] ? ' da turma ' . $r['cname'] : '');
    }
    $kids = [];
    foreach ($pdo->query('SELECT g.user_id, s.name FROM guardians g JOIN students s ON s.id = g.student_id ORDER BY s.name') as $r) $kids[$r['user_id']][] = $r['name'];
    foreach ($kids as $uid => $names) $detail[$uid] = 'Responsável por ' . implode(', ', array_slice($names, 0, 3)) . (count($names) > 3 ? '…' : '');
    $labels = ['diretor' => 'Direção', 'coordenador' => 'Coordenação', 'professor' => 'Professor(a)'];

    $out = [];
    foreach ($rows as $r) {
        $out[$r['id']] = ['id' => $r['id'], 'name' => $r['name'], 'role' => $r['role'], 'detail' => $detail[$r['id']] ?? ($labels[$r['role']] ?? '')];
    }
    return $out;
}

function pair(string $x, string $y): array { return strcmp($x, $y) < 0 ? [$x, $y] : [$y, $x]; }

function find_thread(string $x, string $y): ?array {
    [$a, $b] = pair($x, $y);
    $stmt = db()->prepare('SELECT * FROM message_threads WHERE user_a = ? AND user_b = ?');
    $stmt->execute([$a, $b]);
    return $stmt->fetch() ?: null;
}

function unread_in(array $thread, string $userId): int {
    $read = $thread['user_a'] === $userId ? $thread['read_a'] : $thread['read_b'];
    $stmt = db()->prepare('SELECT COUNT(*) FROM messages WHERE thread_id = ? AND sender_id <> ? AND id > ?');
    $stmt->execute([$thread['id'], $userId, $read]);
    return (int) $stmt->fetchColumn();
}

function message_record(array $m): array {
    return ['id' => (int) $m['id'], 'senderId' => $m['sender_id'], 'body' => $m['body'], 'createdAt' => $m['created_at']];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = (string) ($_GET['action'] ?? '');

    if ($action === 'contacts') {
        $list = array_values(contacts_for($me));
        usort($list, fn($p, $q) => (ROLE_ORDER[$p['role']] <=> ROLE_ORDER[$q['role']]) ?: strcasecmp($p['name'], $q['name']));
        respond(['contacts' => $list]);
    }

    if ($action === 'unread') {
        $stmt = db()->prepare('SELECT COUNT(*) FROM messages m JOIN message_threads t ON t.id = m.thread_id
            WHERE (t.user_a = ? OR t.user_b = ?) AND m.sender_id <> ? AND m.id > IF(t.user_a = ?, t.read_a, t.read_b)');
        $stmt->execute([$me['id'], $me['id'], $me['id'], $me['id']]);
        respond(['unread' => (int) $stmt->fetchColumn()]);
    }

    if ($action === 'threads') {
        $stmt = db()->prepare("SELECT t.*, u.id AS other_id, u.name AS other_name, u.role AS other_role,
                (SELECT body FROM messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1) AS last_body,
                (SELECT sender_id FROM messages WHERE thread_id = t.id ORDER BY id DESC LIMIT 1) AS last_sender,
                (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id AND m.sender_id <> ? AND m.id > IF(t.user_a = ?, t.read_a, t.read_b)) AS unread
            FROM message_threads t JOIN users u ON u.id = IF(t.user_a = ?, t.user_b, t.user_a)
            WHERE (t.user_a = ? OR t.user_b = ?) AND t.last_message_at IS NOT NULL ORDER BY t.last_message_at DESC, t.id DESC LIMIT 200");
        $stmt->execute([$me['id'], $me['id'], $me['id'], $me['id'], $me['id']]);
        $out = array_map(fn($r) => [
            'otherId' => $r['other_id'], 'otherName' => $r['other_name'], 'otherRole' => $r['other_role'],
            'lastBody' => mb_substr((string) $r['last_body'], 0, 120), 'lastFromMe' => $r['last_sender'] === $me['id'],
            'lastAt' => $r['last_message_at'], 'unread' => (int) $r['unread'],
        ], $stmt->fetchAll());
        respond(['threads' => $out]);
    }

    if ($action === 'thread') {
        $with = (string) ($_GET['with'] ?? '');
        if (!valid_id($with)) respond(['error' => 'Requisição inválida.'], 400);
        $other = find_user('id', $with);
        if (!$other || $other['status'] !== 'aprovado') respond(['error' => 'Pessoa não encontrada.'], 404);
        $contacts = contacts_for($me);
        $thread = find_thread($me['id'], $with);
        // you may read a thread you already have even if you could not start it today
        if (!$thread && !isset($contacts[$with])) respond(['error' => 'Você não pode conversar com essa pessoa.'], 403);
        $after = max(0, (int) ($_GET['after'] ?? 0));
        $messages = [];
        if ($thread) {
            $stmt = db()->prepare('SELECT * FROM (SELECT * FROM messages WHERE thread_id = ? AND id > ? ORDER BY id DESC LIMIT 200) x ORDER BY id ASC');
            $stmt->execute([$thread['id'], $after]);
            $messages = array_map('message_record', $stmt->fetchAll());
            if ($messages) {
                $col = $thread['user_a'] === $me['id'] ? 'read_a' : 'read_b';
                db()->prepare("UPDATE message_threads SET $col = GREATEST($col, ?) WHERE id = ?")->execute([end($messages)['id'], $thread['id']]);
            }
        }
        respond(['other' => ['id' => $other['id'], 'name' => $other['name'], 'role' => $other['role'], 'detail' => $contacts[$with]['detail'] ?? ''],
                 'canSend' => isset($contacts[$with]), 'messages' => $messages]);
    }

    respond(['error' => 'Requisição inválida.'], 400);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método inválido.'], 405);
$in = json_input();
if (($in['action'] ?? '') !== 'send') respond(['ok' => false, 'error' => 'Requisição inválida.'], 400);

$to = (string) ($in['to'] ?? '');
$body = trim(str_replace("\r\n", "\n", (string) ($in['body'] ?? '')));
if (!valid_id($to) || $to === $me['id']) respond(['ok' => false, 'error' => 'Escolha para quem enviar.'], 400);
if ($body === '') respond(['ok' => false, 'error' => 'Escreva a mensagem.'], 400);
if (mb_strlen($body) > MESSAGE_MAX) respond(['ok' => false, 'error' => 'A mensagem pode ter até ' . MESSAGE_MAX . ' caracteres.'], 400);
if (!isset(contacts_for($me)[$to])) respond(['ok' => false, 'error' => 'Você não pode enviar mensagens para essa pessoa.'], 403);

$ids = ['msg:' . $me['id']];
if (too_many_attempts($ids, MESSAGE_RATE, MESSAGE_WINDOW)) respond(['ok' => false, 'error' => 'Muitas mensagens em pouco tempo. Espere alguns minutos.'], 429);
record_attempt($ids);

$pdo = db();
$pdo->beginTransaction();
try {
    $thread = find_thread($me['id'], $to);
    if (!$thread) {
        [$a, $b] = pair($me['id'], $to);
        $id = gen_id('mt');
        $pdo->prepare('INSERT INTO message_threads (id, user_a, user_b) VALUES (?, ?, ?)')->execute([$id, $a, $b]);
        $thread = find_thread($me['id'], $to);
    }
    $firstUnreadForThem = unread_in($thread, $to) === 0; // only the first unread message of a streak sends an e-mail
    $pdo->prepare('INSERT INTO messages (thread_id, sender_id, body) VALUES (?, ?, ?)')->execute([$thread['id'], $me['id'], $body]);
    $msgId = (int) $pdo->lastInsertId();
    // The sender's read pointer is left alone: replying does not mean having seen what arrived meanwhile.
    $pdo->prepare('UPDATE message_threads SET last_message_at = NOW() WHERE id = ?')->execute([$thread['id']]);

    if ($firstUnreadForThem) {
        $stmt = $pdo->prepare('SELECT u.id, u.name, u.email FROM users u WHERE u.id = ? AND ' . NOTIFY_OK_SQL);
        $stmt->execute([$to]);
        if ($r = $stmt->fetch()) {
            // no text of the message in the e-mail: it may be private and mail is not
            queue_email($r['email'], 'Nova mensagem de ' . $me['name'] . ' - Portal of Future',
                "Olá, {$r['name']}!\n\n{$me['name']} enviou uma mensagem para você no Portal of Future.\n\nLeia e responda no portal:\n" . app_url()
                . "\n\n--\nVocê recebe este e-mail porque tem conta no Portal of Future. Para deixar de receber\nnotificações, desmarque a opção em \"Minha conta\" (clique no seu nome no menu lateral).");
        }
    }
    $stmt = $pdo->prepare('SELECT * FROM messages WHERE id = ?'); $stmt->execute([$msgId]);
    $message = message_record($stmt->fetch());
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $e;
}

$payload = ['ok' => true, 'message' => $message];
if (email_queue_due()) respond_then($payload, fn() => drain_email_queue());
respond($payload);
