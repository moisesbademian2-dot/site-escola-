# Portal of Future

Sistema de gestão acadêmica para escola: turmas, alunos, professores, notas por
bimestre, frequência, ocorrências, comunicados, boletim em PDF, importação de alunos por CSV, notificações por e-mail e calendário, com telas
diferentes para diretor, coordenador, professor, aluno e responsável.

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
5. (Opcional) Para o link de "esqueci minha senha" e as notificações serem
   enviados por e-mail de verdade, copie [api/mail_config.example.php](api/mail_config.example.php)
   para `api/mail_config.php` e configure um SMTP (veja o próprio arquivo). Sem
   isso, o sistema funciona igual, mas os e-mails são só escritos em
   `api/mail_log.txt` em vez de enviados — abra esse arquivo para ler o conteúdo
   (por exemplo, para pegar o link de redefinição).

## Estrutura

- [index.html](index.html), [style.css](style.css), [js/](js/) — front-end (uma página só, sem build; scripts comuns carregados em ordem pelo `index.html`): `core.js` (DB, Auth, utilitários, modais), `app.js` (navegação e login), `dashboards.js`, `pessoas.js` (alunos, turmas, professores, usuários), `academico.js` (chamada, notas, atividades, ocorrências, comunicados), `boletim.js`, `calendario.js`, `auditoria.js`, `anos.js`, `main.js`.
- [api/](api/) — back-end em PHP. Cada arquivo é uma rota:
  - `login.php`, `signup.php`, `register.php`, `logout.php`, `session.php`, `bootstrap.php` — autenticação e cadastro.
  - `forgot_password.php`, `reset_password.php` — fluxo de "esqueci minha senha" (link por e-mail, válido por 1h).
  - `mailer.php` — envio de e-mail (SMTP se `mail_config.php` existir, senão grava em `mail_log.txt`), vários e-mails por conexão.
  - `preferences.php` — a pessoa liga ou desliga as próprias notificações por e-mail.
  - `state.php` — devolve os dados que o usuário logado pode ver, conforme o papel dele.
  - `sync.php` — recebe as alterações feitas na tela e grava, validando cada registro contra o papel do usuário.
  - `audit.php` — a auditoria (só leitura, só o diretor).
  - `years.php` — anos letivos: encerrar o ano e abrir o próximo, renomear, histórico de um aluno num ano.
  - `reset.php` — apaga todos os dados (só o diretor, e só com a senha dele confirmada).
  - `config.php` — conexão com o banco, funções compartilhadas e as regras de quem pode ver/alterar o quê.
- [db.sql](db.sql) — schema do banco (tabelas relacionais, uma por tipo de dado).
- [scripts/send_queue.php](scripts/send_queue.php) — envia de uma vez toda a fila de e-mails (`php scripts/send_queue.php`); veja "Notificações por e-mail".
- [scripts/migrate_legacy.php](scripts/migrate_legacy.php) — importa dados de uma versão antiga do sistema, que guardava tudo como um JSON único (`app_state`). Rode com `php scripts/migrate_legacy.php` depois de importar o `db.sql`, se a tabela `app_state` ainda existir com dados.

## Papéis de acesso

| Papel | Pode ver | Pode alterar |
|---|---|---|
| Diretor | Tudo, incluindo usuários | Tudo |
| Coordenador | Tudo, exceto contas de usuário | Tudo, exceto contas de usuário |
| Professor | Só as próprias turmas e os alunos delas | Chamada, notas e ocorrências das próprias turmas |
| Aluno / Responsável | Só o(s) próprio(s) aluno(s) vinculado(s) | Nada (somente leitura) |

