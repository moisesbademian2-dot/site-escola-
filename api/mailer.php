<?php
// Sends e-mail over SMTP with implicit TLS (port 465 — Gmail, Outlook and most
// providers support it), with no external library. Configure MAIL_HOST etc. in
// mail_config.php (see mail_config.example.php); without it, e-mails are written
// to mail_log.txt instead of sent, so everything is still testable on a fresh
// checkout with no SMTP account.

class SmtpError extends RuntimeException {
    // true when the connection itself is gone (nothing more can be sent on it);
    // false for a refusal of one message, after which the next one can still go.
    public bool $fatal;
    public function __construct(string $message, bool $fatal = false) { parent::__construct($message); $this->fatal = $fatal; }
}

function send_mail(string $to, string $subject, string $body): bool {
    return send_mail_batch([['to' => $to, 'subject' => $subject, 'body' => $body]])[0] === true;
}

// Sends several messages over ONE connection. Returns, for each message in the same
// order, true if it went out or a string with the reason it didn't.
function send_mail_batch(array $messages): array {
    if (!$messages) return [];
    if (!defined('MAIL_HOST')) {
        return array_map(fn($m) => log_mail_to_file($m['to'], $m['subject'], $m['body']) ? true : 'não foi possível gravar mail_log.txt', $messages);
    }
    try {
        return smtp_send_batch(MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM, MAIL_FROM_NAME, $messages);
    } catch (Throwable $e) {
        error_log('send_mail_batch: ' . $e->getMessage());
        return array_fill(0, count($messages), $e->getMessage());
    }
}

function log_mail_to_file(string $to, string $subject, string $body): bool {
    $line = "===== " . date('c') . " =====\nPara: $to\nAssunto: $subject\n\n$body\n\n";
    return file_put_contents(__DIR__ . '/mail_log.txt', $line, FILE_APPEND | LOCK_EX) !== false;
}

// A single message; throws on failure. (Kept for callers that want an exception.)
function smtp_send(string $host, int $port, string $user, string $pass, string $from, string $fromName, string $to, string $subject, string $body): void {
    $r = smtp_send_batch($host, $port, $user, $pass, $from, $fromName, [['to' => $to, 'subject' => $subject, 'body' => $body]])[0];
    if ($r !== true) throw new SmtpError((string) $r);
}

function smtp_send_batch(string $host, int $port, string $user, string $pass, string $from, string $fromName, array $messages): array {
    $results = array_fill(0, count($messages), 'não enviado');
    // The server's certificate is checked by default. MAIL_VERIFY_PEER = false in
    // mail_config.php turns that off, for an internal SMTP server with a self-signed one.
    $verify = !defined('MAIL_VERIFY_PEER') || MAIL_VERIFY_PEER;
    $ctx = stream_context_create(['ssl' => ['verify_peer' => $verify, 'verify_peer_name' => $verify, 'allow_self_signed' => !$verify]]);
    $fp = @stream_socket_client("ssl://$host:$port", $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) throw new SmtpError("Não foi possível conectar a $host:$port ($errstr)", true);
    stream_set_timeout($fp, 15);
    try {
        smtp_expect($fp, 220);
        smtp_cmd($fp, 'EHLO localhost', 250);
        smtp_cmd($fp, 'AUTH LOGIN', 334);
        smtp_cmd($fp, base64_encode($user), 334);
        smtp_cmd($fp, base64_encode($pass), 235);
        foreach ($messages as $i => $m) {
            try {
                // These end up inside SMTP commands and headers: a CR/LF or angle bracket
                // in an address would let it inject more commands or headers.
                if (!smtp_safe_address($m['to']) || !smtp_safe_address($from)) throw new SmtpError('endereço de e-mail inválido');
                smtp_cmd($fp, 'MAIL FROM:<' . $from . '>', 250);
                smtp_cmd($fp, 'RCPT TO:<' . $m['to'] . '>', [250, 251]);
                smtp_cmd($fp, 'DATA', 354);
                // Base64 lines never start with '.', so no dot-stuffing is needed here.
                fwrite($fp, smtp_build_message($from, $fromName, $m['to'], $m['subject'], $m['body']) . "\r\n.\r\n");
                smtp_expect($fp, 250);
                $results[$i] = true;
            } catch (SmtpError $e) {
                if ($e->fatal) throw $e;
                $results[$i] = $e->getMessage();
                smtp_cmd($fp, 'RSET', 250); // forget the half-built transaction, carry on with the next
            }
        }
        try { smtp_cmd($fp, 'QUIT', 221); } catch (SmtpError $e) { /* everything was already delivered or refused */ }
    } catch (SmtpError $e) {
        // Connection or login failed, or died mid-way: whatever hasn't gone out keeps the reason.
        foreach ($results as $i => $r) if ($r !== true) $results[$i] = $e->getMessage();
    } finally {
        fclose($fp);
    }
    return $results;
}

function smtp_safe_address(string $a): bool {
    return $a !== '' && !preg_match('/[\r\n<>\0]/', $a) && filter_var($a, FILTER_VALIDATE_EMAIL) !== false;
}

function smtp_build_message(string $from, string $fromName, string $to, string $subject, string $body): string {
    return
        'From: ' . encode_header($fromName) . " <$from>\r\n" .
        "To: <$to>\r\n" .
        'Subject: =?UTF-8?B?' . base64_encode($subject) . "?=\r\n" .
        "MIME-Version: 1.0\r\n" .
        "Content-Type: text/plain; charset=UTF-8\r\n" .
        "Content-Transfer-Encoding: base64\r\n" .
        "\r\n" . chunk_split(base64_encode($body), 76, "\r\n");
}

function encode_header(string $s): string {
    $s = str_replace(["\r", "\n"], ' ', $s);
    return preg_match('/[^\x20-\x7E]/', $s) ? '=?UTF-8?B?' . base64_encode($s) . '?=' : $s;
}

function smtp_cmd($fp, string $line, $expect): void {
    fwrite($fp, $line . "\r\n");
    smtp_expect($fp, $expect);
}

// Reads a (possibly multi-line) SMTP reply and checks its code is one of $expect.
function smtp_expect($fp, $expect): void {
    $expect = (array) $expect;
    $last = '';
    do {
        $last = @fgets($fp, 1024); // a dropped connection is reported below, not as a PHP warning
        if ($last === false) throw new SmtpError('Conexão encerrada pelo servidor SMTP.', true);
    } while (isset($last[3]) && $last[3] === '-'); // "250-..." continues; "250 ..." is the last line
    $code = (int) substr($last, 0, 3);
    if (!in_array($code, $expect, true)) throw new SmtpError('Resposta inesperada do servidor: ' . trim($last), $code === 421 || $code === 0);
}
