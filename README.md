# Portal of Future

Sistema de gestão acadêmica para escola: turmas, alunos, professores, notas,
frequência, ocorrências e comunicados, com telas diferentes para diretor,
coordenador, professor, aluno e responsável.

## Como rodar

Requer PHP 8+ e MySQL/MariaDB — mais fácil com o
[XAMPP](https://www.apachefriends.org/pt_br/index.html).

1. Copie a pasta do projeto para `htdocs/` do XAMPP (ou aponte o Apache para ela).
2. Importe o banco: no phpMyAdmin, crie a partir do arquivo [db.sql](db.sql)
   (ou `mysql -u root < db.sql`). Isso cria o banco `portal_of_future` e as
   tabelas, já com as seis disciplinas padrão.
3. As credenciais padrão do banco são as do XAMPP (usuário `root`, sem senha) e
   já funcionam sem configuração. Se o seu banco usa outro usuário/senha, copie
   [api/db_config.example.php](api/db_config.example.php) para
   `api/db_config.php` e ajuste os valores — esse arquivo não entra no Git.
4. Abra `http://localhost/<pasta-do-projeto>/index.html`. Na primeira vez, o
   sistema pede para criar a conta do diretor.
5. (Opcional) Para o link de "esqueci minha senha" ser enviado por e-mail de
   verdade, copie [api/mail_config.example.php](api/mail_config.example.php)
   para `api/mail_config.php` e configure um SMTP (veja o próprio arquivo). Sem
   isso, o sistema funciona igual, mas o e-mail é só escrito em
   `api/mail_log.txt` em vez de enviado — abra esse arquivo para pegar o link.

## Estrutura

- [index.html](index.html), [style.css](style.css), [script.js](script.js) — front-end (uma página só, sem build).
- [api/](api/) — back-end em PHP. Cada arquivo é uma rota:
  - `login.php`, `signup.php`, `register.php`, `logout.php`, `session.php`, `bootstrap.php` — autenticação e cadastro.
  - `forgot_password.php`, `reset_password.php` — fluxo de "esqueci minha senha" (link por e-mail, válido por 1h).
  - `mailer.php` — envio de e-mail (SMTP se `mail_config.php` existir, senão grava em `mail_log.txt`).
  - `state.php` — devolve os dados que o usuário logado pode ver, conforme o papel dele.
  - `sync.php` — recebe as alterações feitas na tela e grava, validando cada registro contra o papel do usuário.
  - `reset.php` — apaga todos os dados (só o diretor pode usar).
  - `config.php` — conexão com o banco, funções compartilhadas e as regras de quem pode ver/alterar o quê.
- [db.sql](db.sql) — schema do banco (tabelas relacionais, uma por tipo de dado).
- [scripts/migrate_legacy.php](scripts/migrate_legacy.php) — importa dados de uma versão antiga do sistema, que guardava tudo como um JSON único (`app_state`). Rode com `php scripts/migrate_legacy.php` depois de importar o `db.sql`, se a tabela `app_state` ainda existir com dados.

## Papéis de acesso

| Papel | Pode ver | Pode alterar |
|---|---|---|
| Diretor | Tudo, incluindo usuários | Tudo |
| Coordenador | Tudo, exceto contas de usuário | Tudo, exceto contas de usuário |
| Professor | Só as próprias turmas e os alunos delas | Chamada, notas e ocorrências das próprias turmas |
| Aluno / Responsável | Só o próprio aluno vinculado | Nada (somente leitura) |

Um cadastro novo (exceto o primeiro diretor) fica **pendente** até o diretor
aprovar em Usuários.

## Segurança

- Senhas são salvas com `password_hash` (nunca em texto puro).
- Cada rota confere o papel do usuário logado antes de devolver ou gravar dados.
- Cookie de sessão com `SameSite=Lax` e toda requisição que altera dados exige
  um header customizado — proteção contra CSRF.
- Login trava por 15 min após 5 tentativas erradas (por e-mail e por IP). Pedido
  de redefinição de senha trava por 1h após 3 pedidos.
- Link de redefinição de senha expira em 1h e só pode ser usado uma vez; pedir
  um novo invalida o anterior.
- Não commite `api/db_config.php` nem `api/mail_config.php` — já estão no `.gitignore`.
