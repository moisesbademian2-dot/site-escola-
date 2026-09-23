<?php
// Sends e-mail over SMTP with implicit TLS (port 465 — Gmail, Outlook and most
// providers support it), with no external library. Configure MAIL_HOST etc. in
// mail_config.php (see mail_config.example.php); without it, send_mail() writes
// the message to mail_log.txt instead of sending it, so the reset flow is still
// testable on a fresh checkout with no SMTP account.

function send_mail(string $to, string $subject, string $body): bool {
    if (!defined('MAIL_HOST')) return log_mail_to_file($to, $subject, $body);
    try {
        smtp_send(MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM, MAIL_FROM_NAME, $to, $subject, $body);
        return true;
    } catch (Throwable $e) {
        error_log('send_mail: ' . $e->getMessage());
        return false;
    }
}

function log_mail_to_file(string $to, string $subject, string $body): bool {
    $line = "===== " . date('c') . " =====\nPara: $to\nAssunto: $subject\n\n$body\n\n";
    return file_put_contents(__DIR__ . '/mail_log.txt', $line, FILE_APPEND | LOCK_EX) !== false;
}

class SmtpError extends RuntimeException {}

function smtp_send(string $host, int $port, string $user, string $pass, string $from, string $fromName, string $to, string $subject, string $body): void {
    $fp = @stream_socket_client("ssl://$host:$port", $errno, $errstr, 10);
    if (!$fp) throw new SmtpError("Não foi possível conectar a $host:$port ($errstr)");
    stream_set_timeout($fp, 10);
    try {
        smtp_expect($fp, 220);
        smtp_cmd($fp, 'EHLO localhost', 250);
        smtp_cmd($fp, 'AUTH LOGIN', 334);
        smtp_cmd($fp, base64_encode($user), 334);
        smtp_cmd($fp, base64_encode($pass), 235);
        smtp_cmd($fp, 'MAIL FROM:<' . $from . '>', 250);
        smtp_cmd($fp, 'RCPT TO:<' . $to . '>', [250, 251]);
        smtp_cmd($fp, 'DATA', 354);

        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $encodedBody = chunk_split(base64_encode($body), 76, "\r\n");
        $message =
            'From: ' . encode_header($fromName) . " <$from>\r\n" .
            "To: <$to>\r\n" .
            "Subject: $encodedSubject\r\n" .
            "MIME-Version: 1.0\r\n" .
            "Content-Type: text/plain; charset=UTF-8\r\n" .
            "Content-Transfer-Encoding: base64\r\n" .
            "\r\n" . $encodedBody;
        // Base64 lines never start with '.', so no dot-stuffing is needed here.
        fwrite($fp, $message . "\r\n.\r\n");
        smtp_expect($fp, 250);
        smtp_cmd($fp, 'QUIT', 221);
    } finally {
        fclose($fp);
    }
}

function encode_header(string $s): string {
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
        $last = fgets($fp, 1024);
        if ($last === false) throw new SmtpError('Conexão encerrada pelo servidor SMTP.');
    } while (isset($last[3]) && $last[3] === '-'); // "250-..." continues; "250 ..." is the last line
    $code = (int) substr($last, 0, 3);
    if (!in_array($code, $expect, true)) throw new SmtpError("Resposta inesperada do servidor: " . trim($last));
}
