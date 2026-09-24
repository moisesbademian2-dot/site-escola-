<?php
// Copy this file to mail_config.php (same folder) to send real e-mails (password reset
// links and grade/announcement/approval notifications) over SMTP with implicit TLS
// (port 465), instead of just logging them.
// mail_config.php is gitignored, so it's never committed.
//
// Without this file, e-mails are written to api/mail_log.txt instead of being
// sent — fine for developing/testing locally, since you can just open that file
// and copy the reset link out of it.
//
// Example for Gmail: create an "app password" (Conta Google > Segurança > Senhas
// de app — requires 2FA enabled) and use it as MAIL_PASS, not your normal password.

define('MAIL_HOST', 'smtp.gmail.com');
define('MAIL_PORT', 465);
define('MAIL_USER', 'seu-email@gmail.com');
define('MAIL_PASS', 'sua-senha-de-app');
define('MAIL_FROM', 'seu-email@gmail.com');
define('MAIL_FROM_NAME', 'Portal of Future');

// Only for an internal SMTP server with a self-signed certificate: skips checking it.
// Leave this out (or true) for Gmail, Outlook and other public providers.
// define('MAIL_VERIFY_PEER', false);
