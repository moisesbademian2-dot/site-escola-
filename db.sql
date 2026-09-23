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
  student_id VARCHAR(64),
  curso_pretendido VARCHAR(255),
  turno_pretendido VARCHAR(255),
  created_at VARCHAR(40),
  FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS grades (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64),
  assessment VARCHAR(255),
  value DECIMAL(7,2),
  weight DECIMAL(7,2),
  date DATE,
  FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL
) ENGINE=InnoDB;

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

INSERT IGNORE INTO subjects (id, name, code) VALUES
  ('d1', 'Desenvolvimento Web', 'DWEB'),
  ('d2', 'Programação Mobile', 'PMOB'),
  ('d3', 'Banco de Dados', 'BDAD'),
  ('d4', 'Análise de Sistemas', 'ANSI'),
  ('d5', 'Matemática Aplicada', 'MATE'),
  ('d6', 'Português Instrumental', 'PORT');
