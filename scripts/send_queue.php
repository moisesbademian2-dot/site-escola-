<?php
// Sends every e-mail waiting in email_queue. The site already sends them by itself a
// few at a time whenever somebody saves something or opens a page, so this is only
// needed to empty a long queue (e.g. after a big announcement) or to keep sending when
// nobody is using the site. Run it by hand or from cron / Windows Task Scheduler:
//   php scripts/send_queue.php
// E-mails that fail are retried later (up to 5 times, waiting longer each time); this
// prints how many went out and how many are still waiting.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

ob_start();
require __DIR__ . '/../api/config.php';
ob_end_clean();
header_remove();

$sent = 0;
for ($round = 0; $round < 200 && email_queue_due(); $round++) {
    $n = drain_email_queue(50);
    $sent += $n;
    if ($n === 0) break; // whatever is left failed just now and is waiting for its retry
}
$waiting = (int) db()->query('SELECT COUNT(*) FROM email_queue WHERE sent_at IS NULL AND attempts < ' . EMAIL_MAX_ATTEMPTS)->fetchColumn();
$gaveUp = (int) db()->query('SELECT COUNT(*) FROM email_queue WHERE sent_at IS NULL AND attempts >= ' . EMAIL_MAX_ATTEMPTS)->fetchColumn();
echo "Enviados: $sent\nAguardando nova tentativa: $waiting\nDesistidos (5 falhas): $gaveUp\n";
