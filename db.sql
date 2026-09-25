-- Keeps accents intact when this file is imported from the mysql command line (its default
-- client charset on Windows is not UTF-8).
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS portal_of_future CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portal_of_future;

CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  code VARCHAR(255)
) ENGINE=InnoDB;

-- user_id has no foreign key on purpose: users -> students -> classes -> teachers
-- would otherwise form a cycle. api/sync.php clears it when a user is deleted.
CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(255),
  subject VARCHAR(255),
  user_id VARCHAR(64),
  INDEX (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  course VARCHAR(255),
  semester VARCHAR(255),
  period VARCHAR(255),
  room VARCHAR(255),
  teacher_id VARCHAR(64),
  FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  matricula VARCHAR(255),
  birth DATE,
  email VARCHAR(255),
  phone VARCHAR(255),
  class_id VARCHAR(64),
  course VARCHAR(255),
  period VARCHAR(255),
  guardian VARCHAR(255),
  guardian_phone VARCHAR(255),
  status VARCHAR(255),
  FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  avatar VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'aprovado',
  matricula VARCHAR(255),
  -- student_id is only for role='aluno' (a student's own login, always exactly one).
  -- role='responsavel' uses the guardians table below instead, since one responsável
  -- can have more than one child.
  student_id VARCHAR(64),
  curso_pretendido VARCHAR(255),
  turno_pretendido VARCHAR(255),
  created_at VARCHAR(40),
  -- '0' = this person turned e-mail notifications off; NULL or '1' = on.
  -- Not part of the synced records: only api/preferences.php changes it.
  notify_email CHAR(1),
  FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Adds notify_email to a users table created before it existed (re-running this
-- file on an existing database is safe).
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_email CHAR(1);

-- A responsável <-> student link; a responsável can have several, a student can
-- (in principle) have more than one guardian account too.
CREATE TABLE IF NOT EXISTS guardians (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  UNIQUE (user_id, student_id)
) ENGINE=InnoDB;

-- Carries over links that were still stored as users.student_id from before this
-- table existed (safe to re-run: the second run finds no student_id left to move).
INSERT IGNORE INTO guardians (id, user_id, student_id)
  SELECT CONCAT('gd-', id), id, student_id FROM users WHERE role = 'responsavel' AND student_id IS NOT NULL;
UPDATE users SET student_id = NULL WHERE role = 'responsavel' AND student_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS grades (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64),
  assessment VARCHAR(255),
  value DECIMAL(7,2),
  weight DECIMAL(7,2),
  date DATE,
  -- '1º Bimestre'..'4º Bimestre', or NULL for notes from before this column existed.
  -- Named "bimestre", not "period", so it isn't confused with the turno/shift
  -- ("período") field that classes and students already have.
  bimestre VARCHAR(20),
  FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Adds `bimestre` to a grades table created before it existed (re-running this
-- file on an existing database is safe).
ALTER TABLE grades ADD COLUMN IF NOT EXISTS bimestre VARCHAR(20);

CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  class_id VARCHAR(64),
  subject_id VARCHAR(64),
  teacher_id VARCHAR(64),
  date DATE,
  status VARCHAR(20),
  FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR(64) PRIMARY KEY,
  class_id VARCHAR(64),
  subject_id VARCHAR(64),
  date DATE,
  content TEXT,
  note TEXT,
  FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(64) PRIMARY KEY,
  class_id VARCHAR(64),
  title VARCHAR(255),
  subject VARCHAR(255),
  due_date DATE,
  value DECIMAL(7,2),
  status VARCHAR(255),
  description TEXT,
  created_at VARCHAR(40),
  FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS occurrences (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  teacher_id VARCHAR(64),
  date DATE,
  category VARCHAR(255),
  situation VARCHAR(255),
  description TEXT,
  FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255),
  target VARCHAR(255),
  author VARCHAR(255),
  message TEXT,
  date DATE
) ENGINE=InnoDB;

-- One row per failed login (and per "forgot password" request), by IP and by
-- e-mail; api/config.php reads/clears these to lock out an identifier after too
-- many attempts in a short window.
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (identifier, created_at)
) ENGINE=InnoDB;

-- "Esqueci minha senha": one row per active reset link. Only the token's hash is
-- stored, same idea as the password itself -- a DB leak alone isn't enough to use it.
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX (user_id)
) ENGINE=InnoDB;

-- School calendar: tests, meetings, holidays... class_id empty = the whole school.
-- created_by is who added it, because a professor may only change their own.
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20),
  date DATE NOT NULL,
  end_date DATE,
  class_id VARCHAR(64),
  description TEXT,
  created_by VARCHAR(64),
  FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  INDEX (date)
) ENGINE=InnoDB;

-- E-mails waiting to go out (grades, announcements, account approval). Written in the
-- same transaction as the change that causes them, then sent after the response by
-- api/config.php (or by scripts/send_queue.php); failures are retried up to 5 times.
CREATE TABLE IF NOT EXISTS email_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  attempts TINYINT NOT NULL DEFAULT 0,
  last_error VARCHAR(255),
  claimed_by CHAR(16),
  claimed_at TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (sent_at, attempts, id)
) ENGINE=InnoDB;