Um cadastro novo (exceto o primeiro diretor) fica **pendente** até o diretor
aprovar em Usuários. Um responsável pode ter mais de um filho vinculado (a
tabela `guardians`, gerenciada só pelo diretor em Usuários → editar → "Filhos
vinculados"); com mais de um, a barra lateral mostra um seletor para trocar de
qual filho está acompanhando.

## Boletim em PDF

Aluno e responsável abrem em Minhas Notas → "Boletim (PDF)"; diretor e
coordenador, na ficha do aluno (Alunos → Ver). O boletim mostra a média de cada
disciplina por bimestre, a média final, a frequência e a situação (aprovado a
partir de 7,0; recuperação a partir de 5,0). "Imprimir / Salvar em PDF" usa a
tela de impressão do próprio navegador — escolha "Salvar como PDF" como destino.
A "Média geral" é a média das médias finais por disciplina, então cada
disciplina conta uma vez, independente de quantas avaliações teve.

## Calendário

Todos os perfis têm o item **Calendário** no menu: um mês por vez, com provas,
eventos, feriados e reuniões (cada tipo com uma cor) e, sem cadastro extra, o
prazo de entrega das atividades. Clique num dia para ver os detalhes dele; a
lista "Próximos" mostra o que vem a partir de hoje. Um evento pode durar vários
dias e ser da escola toda ou de uma turma (quem tem mais de uma turma pode filtrar).

- **Diretor e coordenador** marcam e alteram qualquer evento.
- **Professor** marca eventos só para as turmas dele (nunca para a escola toda) e
  só altera os que ele mesmo criou.
- **Aluno e responsável** só consultam: veem os eventos da escola toda e das turmas
  dos alunos que acompanham.

Apagar uma turma apaga os eventos dela.

## Notificações por e-mail

O sistema avisa por e-mail: o **aluno e seus responsáveis** quando uma nota nova é
lançada (várias notas do mesmo pedido saem num e-mail só; corrigir uma nota que
já existe não avisa), **professores, alunos e responsáveis** quando um comunicado
é publicado (respeitando o "Destinatário"; quem publica não recebe) e **quem se
cadastrou** quando o diretor aprova ou recusa o cadastro. Cada pessoa pode
desligar as suas em "Minha conta" (clique no nome, no rodapé do menu lateral).

Os e-mails vão para uma fila (`email_queue`), gravada junto com a alteração que
os causa, e são enviados **depois** de a tela já ter recebido a resposta, então
salvar nunca espera o servidor de e-mail. Se o envio falhar, tenta de novo
quando alguém abrir uma página ou salvar algo (até 5 vezes, esperando 2 min a
mais a cada falha) e depois desiste. Para esvaziar uma fila grande de uma vez
(ou enviar sem ninguém usando o site), rode `php scripts/send_queue.php`, à mão
ou agendado (cron / Agendador de Tarefas do Windows). Sem `mail_config.php`, tudo
vai para `api/mail_log.txt`. Um Gmail comum aceita cerca de 500 e-mails por dia,
que é o teto realista para um comunicado "para todos".

## Anos letivos

Tudo que as telas mostram (turmas, notas, frequência, diário, atividades e calendário)
pertence ao **ano letivo ativo**, que aparece no topo da tela. O diretor (e o
coordenador, só para consultar) tem **Anos letivos** no menu.

**Encerrar o ano** (diretor): a tela mostra, turma por turma, a média e a situação de
cada aluno e sugere o destino — quem tem média a partir de 5,0 é *promovido* e quem
ficou abaixo é *retido* — que você ajusta aluno a aluno; uma turma pode ser marcada
como *de formandos* (todos concluem). O nome da turma dos promovidos vem sugerido
(TDS1 → TDS2). Depois de confirmar com a senha e o código, num só passo:

- o ano encerrado fica **congelado**: notas, presenças, turmas e o resto continuam
  guardados, mas nem o diretor consegue alterá-los;
- abre o novo ano com as turmas criadas (mesmo professor, sala e curso) e os alunos
  já colocados: promovidos na turma nova, retidos numa cópia da turma antiga,
  formandos como "Concluído", alunos não ativos saem da turma;
- grava em `enrollments` o **histórico escolar** de cada aluno (turma, média,
  frequência, resultado e destino daquele ano).

O histórico aparece em Anos letivos → Anos encerrados, na ficha do aluno ("Histórico
escolar") e, para alunos e responsáveis, no item **Histórico** do menu; de qualquer
ano encerrado dá para abrir e imprimir o boletim daquela época. Dados anteriores a
esta função (sem ano) contam como do ano ativo e passam para o ano certo na primeira
virada. "Resetar todo o sistema" recomeça com um único ano ativo.

## Auditoria

O diretor tem **Auditoria** no menu (Administração): o registro de tudo que foi criado,
alterado ou excluído — quem fez, quando, em qual registro e, nas alterações, o que
mudou ("Valor: 5 → 8") — além de logins, tentativas de login que falharam,
cadastros, senhas redefinidas e resets do sistema. Dá para filtrar por item, ação,
pessoa, texto e período. Senhas nunca entram no registro (uma troca aparece só como
"(alterada)"). O registro é gravado na mesma transação da alteração (se ela for
recusada, não sobra rastro), não tem tela nem rota para editar ou apagar, e nem
"Resetar todo o sistema" o apaga. Fica na tabela `audit_log`; ela só cresce, então
vale arquivar linhas antigas de tempos em tempos (por exemplo, com um dump e um `DELETE`).

## Importar alunos por CSV

Diretor e coordenador: Alunos → "Importar CSV". O arquivo tem um aluno por linha e
os títulos na primeira ("Baixar modelo" no próprio modal gera um exemplo).
Obrigatórias: `nome`, `matricula` e `turma` (nome de uma turma já cadastrada);
opcionais: `curso`, `periodo`, `email`, `telefone`, `nascimento` (AAAA-MM-DD ou
DD/MM/AAAA), `responsavel`, `telefone_responsavel` e `situacao`. Serve vírgula ou
ponto e vírgula (o Excel em português usa ;), UTF-8 ou Windows-1252, até 1000
alunos e 1 MB por arquivo. Antes de importar, aparece uma pré-visualização com o
resultado de cada linha; as linhas com problema (matrícula já cadastrada ou
repetida, turma inexistente, data inválida...) são listadas e ficam de fora,
as válidas entram.

## Segurança

- Senhas são salvas com `password_hash` (nunca em texto puro) e precisam ter no mínimo 8 caracteres (`MIN_PASSWORD_LENGTH` em `api/config.php`, `MIN_PASSWORD` em `js/core.js`). Contas antigas com senha mais curta continuam entrando; a regra vale ao criar ou trocar a senha.
- Cada rota confere o papel do usuário logado antes de devolver ou gravar dados.
- Cookie de sessão com `SameSite=Lax` e toda requisição que altera dados exige
  um header customizado — proteção contra CSRF.
- Login trava por 15 min após 5 tentativas erradas para o mesmo e-mail (e após 30 vindas do
  mesmo IP — o limite por IP é maior porque uma escola inteira costuma dividir um IP).
  O login certo zera só o contador do e-mail, nunca o do IP. Pedido de redefinição de
  senha trava por 1h após 3 pedidos por e-mail (20 por IP); cadastro e confirmação de
  senha ("apagar tudo", exclusões seguras) também têm limite.
- Sair (`logout.php`) só aceita POST. A sessão dura 8h sem uso; ao expirar, a tela avisa e volta ao login.
- O sistema nunca fica sem diretor: `sync.php` recusa alterações que deixariam zero diretores aprovados.
- Link de redefinição de senha expira em 1h e só pode ser usado uma vez; pedir
  um novo invalida o anterior.
- Não commite `api/db_config.php` nem `api/mail_config.php` — já estão no `.gitignore`.
