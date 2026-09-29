# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Five roles at a single technical/vocational school ("Escola de Tecnologia", per the
institutional crest logo): diretor (director, full control), coordenador (coordinator,
everything except user accounts), professor (own classes/students only), aluno (student,
read-only on their own records), and responsável (guardian, read-only on their linked
child/children, can have more than one). Guardians and students routinely use this on a
phone (it is installed as a PWA); staff mostly use it on a desktop during the school day.

## Product Purpose

A self-hosted academic management system for one school: classes, students, teachers,
grades by bimestre, attendance, occurrences, announcements, a printable PDF report card,
a shared calendar, direct messaging, CSV student import, multi-year school history
(promote/retain at year-end), an audit trail, and e-mail notifications for grades,
announcements and signup decisions. Success is the school running its daily academic
record-keeping here instead of paper or spreadsheets, with parents and students able to
check grades/attendance themselves instead of asking staff.

## Positioning

Purpose-built for this one school's exact workflow (its role permissions, its bimestre
system, its year-end promotion rules) rather than a generic multi-tenant SaaS a school
would have to bend its process to fit. Self-hosted on the school's own XAMPP/MySQL stack
with no license fee and no vendor dependency.

## Operating Context

Runs on Apache/PHP/MySQL via XAMPP, self-hosted by the school (currently on the
director's own machine during setup). A vanilla JS front end (no build step, no
framework) talks to a PHP JSON API. Installable as a PWA on phones (offline shows the app
shell only; data always requires a live connection). New accounts other than the first
director require director approval, except responsável, whose account is gated instead
by proving they know a real student's matrícula.

## Capabilities and Constraints

Role-based visibility and write permissions are enforced server-side, not just hidden in
the UI (`api/config.php`'s `can_write`/`visible_collections`). Passwords are hashed;
login/reset/signup are rate-limited; every state change is journaled to an audit trail
the director alone reads. A student may have only one responsável account linked to
them; a responsável may have more than one child. Grades are locked per bimestre once
closed (server-enforced, no exception for the director). A closed school year is
read-only history.

## Brand Commitments

- Product/app name shown in the UI: "Portal of Future".
- Institutional identity (from the school's own crest, `logo2.0-quadrada.png`): a navy
  and gold emblem — laurel wreaths, three torches, a tree, "EDUCA+ ESCOLA" arched over
  the crest, "ESCOLA DE TECNOLOGIA" on a ribbon beneath it.
- Established palette already in use across the built dashboard: navy blue
  (`#1e3a8a`/`#1e40af`/`#3b82f6`) as the primary/ink color, amber/gold (`#fbbf24`) as the
  accent/CTA color. Any new surface should read as the same institution, not a rebrand.

## Evidence on Hand

- Real crest logo: `logo2.0-quadrada.png` (cropped square) and `logo2.0.png` (original).
- A working, populated dashboard (turmas, alunos, professores, usuários, etc.) already
  styled in the navy/amber palette — the incumbent visual world for every screen except
  the login/signup surface, which is being redesigned now.
- `README.md` documents every feature and role rule in detail; treat it as authoritative
  product truth alongside this file.

## Product Principles

1. Server-side permission checks are the real security boundary; the UI hiding something
   is convenience, not enforcement — never regress that when touching a screen.
2. Guardians and students are frequently on a phone; staff screens can assume desktop but
   should not break on one.
3. One school, one exact workflow — do not generalize toward a multi-tenant/configurable
   product; specificity to this school's rules is the point, not a gap to fix.
4. The audit trail and role scoping are load-bearing for trust with the school; never
   design around them or make them easy to bypass for convenience.