INSERT IGNORE INTO subjects (id, name, code) VALUES
  ('d1', 'Desenvolvimento Web', 'DWEB'),
  ('d2', 'Programação Mobile', 'PMOB'),
  ('d3', 'Banco de Dados', 'BDAD'),
  ('d4', 'Análise de Sistemas', 'ANSI'),
  ('d5', 'Matemática Aplicada', 'MATE'),
  ('d6', 'Português Instrumental', 'PORT');

-- Audit trail: who did what and when. Written by api/config.php (audit()) in the same
-- transaction as the change it records, and never edited or deleted by the app (not even by
-- "resetar sistema"). No foreign keys on purpose: the trail must outlive the people in it.
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(64),
  user_name VARCHAR(255),
  user_role VARCHAR(20),
  action VARCHAR(30) NOT NULL,
  entity VARCHAR(40) NOT NULL,
  entity_id VARCHAR(64),
  label VARCHAR(255),
  details TEXT,
  ip VARCHAR(45),
  INDEX (created_at),
  INDEX (entity, entity_id),
  INDEX (user_id, created_at)
) ENGINE=InnoDB;

-- School years. Exactly one is 'ativo'; everything the screens show (classes, grades,
-- attendance, lessons, activities, calendar) belongs to it. api/years.php closes it,
-- opens the next one and carries the students over, keeping the old year's data
-- readable but frozen.
CREATE TABLE IF NOT EXISTS school_years (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO school_years (id, name, start_date, end_date, status)
  SELECT 'y-inicial', CONCAT('Ano letivo ', YEAR(CURDATE())), CONCAT(YEAR(CURDATE()), '-01-01'), CONCAT(YEAR(CURDATE()), '-12-31'), 'ativo'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM school_years);

-- year_id on what is per-year. NULL (rows from before this existed, or from
-- scripts/migrate_legacy.php) counts as "the active year", and is stamped with the
-- real year when that year is closed.
ALTER TABLE classes ADD COLUMN IF NOT EXISTS year_id VARCHAR(64);
ALTER TABLE grades ADD COLUMN IF NOT EXISTS year_id VARCHAR(64);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS year_id VARCHAR(64);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS year_id VARCHAR(64);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS year_id VARCHAR(64);
ALTER TABLE events ADD COLUMN IF NOT EXISTS year_id VARCHAR(64);
ALTER TABLE classes ADD INDEX IF NOT EXISTS idx_classes_year (year_id);
ALTER TABLE grades ADD INDEX IF NOT EXISTS idx_grades_year (year_id);
ALTER TABLE attendance ADD INDEX IF NOT EXISTS idx_attendance_year (year_id);
ALTER TABLE lessons ADD INDEX IF NOT EXISTS idx_lessons_year (year_id);
ALTER TABLE activities ADD INDEX IF NOT EXISTS idx_activities_year (year_id);
ALTER TABLE events ADD INDEX IF NOT EXISTS idx_events_year (year_id);

-- The school record: one row per student per closed year, with what they ended up with.
-- The names are copied so the history still reads right after a class is renamed or gone.
CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR(64) PRIMARY KEY,
  year_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  student_name VARCHAR(255),
  class_id VARCHAR(64),
  class_name VARCHAR(255),
  average DECIMAL(5,2),
  frequency DECIMAL(5,1),
  result VARCHAR(20),
  decision VARCHAR(20),
  FOREIGN KEY (year_id) REFERENCES school_years (id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  UNIQUE (year_id, student_id)
) ENGINE=InnoDB;

-- Closing grades by bimestre. A bimestre is closed when a coordenador/diretor closes it, or when its
-- deadline has passed; while closed, nobody (diretor included) can add, change or remove a grade in it
-- until it is reopened. A missing row means "open, no deadline".
CREATE TABLE IF NOT EXISTS grade_periods (
  year_id VARCHAR(64) NOT NULL,
  bimestre VARCHAR(20) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'aberto',
  deadline DATE,
  updated_by VARCHAR(64),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (year_id, bimestre),
  FOREIGN KEY (year_id) REFERENCES school_years (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Direct messages between two people (api/messages.php decides who may write to whom).
-- One thread per pair; user_a < user_b so the pair has a single spelling. read_a/read_b are
-- the last message id each of them has seen. Nothing here is copied to the audit trail:
-- conversations are private, not even to the diretor.
CREATE TABLE IF NOT EXISTS message_threads (
  id VARCHAR(64) PRIMARY KEY,
  user_a VARCHAR(64) NOT NULL,
  user_b VARCHAR(64) NOT NULL,
  read_a BIGINT NOT NULL DEFAULT 0,
  read_b BIGINT NOT NULL DEFAULT 0,
  last_message_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_a, user_b),
  FOREIGN KEY (user_a) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (user_b) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  thread_id VARCHAR(64) NOT NULL,
  sender_id VARCHAR(64) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES message_threads (id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX (thread_id, id)
) ENGINE=InnoDB;
