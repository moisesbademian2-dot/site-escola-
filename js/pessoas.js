'use strict';

App.renderAlunosTable = function () {
  const busca = (document.getElementById('busca-aluno') || {}).value || '';
  const ft = (document.getElementById('filtro-turma') || {}).value || '';
  const fs = (document.getElementById('filtro-situacao') || {}).value || '';
  let list = DB.state.students.slice();
  if (busca) { const q = busca.toLowerCase(); list = list.filter(s => s.name.toLowerCase().includes(q) || String(s.matricula).toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)); }
  if (ft) list = list.filter(s => s.classId === ft);
  if (fs) list = list.filter(s => s.status === fs);
  const canEdit = ['diretor','coordenador'].includes(Auth.currentUser.role);
  const ct = document.getElementById('tabela-alunos');
  if (!ct) return;
  if (!list.length) {
    ct.innerHTML = DB.state.students.length === 0 ? this.emptyState('student', 'Nenhum aluno cadastrado', 'Comece cadastrando o primeiro aluno da instituição.') : '<div class="empty"><div class="empty-icon">' + Icons.search + '</div><h4>Nenhum resultado</h4><p>Ajuste os filtros e tente novamente.</p></div>';
    return;
  }
  let h = '<div class="table-wrap"><table class="data"><thead><tr><th>Matrícula</th><th>Nome</th><th>Turma</th><th>Curso</th><th>Situação</th>' + (canEdit ? '<th style="text-align:right;">Ações</th>' : '') + '</tr></thead><tbody>';
  list.forEach(s => {
    const t = this.classById(s.classId);
    h += '<tr><td><span class="mono" style="font-size:12.5px;">' + Util.esc(s.matricula) + '</span></td><td><div class="cell-user"><div class="avatar-sm" style="background:' + Util.colorFor(s.name) + '">' + Util.esc(Util.initials(s.name)) + '</div><div class="u-meta"><strong>' + Util.esc(s.name) + '</strong><span>' + Util.esc(s.email || '—') + '</span></div></div></td><td>' + (t ? Util.esc(t.name) : '—') + '</td><td class="text-sm text-muted">' + Util.esc(s.course || '—') + '</td><td><span class="badge ' + Util.statusClass(s.status) + '">' + Util.esc(s.status) + '</span></td>' + (canEdit ? '<td><div class="actions"><button type="button" class="btn btn-ghost btn-xs" data-ver="' + Util.esc(s.id) + '">Ver</button><button type="button" class="btn btn-secondary btn-xs" data-edit="' + Util.esc(s.id) + '">Editar</button><button type="button" class="btn btn-danger btn-xs" data-del="' + Util.esc(s.id) + '">Excluir</button></div></td>' : '') + '</tr>';
  });
  h += '</tbody></table></div>';
  ct.innerHTML = h;
};

App.modalAluno = function (id) {
  const s = id ? this.studentById(id) : null;
  const editing = !!s;
  if (!DB.state.classes.length) { Toast.warning('Cadastre uma turma antes de adicionar alunos.'); this.navigate('turmas'); return; }
  const body = '<form id="form-aluno" novalidate><div class="form-grid">' +
    '<div class="field-group full"><label>Nome completo <span class="req">*</span></label><input name="name" value="' + Util.esc(s ? s.name : '') + '" required autofocus><div class="err">Informe o nome completo.</div></div>' +
    '<div class="field-group"><label>Matrícula <span class="req">*</span></label><input name="matricula" value="' + Util.esc(s ? s.matricula : '') + '" required placeholder="Ex: 2024011"><div class="err">Informe a matrícula.</div></div>' +
    '<div class="field-group"><label>Data de nascimento</label><input type="date" name="birth" value="' + Util.esc(s ? (s.birth || '') : '') + '"></div>' +
    '<div class="field-group"><label>E-mail</label><input type="email" name="email" value="' + Util.esc(s ? s.email : '') + '" placeholder="aluno@escola.com"></div>' +
    '<div class="field-group"><label>Telefone</label><input type="text" name="phone" value="' + Util.esc(s ? s.phone : '') + '" placeholder="(11) 99999-9999"></div>' +
    '<div class="field-group"><label>Turma <span class="req">*</span></label><select name="classId" required><option value="">Selecione...</option>' + DB.state.classes.map(c => '<option value="' + Util.esc(c.id) + '"' + (s && s.classId === c.id ? ' selected' : '') + '>' + Util.esc(c.name) + ' — ' + Util.esc(c.period) + '</option>').join('') + '</select><div class="err">Selecione uma turma.</div></div>' +
    '<div class="field-group"><label>Curso</label><input name="course" value="' + Util.esc(s ? s.course : '') + '" placeholder="Ex: Técnico em Informática"></div>' +
    '<div class="field-group"><label>Período</label><select name="period">' + ['Manhã','Tarde','Noite'].map(p => '<option' + (s && s.period === p ? ' selected' : '') + '>' + p + '</option>').join('') + '</select></div>' +
    '<div class="field-group"><label>Nome do responsável</label><input name="guardian" value="' + Util.esc(s ? s.guardian : '') + '"></div>' +
    '<div class="field-group"><label>Telefone do responsável</label><input name="guardianPhone" value="' + Util.esc(s ? s.guardianPhone : '') + '"></div>' +
    '<div class="field-group"><label>Situação</label><select name="status">' + ['Ativo','Inativo','Transferido','Concluído'].map(x => '<option' + (s && s.status === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div>' +
    '</div></form>';
  Modal.open({
    title: editing ? 'Editar aluno' : 'Cadastrar novo aluno', icon: Icons.student, body: body, size: 'lg',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>' + (editing ? 'Salvar alterações' : 'Cadastrar aluno') + '</button>',
    onMount: (bd, close) => {
      const form = bd.querySelector('#form-aluno');
      bd.querySelector('[data-save]').addEventListener('click', () => {
        if (!this.validateForm(form)) { Toast.error('Preencha os campos obrigatórios.'); return; }
        const data = Object.fromEntries(new FormData(form).entries());
        const dup = DB.state.students.find(x => x.matricula === data.matricula && x.id !== (s ? s.id : ''));
        if (dup) { Toast.error('Já existe um aluno com esta matrícula.'); return; }
        if (editing) { Object.assign(s, data); Toast.success('Aluno atualizado com sucesso.'); }
        else { data.id = DB.id('s'); DB.state.students.push(data); Toast.success('Aluno cadastrado com sucesso.'); }
        DB.save(); close(); this.renderAlunosTable();
      });
    }
  });
};

// ---------------------------------------------------------------------------
// Importar alunos por CSV: tudo é lido e conferido aqui no navegador, com
// pré-visualização; o que for válido entra pelo mesmo DB.save() do cadastro
// manual, então o servidor confere permissão e valida cada registro de novo.
// ---------------------------------------------------------------------------

// campo do aluno -> nomes aceitos no cabeçalho (comparados por Util.slug)
const CSV_COLUMNS = {
  name: ['nome', 'nomecompleto', 'aluno'],
  matricula: ['matricula', 'ra'],
  turma: ['turma'],
  course: ['curso'],
  period: ['periodo', 'turno'],
  email: ['email'],
  phone: ['telefone', 'celular', 'fone'],
  birth: ['nascimento', 'datanascimento', 'datadenascimento'],
  guardian: ['responsavel', 'nomedoresponsavel'],
  guardianPhone: ['telefoneresponsavel', 'telefonedoresponsavel', 'celularresponsavel', 'fonedoresponsavel'],
  status: ['situacao', 'status']
};
const CSV_MAX_ALUNOS = 1000;

// "AAAA-MM-DD" or "DD/MM/AAAA" (also - or .) -> "AAAA-MM-DD", or null if it isn't a real date.
Util.parseDate = function (s) {
  let y, mo, d, m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
  else return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
};

// -> { error } for a file that can't be used at all, or
//    { ignored: [unrecognized column titles], rows: [{ line, turma, data, errors: [] }] }.
App.parseAlunosCsv = function (text) {
  const all = Util.parseCsv(text);
  if (!all.length) return { error: 'O arquivo está vazio.' };
  const col = {}, ignored = [];
  all[0].cells.forEach((h, i) => {
    const k = Util.slug(h);
    const f = Object.keys(CSV_COLUMNS).find(f => CSV_COLUMNS[f].includes(k));
    if (f && !(f in col)) col[f] = i; else if (k) ignored.push(h.trim());
  });
  const missing = [['name', 'nome'], ['matricula', 'matricula'], ['turma', 'turma']].filter(p => !(p[0] in col)).map(p => p[1]);
  if (missing.length) return { error: 'Faltam colunas obrigatórias na primeira linha do arquivo: ' + missing.join(', ') + '.' };
  if (all.length - 1 > CSV_MAX_ALUNOS) return { error: 'O arquivo tem mais de ' + CSV_MAX_ALUNOS + ' alunos. Divida em arquivos menores.' };

  const classes = {};
  DB.state.classes.forEach(c => { classes[Util.slug(c.name)] = c; });
  const taken = new Set(DB.state.students.map(s => String(s.matricula).trim().toLowerCase()));
  const seen = {}; // matrícula -> first line of the file that used it
  const PERIODS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
  const STATUSES = { ativo: 'Ativo', inativo: 'Inativo', transferido: 'Transferido', concluido: 'Concluído' };

  const rows = all.slice(1).map(r => {
    const get = f => (f in col && r.cells[col[f]] !== undefined) ? r.cells[col[f]].trim() : '';
    const errors = [];
    const data = { name: get('name'), matricula: get('matricula'), course: get('course'), email: get('email'), phone: get('phone'), guardian: get('guardian'), guardianPhone: get('guardianPhone'), birth: '', period: '', status: 'Ativo' };
    if (!data.name) errors.push('nome em branco');
    const turma = get('turma');
    const cls = classes[Util.slug(turma)];
    if (!turma) errors.push('turma em branco');
    else if (!cls) errors.push('a turma "' + turma + '" não existe');
    else data.classId = cls.id;
    const p = get('period');
    if (p) { if (PERIODS[Util.slug(p)]) data.period = PERIODS[Util.slug(p)]; else errors.push('período "' + p + '" inválido (use Manhã, Tarde ou Noite)'); }
    else if (cls) data.period = cls.period || '';
    const st = get('status');
    if (st) { if (STATUSES[Util.slug(st)]) data.status = STATUSES[Util.slug(st)]; else errors.push('situação "' + st + '" inválida'); }
    const b = get('birth');
    if (b) { const iso = Util.parseDate(b); if (iso) data.birth = iso; else errors.push('nascimento inválido (use AAAA-MM-DD ou DD/MM/AAAA)'); }
    if (data.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) errors.push('e-mail inválido');
    if (Object.values(data).some(v => String(v).length > 255)) errors.push('algum campo passa de 255 caracteres');
    // last, so a row that failed for another reason doesn't "use up" its matrícula
    if (!data.matricula) errors.push('matrícula em branco');
    else {
      const m = data.matricula.toLowerCase();
      if (taken.has(m)) errors.push('matrícula já cadastrada');
      else if (seen[m]) errors.push('matrícula repetida (já na linha ' + seen[m] + ')');
      else if (!errors.length) seen[m] = r.line;
    }
    return { line: r.line, turma: turma, data: data, errors: errors };
  });
  return { ignored: ignored, rows: rows };
};

App.templateCsv = function () {
  const q = v => /[;"\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  const turma = q(DB.state.classes.length ? DB.state.classes[0].name : 'NOME DA TURMA');
  return '﻿' + [
    'nome;matricula;turma;curso;periodo;email;telefone;nascimento;responsavel;telefone_responsavel;situacao',
    'Maria da Silva;2024001;' + turma + ';Técnico em Informática;Manhã;maria@exemplo.com;(11) 99999-0001;15/03/2008;Ana da Silva;(11) 99999-0002;Ativo',
    'João Souza;2024002;' + turma + ';;;;;;;;'
  ].join('\r\n') + '\r\n';
};

App.modalImportarAlunos = function () {
  if (!DB.state.classes.length) { Toast.warning('Cadastre uma turma antes de importar alunos.'); this.navigate('turmas'); return; }
  let valid = [];
  const body = '<p class="text-sm" style="line-height:1.6;margin-bottom:14px;">Envie um arquivo <strong>.csv</strong> com um aluno por linha e os títulos na primeira linha. Obrigatórias: <strong>nome</strong>, <strong>matricula</strong> e <strong>turma</strong> (o nome de uma turma já cadastrada: ' + DB.state.classes.map(c => Util.esc(c.name)).join(', ') + '). Opcionais: curso, periodo, email, telefone, nascimento, responsavel, telefone_responsavel, situacao. Separador vírgula ou ponto e vírgula.</p>' +
    '<div class="flex gap-8 mb-16" style="flex-wrap:wrap;align-items:center;"><input type="file" id="csv-file" accept=".csv,.txt,text/csv"><button type="button" class="btn btn-secondary btn-sm" id="csv-template">Baixar modelo</button></div>' +
    '<div id="csv-preview"></div>';
  Modal.open({
    title: 'Importar alunos por CSV', icon: Icons.student, size: 'lg', body: body,
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-import disabled>Importar</button>',
    onMount: (bd, close) => {
      const fileEl = bd.querySelector('#csv-file'), prev = bd.querySelector('#csv-preview'), btn = bd.querySelector('[data-import]');
      const problem = msg => '<p style="color:var(--danger);font-size:13.5px;line-height:1.5;">' + Util.esc(msg) + '</p>';
      bd.querySelector('#csv-template').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([this.templateCsv()], { type: 'text/csv;charset=utf-8' }));
        a.download = 'modelo-alunos.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
      fileEl.addEventListener('change', async () => {
        valid = []; btn.disabled = true; btn.textContent = 'Importar';
        const f = fileEl.files[0];
        if (!f) { prev.innerHTML = ''; return; }
        if (f.size > 1024 * 1024) { prev.innerHTML = problem('O arquivo passa de 1 MB.'); return; }
        // Excel in Portuguese saves plain "CSV" as Windows-1252, not UTF-8
        const buf = await f.arrayBuffer();
        let text;
        try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { text = new TextDecoder('windows-1252').decode(buf); }
        const r = this.parseAlunosCsv(text);
        if (r.error) { prev.innerHTML = problem(r.error); return; }
        valid = r.rows.filter(x => !x.errors.length);
        const bad = r.rows.length - valid.length;
        let h = '<p class="text-sm mb-8"><strong>' + valid.length + '</strong> aluno(s) prontos para importar' + (bad ? ' · <strong style="color:var(--danger);">' + bad + ' com problema</strong> (essas linhas não serão importadas)' : '') + '.' +
          (r.ignored.length ? ' <span class="text-muted">Colunas ignoradas: ' + r.ignored.map(Util.esc).join(', ') + '.</span>' : '') + '</p>';
        if (r.rows.length) {
          h += '<div class="table-wrap" style="max-height:320px;overflow:auto;"><table class="data"><thead><tr><th>Linha</th><th>Nome</th><th>Matrícula</th><th>Turma</th><th>Resultado</th></tr></thead><tbody>' +
            r.rows.map(x => '<tr><td class="mono text-sm">' + x.line + '</td><td>' + Util.esc(x.data.name) + '</td><td class="mono text-sm">' + Util.esc(x.data.matricula) + '</td><td>' + Util.esc(x.turma) + '</td><td>' +
              (x.errors.length ? '<span class="badge red">' + Util.esc(x.errors.join('; ')) + '</span>' : '<span class="badge green">OK</span>') + '</td></tr>').join('') +
            '</tbody></table></div>';
        } else h += '<p class="text-muted text-sm">O arquivo tem só o cabeçalho, nenhum aluno.</p>';
        prev.innerHTML = h;
        btn.disabled = !valid.length;
        if (valid.length) btn.textContent = 'Importar ' + valid.length + ' aluno(s)';
      });
      btn.addEventListener('click', () => {
        if (!valid.length) return;
        const used = new Set(DB.state.students.map(s => s.id));
        valid.forEach(r => {
          let id; do { id = DB.id('s'); } while (used.has(id));
          used.add(id);
          DB.state.students.push(Object.assign({ id: id }, r.data));
        });
        const n = valid.length;
        DB.save(); close(); this.navigate('alunos');
        Toast.success(n + ' aluno(s) importado(s).');
      });
    }
  });
};

// "Minha conta": who you are logged in as, and the one setting a person can change
// on their own — whether they get e-mail notifications (see api/preferences.php).
App.modalMinhaConta = function () {
  const u = Auth.currentUser;
  const label = t => '<span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">' + t + '</span>';
  Modal.open({
    title: 'Minha conta', icon: Icons.user,
    body: '<div class="grid-2 mb-24"><div>' + label('Nome') + '<div>' + Util.esc(u.name) + '</div></div><div>' + label('Perfil') + '<div>' + Util.roleLabel(u.role) + '</div></div><div class="full" style="grid-column:1/-1;">' + label('E-mail') + '<div>' + Util.esc(u.email) + '</div></div></div>' +
      '<div class="divider"></div>' +
      '<label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;"><input type="checkbox" id="conta-notify" style="width:auto;margin-top:4px;"' + (u.notifyEmail === '0' ? '' : ' checked') + '><span><strong>Receber notificações por e-mail</strong><br><span class="text-sm text-muted">Novas notas, comunicados e avisos sobre o seu cadastro.</span></span></label>',
    footer: '<button type="button" class="btn btn-secondary" data-close>Fechar</button><button type="button" class="btn btn-primary" data-save>Salvar</button>',
    onMount: (bd, close) => {
      bd.querySelector('[data-save]').addEventListener('click', async () => {
        const want = bd.querySelector('#conta-notify').checked;
        try {
          const res = await apiPost(DB.API + 'preferences.php', { notifyEmail: want });
          const d = await res.json();
          if (!res.ok || !d.ok) throw new Error(d.error || 'falha');
          u.notifyEmail = d.notifyEmail;
          Toast.success('Preferências salvas.'); close();
        } catch (e) { Toast.error('Não foi possível salvar. Tente de novo.'); }
      });
    }
  });
};

App.verAluno = function (id) {
  const s = this.studentById(id);
  if (!s) return;
  const t = this.classById(s.classId);
  const a = this.attendanceStats(s.id);
  const m = this.averageOf(s.id);
  const body = '<div class="flex items-center gap-16 mb-24"><div style="width:60px;height:60px;border-radius:12px;background:' + Util.colorFor(s.name) + ';display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;">' + Util.esc(Util.initials(s.name)) + '</div><div><h2 style="font-size:20px;font-weight:700;letter-spacing:-0.02em;">' + Util.esc(s.name) + '</h2><p class="text-muted text-sm mono">' + Util.esc(s.matricula) + '</p></div></div>' +
    '<div class="grid-2 mb-24"><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Turma</span><div>' + (t ? Util.esc(t.name) : '—') + '</div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Curso</span><div>' + Util.esc(s.course || '—') + '</div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Período</span><div>' + Util.esc(s.period || '—') + '</div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Situação</span><div><span class="badge ' + Util.statusClass(s.status) + '">' + Util.esc(s.status) + '</span></div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">E-mail</span><div>' + Util.esc(s.email || '—') + '</div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Telefone</span><div>' + Util.esc(s.phone || '—') + '</div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Responsável</span><div>' + Util.esc(s.guardian || '—') + '</div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Tel. responsável</span><div>' + Util.esc(s.guardianPhone || '—') + '</div></div></div>' +
    '<div class="divider"></div>' +
    '<div class="grid-3" style="text-align:center;"><div><div class="mono" style="font-size:24px;font-weight:700;color:var(--blue);">' + Util.fmtNum(m, 1) + '</div><div class="text-xs text-muted" style="text-transform:uppercase;letter-spacing:0.08em;">Média</div></div><div><div class="mono" style="font-size:24px;font-weight:700;color:var(--success);">' + Util.fmtNum(a.freq, 0) + '%</div><div class="text-xs text-muted" style="text-transform:uppercase;letter-spacing:0.08em;">Frequência</div></div><div><div class="mono" style="font-size:24px;font-weight:700;color:var(--danger);">' + a.faltas + '</div><div class="text-xs text-muted" style="text-transform:uppercase;letter-spacing:0.08em;">Faltas</div></div></div>';
  Modal.open({
    title: 'Ficha do aluno', icon: Icons.student, body: body, size: 'lg',
    footer: '<button type="button" class="btn btn-secondary" data-boletim>Boletim (PDF)</button><button type="button" class="btn btn-primary" data-close>Fechar</button>',
    onMount: (bd, close) => bd.querySelector('[data-boletim]').addEventListener('click', () => { close(); this.abrirBoletim(s.id); })
  });
};

App.views.turmas = function (el) {
  const canEdit = ['diretor','coordenador'].includes(Auth.currentUser.role);
  this.setTitle('Turmas', DB.state.classes.length + ' turmas cadastradas');
  el.innerHTML = '<div class="card"><div class="card-header"><h3>' + Icons.building + ' Turmas da instituição</h3>' + (canEdit ? '<button type="button" class="btn btn-primary btn-sm" id="btn-nova-turma">' + Icons.plus + ' Nova turma</button>' : '') + '</div><div class="card-body">' + (DB.state.classes.length ? '<div class="grid-cards" id="grid-turmas">' + this.turmasCards() + '</div>' : this.emptyState('building', 'Nenhuma turma cadastrada', 'Cadastre a primeira turma da instituição para começar.')) + '</div></div>';
  Util.on(el, 'click', '[data-view-class]', (e, t) => this.verTurma(t.dataset.viewClass));
  if (canEdit) { const b = document.getElementById('btn-nova-turma'); if (b) b.addEventListener('click', () => this.modalTurma()); }
};

App.turmasCards = function () {
  return DB.state.classes.map(c => {
    const q = this.studentsOfClass(c.id).length;
    const p = this.teacherById(c.teacherId);
    const m = this.classAverage(c.id);
    return '<div class="turma-card" data-view-class="' + Util.esc(c.id) + '"><div class="t-head"><div><div class="t-code">' + Util.esc(c.name) + '</div><div class="t-sub">' + Util.esc(c.course) + '</div></div><span class="badge blue">' + q + '</span></div><div class="t-meta"><span>' + Util.esc(c.semester) + '</span><span>' + Util.esc(c.period) + '</span><span>' + Util.esc(c.room || '—') + '</span>' + (p ? '<span>' + Util.esc(p.name) + '</span>' : '') + '<span>Média ' + Util.fmtNum(m, 1) + '</span></div></div>';
  }).join('');
};

App.modalTurma = function (id) {
  const c = id ? this.classById(id) : null;
  const editing = !!c;
  const body = '<form id="form-turma" novalidate><div class="form-grid">' +
    '<div class="field-group"><label>Nome da turma <span class="req">*</span></label><input name="name" value="' + Util.esc(c ? c.name : '') + '" required placeholder="Ex: TDS2A"><div class="err">Informe o nome.</div></div>' +
    '<div class="field-group"><label>Curso</label><input name="course" value="' + Util.esc(c ? c.course : '') + '" placeholder="Ex: Técnico em Informática"></div>' +
    '<div class="field-group"><label>Semestre</label><input name="semester" value="' + Util.esc(c ? c.semester : '') + '" placeholder="Ex: 2º Semestre"></div>' +
    '<div class="field-group"><label>Período</label><select name="period">' + ['Manhã','Tarde','Noite'].map(p => '<option' + (c && c.period === p ? ' selected' : '') + '>' + p + '</option>').join('') + '</select></div>' +
    '<div class="field-group"><label>Sala</label><input name="room" value="' + Util.esc(c ? c.room : '') + '" placeholder="Ex: Sala 12"></div>' +
    '<div class="field-group"><label>Professor responsável</label><select name="teacherId"><option value="">—</option>' + DB.state.teachers.map(t => '<option value="' + Util.esc(t.id) + '"' + (c && c.teacherId === t.id ? ' selected' : '') + '>' + Util.esc(t.name) + '</option>').join('') + '</select></div>' +
    '</div></form>';
  Modal.open({
    title: editing ? 'Editar turma' : 'Nova turma', icon: Icons.building, body: body, size: 'lg',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>' + (editing ? 'Salvar' : 'Cadastrar') + '</button>',
    onMount: (bd, close) => {
      const form = bd.querySelector('#form-turma');
      bd.querySelector('[data-save]').addEventListener('click', () => {
        if (!this.validateForm(form)) { Toast.error('Preencha os campos obrigatórios.'); return; }
        const data = Object.fromEntries(new FormData(form).entries());
        if (editing) { Object.assign(c, data); Toast.success('Turma atualizada.'); }
        else { data.id = DB.id('c'); DB.state.classes.push(data); Toast.success('Turma cadastrada.'); }
        DB.save(); close(); this.navigate('turmas');
      });
    }
  });
};

App.verTurma = function (id) {
  const c = this.classById(id);
  if (!c) return;
  const alunos = this.studentsOfClass(c.id);
  const p = this.teacherById(c.teacherId);
  const m = this.classAverage(c.id);
  let tab = '';
  if (!alunos.length) tab = this.emptyState('student', 'Nenhum aluno', 'Esta turma não possui alunos ativos.');
  else {
    tab = '<div class="table-wrap"><table class="data"><thead><tr><th>Aluno</th><th>Matrícula</th><th>Média</th><th>Frequência</th></tr></thead><tbody>';
    alunos.forEach(s => {
      const a = this.attendanceStats(s.id);
      const mm = this.averageOf(s.id);
      tab += '<tr><td><div class="cell-user"><div class="avatar-sm" style="background:' + Util.colorFor(s.name) + '">' + Util.esc(Util.initials(s.name)) + '</div><div class="u-meta"><strong>' + Util.esc(s.name) + '</strong></div></div></td><td class="mono text-sm">' + Util.esc(s.matricula) + '</td><td><span class="badge ' + Util.notaBadge(mm) + ' mono">' + Util.fmtNum(mm, 1) + '</span></td><td class="mono">' + Util.fmtNum(a.freq, 0) + '%</td></tr>';
    });
    tab += '</tbody></table></div>';
  }
  const body = '<div class="grid-2 mb-24"><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Curso</span><div>' + Util.esc(c.course) + '</div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Semestre</span><div>' + Util.esc(c.semester) + '</div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Período</span><div>' + Util.esc(c.period) + '</div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Sala</span><div>' + Util.esc(c.room || '—') + '</div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Professor</span><div>' + (p ? Util.esc(p.name) : '—') + '</div></div><div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Média</span><div><span class="badge ' + Util.notaBadge(m) + ' mono">' + Util.fmtNum(m, 1) + '</span></div></div></div><h4 style="font-size:13px;font-weight:600;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);">Alunos (' + alunos.length + ')</h4>' + tab;
  const canEdit = ['diretor','coordenador'].includes(Auth.currentUser.role);
  Modal.open({
    title: c.name, icon: Icons.building, body: body, size: 'lg',
    footer: '<button type="button" class="btn btn-secondary" data-close>Fechar</button>' + (canEdit ? '<button type="button" class="btn btn-primary" data-edit-turma>Editar turma</button><button type="button" class="btn btn-danger" data-del-turma>Excluir turma</button>' : ''),
    onMount: (bd, close) => {
      const be = bd.querySelector('[data-edit-turma]');
      if (be) be.addEventListener('click', () => { close(); this.modalTurma(c.id); });
      const bx = bd.querySelector('[data-del-turma]');
      if (bx) bx.addEventListener('click', () => { close(); this.excluirTurmaFluxo(c); });
    }
  });
};

App.confirmarExclusaoSegura = function (opts) {
  const step2 = password => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const body = '<p style="font-size:14px;line-height:1.65;color:var(--muted);margin-bottom:18px;">' + opts.mensagem + '</p>' +
      '<div style="text-align:center;background:var(--surface-2);border:1px dashed var(--border-2);border-radius:10px;padding:16px;margin-bottom:18px;"><span class="mono" style="font-size:28px;font-weight:700;letter-spacing:.3em;color:var(--ink);">' + code + '</span></div>' +
      '<div class="field-group"><label>Código de verificação <span class="req">*</span></label><input type="text" id="del-seguro-codigo" class="mono" placeholder="000000" inputmode="numeric" maxlength="6" autocomplete="off"><div class="err">Código incorreto.</div></div>';
    Modal.open({
      title: opts.titulo + ' — etapa 2 de 2', icon: Icons.alert, body: body,
      footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-danger" data-confirm>' + Util.esc(opts.label || 'Excluir definitivamente') + '</button>',
      onMount: (bd, close) => {
        const input = bd.querySelector('#del-seguro-codigo');
        const group = input.closest('.field-group');
        input.focus();
        input.addEventListener('input', () => group.classList.remove('invalid'));
        input.addEventListener('keydown', e => { if (e.key === 'Enter') bd.querySelector('[data-confirm]').click(); });
        bd.querySelector('[data-confirm]').addEventListener('click', () => {
          if (input.value.trim() !== code) { group.classList.add('invalid'); return; }
          close();
          opts.onConfirm(password);
        });
      }
    });
  };
  const body = '<p style="font-size:14px;line-height:1.65;color:var(--muted);margin-bottom:18px;">' + opts.aviso + '</p>' +
    '<div class="field-group"><label>Confirme sua senha para continuar <span class="req">*</span></label><input type="password" id="del-seguro-senha" placeholder="Sua senha" autocomplete="current-password"><div class="err">Senha incorreta.</div></div>';
  Modal.open({
    title: opts.titulo + ' — etapa 1 de 2', icon: Icons.alert, body: body,
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-danger" data-next>Continuar</button>',
    onMount: (bd, close) => {
      const input = bd.querySelector('#del-seguro-senha');
      const group = input.closest('.field-group');
      input.focus();
      input.addEventListener('input', () => group.classList.remove('invalid'));
      input.addEventListener('keydown', e => { if (e.key === 'Enter') bd.querySelector('[data-next]').click(); });
      bd.querySelector('[data-next]').addEventListener('click', async () => {
        const btn = bd.querySelector('[data-next]');
        btn.disabled = true;
        const ok = await Auth.verifyPassword(input.value);
        btn.disabled = false;
        if (!ok) { group.classList.add('invalid'); return; }
        close();
        step2(input.value);
      });
    }
  });
};

App.excluirTurmaFluxo = function (c) {
  this.confirmarExclusaoSegura({
    titulo: 'Excluir turma',
    aviso: 'Esta ação é <strong style="color:var(--danger);">irreversível</strong>. A turma "' + Util.esc(c.name) + '", suas aulas, chamadas e atividades serão excluídas permanentemente. Os alunos não serão excluídos, apenas desvinculados da turma.',
    mensagem: 'Para concluir a exclusão de "' + Util.esc(c.name) + '", digite o código de verificação abaixo.',
    label: 'Excluir definitivamente',
    onConfirm: () => {
      DB.state.classes = DB.state.classes.filter(x => x.id !== c.id);
      DB.state.attendance = DB.state.attendance.filter(a => a.classId !== c.id);
      DB.state.lessons = DB.state.lessons.filter(l => l.classId !== c.id);
      DB.state.activities = DB.state.activities.filter(a => a.classId !== c.id);
      DB.state.events = DB.state.events.filter(e => e.classId !== c.id);
      DB.state.students.forEach(s => { if (s.classId === c.id) s.classId = ''; });
      DB.save(); App.navigate('turmas'); Toast.success('Turma excluída com sucesso.');
    }
  });
};

App.views.professores = function (el) {
  const canEdit = ['diretor','coordenador'].includes(Auth.currentUser.role);
  this.setTitle('Professores', DB.state.teachers.length + ' cadastrados');
  let h = '<div class="card"><div class="card-header"><h3>' + Icons.teacher + ' Corpo docente</h3>' + (canEdit ? '<button type="button" class="btn btn-primary btn-sm" id="btn-novo-prof">' + Icons.plus + ' Novo professor</button>' : '') + '</div><div class="card-body">';
  if (!DB.state.teachers.length) h += this.emptyState('teacher', 'Nenhum professor cadastrado', 'Cadastre o primeiro professor da instituição.');
  else {
    h += '<div class="grid-cards">';
    DB.state.teachers.forEach(t => {
      const turmas = DB.state.classes.filter(c => c.teacherId === t.id);
      h += '<div class="turma-card" style="cursor:default;"><div class="t-head"><div class="flex items-center gap-12"><div style="width:44px;height:44px;font-size:13px;background:' + Util.colorFor(t.name) + ';border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">' + Util.esc(Util.initials(t.name)) + '</div><div><div class="t-code" style="font-size:15px;">' + Util.esc(t.name) + '</div><div class="t-sub">' + Util.esc(t.subject) + '</div></div></div>' + (canEdit ? '<button class="icon-btn" data-del-prof="' + Util.esc(t.id) + '" style="width:30px;height:30px;">' + Icons.trash + '</button>' : '') + '</div><div class="t-meta"><span>' + Util.esc(t.email) + '</span><span>' + Util.esc(t.phone || '—') + '</span><span>' + turmas.length + ' turma(s)</span></div></div>';
    });
    h += '</div>';
  }
  h += '</div></div>';
  el.innerHTML = h;
  if (canEdit) {
    const b = document.getElementById('btn-novo-prof');
    if (b) b.addEventListener('click', () => this.modalProfessor());
    Util.on(el, 'click', '[data-del-prof]', (e, t) => {
      const p = this.teacherById(t.dataset.delProf);
      if (!p) return;
      this.confirmarExclusaoSegura({
        titulo: 'Excluir professor',
        aviso: 'Esta ação é <strong style="color:var(--danger);">irreversível</strong>. O professor "' + Util.esc(p.name) + '" será removido e desvinculado de todas as turmas.',
        mensagem: 'Para concluir a exclusão de "' + Util.esc(p.name) + '", digite o código de verificação abaixo.',
        label: 'Excluir professor',
        onConfirm: () => {
          DB.state.teachers = DB.state.teachers.filter(x => x.id !== p.id);
          DB.state.classes.forEach(c => { if (c.teacherId === p.id) c.teacherId = ''; });
          DB.state.users = DB.state.users.filter(u => !(u.email === p.email && u.role === 'professor'));
          DB.save(); this.navigate('professores'); Toast.success('Professor excluído.');
        }
      });
    });
  }
};

App.modalProfessor = function () {
  const body = '<form id="form-prof" novalidate><div class="form-grid">' +
    '<div class="field-group full"><label>Nome completo <span class="req">*</span></label><input name="name" required><div class="err">Informe o nome.</div></div>' +
    '<div class="field-group"><label>E-mail <span class="req">*</span></label><input type="email" name="email" required><div class="err">Informe o e-mail.</div></div>' +
    '<div class="field-group"><label>Telefone</label><input name="phone"></div>' +
    '<div class="field-group full"><label>Disciplina principal</label><input name="subject" placeholder="Ex: Desenvolvimento Web"></div>' +
    '</div></form>';
  Modal.open({
    title: 'Novo professor', icon: Icons.teacher, body: body, size: 'lg',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>Cadastrar</button>',
    onMount: (bd, close) => {
      const form = bd.querySelector('#form-prof');
      bd.querySelector('[data-save]').addEventListener('click', () => {
        if (!this.validateForm(form)) { Toast.error('Preencha os campos obrigatórios.'); return; }
        const d = Object.fromEntries(new FormData(form).entries());
        if (DB.state.teachers.find(t => t.email === d.email)) { Toast.error('E-mail já cadastrado.'); return; }
        d.id = DB.id('t');
        DB.state.teachers.push(d);
        DB.save(); close(); this.navigate('professores'); Toast.success('Professor cadastrado.');
      });
    }
  });
};

App.views.disciplinas = function (el) {
  const canEdit = ['diretor','coordenador'].includes(Auth.currentUser.role);
  this.setTitle('Disciplinas', DB.state.subjects.length + ' cadastradas');
  let h = '<div class="card"><div class="card-header"><h3>' + Icons.bookOpen + ' Grade de disciplinas</h3>' + (canEdit ? '<button type="button" class="btn btn-primary btn-sm" id="btn-nova-disc">' + Icons.plus + ' Nova disciplina</button>' : '') + '</div><div class="card-body">';
  if (!DB.state.subjects.length) h += this.emptyState('bookOpen', 'Nenhuma disciplina', 'Cadastre as disciplinas oferecidas pela instituição.');
  else {
    h += '<div class="grid-cards">';
    DB.state.subjects.forEach(s => {
      h += '<div class="turma-card" style="cursor:default;"><div class="t-head"><div><div class="t-code" style="font-size:15px;">' + Util.esc(s.name) + '</div><div class="t-sub">Código: ' + Util.esc(s.code || '—') + '</div></div>' + (canEdit ? '<button class="icon-btn" data-del-disc="' + Util.esc(s.id) + '" style="width:30px;height:30px;">' + Icons.trash + '</button>' : '') + '</div></div>';
    });
    h += '</div>';
  }
  h += '</div></div>';
  el.innerHTML = h;
  if (canEdit) {
    const b = document.getElementById('btn-nova-disc');
    if (b) b.addEventListener('click', () => this.modalDisciplina());
    Util.on(el, 'click', '[data-del-disc]', (e, t) => {
      const s = DB.state.subjects.find(x => x.id === t.dataset.delDisc);
      if (!s) return;
      Modal.confirm('Excluir disciplina', 'Deseja excluir "' + s.name + '"?', () => {
        DB.state.subjects = DB.state.subjects.filter(x => x.id !== s.id);
        DB.save(); this.navigate('disciplinas'); Toast.success('Disciplina excluída.');
      }, 'Excluir');
    });
  }
};

App.modalDisciplina = function () {
  const body = '<form id="form-disc" novalidate><div class="form-grid">' +
    '<div class="field-group"><label>Nome <span class="req">*</span></label><input name="name" required><div class="err">Informe o nome.</div></div>' +
    '<div class="field-group"><label>Código</label><input name="code" placeholder="Ex: DWEB"></div>' +
    '</div></form>';
  Modal.open({
    title: 'Nova disciplina', icon: Icons.bookOpen, body: body,
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>Cadastrar</button>',
    onMount: (bd, close) => {
      const form = bd.querySelector('#form-disc');
      bd.querySelector('[data-save]').addEventListener('click', () => {
        if (!this.validateForm(form)) { Toast.error('Preencha os campos.'); return; }
        const d = Object.fromEntries(new FormData(form).entries());
        d.id = DB.id('d');
        DB.state.subjects.push(d);
        DB.save(); close(); this.navigate('disciplinas'); Toast.success('Disciplina cadastrada.');
      });
    }
  });
};

App.views.usuarios = function (el) {
  if (!Auth.isAdmin()) { el.innerHTML = this.emptyState('lock', 'Acesso restrito', 'Apenas o diretor pode acessar este painel.'); return; }
  const pendentes = DB.state.users.filter(u => u.status === 'pendente');
  const ativos = DB.state.users.filter(u => u.status !== 'pendente');
  this.setTitle('Usuários', ativos.length + ' contas cadastradas' + (pendentes.length ? ' · ' + pendentes.length + ' pendente(s)' : ''));

  let h = '';
  if (pendentes.length) {
    h += '<div class="card mb-24" style="border-color:#fde68a;"><div class="card-header" style="background:var(--yellow-soft);border-bottom-color:#fde68a;"><h3 style="color:var(--yellow-dark);">' + Icons.alert + ' Cadastros aguardando aprovação (' + pendentes.length + ')</h3></div><div class="card-body" style="padding:0;"><div class="table-wrap"><table class="data"><thead><tr><th>Nome</th><th>E-mail</th><th>Celular</th><th>Perfil pretendido</th><th style="text-align:right;">Ações</th></tr></thead><tbody>';
    pendentes.forEach(u => {
      let contexto = [u.cursoPretendido, u.turnoPretendido].filter(Boolean).join(' · ');
      if (u.role === 'responsavel') {
        // Approving a responsável gives them that student's grades, attendance and occurrences, so show
        // exactly who the matrícula they typed pointed to (the link is made when they sign up).
        const filhos = DB.state.guardians.filter(g => g.userId === u.id).map(g => this.studentById(g.studentId)).filter(Boolean);
        contexto = (u.matricula ? 'Matrícula informada: ' + u.matricula + ' — ' : '') + (filhos.length ? 'vinculado(a) a ' + filhos.map(f => f.name).join(', ') : (u.matricula ? 'nenhum aluno com essa matrícula' : 'sem aluno vinculado'));
      }
      h += '<tr><td><div class="cell-user"><div class="avatar-sm" style="background:' + Util.colorFor(u.name) + '">' + Util.esc(Util.initials(u.name)) + '</div><div class="u-meta"><strong>' + Util.esc(u.name) + '</strong></div></div></td><td>' + Util.esc(u.email) + '</td><td class="mono text-sm">' + Util.esc(u.phone || '—') + '</td><td><span class="badge amber">' + Util.roleLabel(u.role) + '</span>' + (contexto ? '<div class="text-xs text-muted mt-4">' + Util.esc(contexto) + '</div>' : '') + '</td><td><div class="actions"><button type="button" class="btn btn-primary btn-xs" data-aprovar-user="' + Util.esc(u.id) + '">Aprovar</button><button type="button" class="btn btn-danger btn-xs" data-rejeitar-user="' + Util.esc(u.id) + '">Rejeitar</button></div></td></tr>';
    });
    h += '</tbody></table></div></div></div>';
  }

  h += '<div class="card"><div class="card-header"><h3>' + Icons.users + ' Gerenciamento de usuários</h3><button type="button" class="btn btn-primary btn-sm" id="btn-novo-user">' + Icons.plus + ' Novo usuário</button></div><div class="card-body" style="padding:0;"><div class="table-wrap"><table class="data"><thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Vínculo</th><th style="text-align:right;">Ações</th></tr></thead><tbody>';
  ativos.forEach(u => {
    const isMe = u.id === Auth.currentUser.id;
    let vinculo = '—';
    if (u.role === 'aluno' && u.studentId) {
      const st = this.studentById(u.studentId);
      vinculo = st ? Util.esc(st.name) + ' <span class="text-xs text-muted mono">(' + Util.esc(st.matricula) + ')</span>' : '—';
    } else if (u.role === 'responsavel') {
      const filhos = DB.state.guardians.filter(g => g.userId === u.id).map(g => this.studentById(g.studentId)).filter(Boolean);
      vinculo = filhos.length ? filhos.map(s => Util.esc(s.name)).join(', ') + (filhos.length > 1 ? ' <span class="text-xs text-muted">(' + filhos.length + ' filhos)</span>' : '') : '—';
    }
    h += '<tr><td><div class="cell-user"><div class="avatar-sm" style="background:' + Util.colorFor(u.name) + '">' + Util.esc(Util.initials(u.name)) + '</div><div class="u-meta"><strong>' + Util.esc(u.name) + (isMe ? ' <span style="color:var(--blue);font-size:11px;">(você)</span>' : '') + '</strong><span class="mono" style="font-size:11px;">ID ' + Util.esc(u.id.slice(0, 8)) + '</span></div></div></td><td>' + Util.esc(u.email) + '</td><td><span class="badge ' + (u.role === 'diretor' ? 'purple' : u.role === 'coordenador' ? 'blue' : u.role === 'professor' ? 'sky' : u.role === 'aluno' ? 'green' : 'amber') + '">' + Util.roleLabel(u.role) + '</span></td><td>' + vinculo + '</td><td><div class="actions"><button type="button" class="btn btn-secondary btn-xs" data-edit-user="' + Util.esc(u.id) + '">Editar</button>' + (isMe ? '' : '<button type="button" class="btn btn-danger btn-xs" data-del-user="' + Util.esc(u.id) + '">Excluir</button>') + '</div></td></tr>';
  });
  h += '</tbody></table></div></div></div>';
  el.innerHTML = h;
  const b = document.getElementById('btn-novo-user');
  if (b) b.addEventListener('click', () => this.modalUser());
  Util.on(el, 'click', '[data-del-user]', (e, t) => {
    const u = this.userById(t.dataset.delUser);
    if (!u) return;
    Modal.confirm('Excluir usuário', 'Deseja realmente excluir a conta de "' + u.name + '"?', () => {
      DB.state.users = DB.state.users.filter(x => x.id !== u.id);
      DB.state.guardians = DB.state.guardians.filter(g => g.userId !== u.id);
      DB.save(); this.navigate('usuarios'); Toast.success('Usuário excluído.');
    }, 'Excluir');
  });
  Util.on(el, 'click', '[data-edit-user]', (e, t) => this.modalUser(t.dataset.editUser));
  Util.on(el, 'click', '[data-aprovar-user]', (e, t) => {
    const u = this.userById(t.dataset.aprovarUser);
    if (!u) return;
    if (u.role === 'aluno') { this.aprovarAlunoComVinculo(u); return; }
    u.status = 'aprovado';
    if (u.role === 'professor' && !DB.state.teachers.find(x => x.email === u.email)) {
      DB.state.teachers.push({ id: DB.id('t'), name: u.name, email: u.email, subject: 'A definir', phone: u.phone || '', userId: u.id });
    }
    DB.save(); this.navigate('usuarios'); Toast.success('Cadastro de "' + u.name + '" aprovado.');
  });
  Util.on(el, 'click', '[data-rejeitar-user]', (e, t) => {
    const u = this.userById(t.dataset.rejeitarUser);
    if (!u) return;
    Modal.confirm('Rejeitar cadastro', 'Deseja realmente rejeitar o cadastro de "' + u.name + '"? A solicitação será removida.', () => {
      DB.state.users = DB.state.users.filter(x => x.id !== u.id);
      DB.save(); this.navigate('usuarios'); Toast.success('Cadastro rejeitado.');
    }, 'Rejeitar');
  });
};

App.aprovarAlunoComVinculo = function (u) {
  const candidatos = DB.state.students.filter(s => {
    const c = this.classById(s.classId);
    if (!c) return false;
    return (!u.cursoPretendido || c.course === u.cursoPretendido) && (!u.turnoPretendido || c.period === u.turnoPretendido);
  });
  const lista = candidatos.length ? candidatos : DB.state.students;
  const contexto = [u.cursoPretendido, u.turnoPretendido].filter(Boolean).join(' · ');
  const body = '<p style="font-size:14px;line-height:1.65;color:var(--muted);margin-bottom:18px;">"' + Util.esc(u.name) + '" se cadastrou como aluno' + (contexto ? ' (' + Util.esc(contexto) + ')' : '') + '. Selecione qual aluno já cadastrado corresponde a essa pessoa, ou aprove sem vincular.</p>' +
    '<div class="field-group"><label>Aluno correspondente</label><select id="aprovar-student-select"><option value="">— Aprovar sem vincular —</option>' +
    lista.map(s => { const c = this.classById(s.classId); return '<option value="' + Util.esc(s.id) + '">' + Util.esc(s.name) + ' — ' + Util.esc(s.matricula) + (c ? ' — ' + Util.esc(c.name) : '') + '</option>'; }).join('') +
    '</select></div>';
  Modal.open({
    title: 'Aprovar cadastro de aluno', icon: Icons.checkCircle, body: body,
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-confirm>Aprovar</button>',
    onMount: (bd, close) => {
      bd.querySelector('[data-confirm]').addEventListener('click', () => {
        const sid = bd.querySelector('#aprovar-student-select').value;
        u.status = 'aprovado';
        delete u.cursoPretendido; delete u.turnoPretendido;
        if (sid) {
          u.studentId = sid;
          const st = this.studentById(sid);
          u.matricula = st ? st.matricula : '';
        }
        DB.save(); close(); this.navigate('usuarios'); Toast.success('Cadastro de "' + u.name + '" aprovado.');
      });
    }
  });
};

App.modalUser = function (id) {
  const u = id ? this.userById(id) : null;
  const editing = !!u;
  const currentStudentId = u ? (u.studentId || '') : '';
  const body = '<form id="form-user" novalidate><div class="form-grid">' +
    '<div class="field-group full"><label>Nome completo <span class="req">*</span></label><input name="name" value="' + Util.esc(u ? u.name : '') + '" required><div class="err">Informe o nome.</div></div>' +
    '<div class="field-group"><label>E-mail <span class="req">*</span></label><input type="email" name="email" value="' + Util.esc(u ? u.email : '') + '" required><div class="err">Informe o e-mail.</div></div>' +
    '<div class="field-group"><label>Perfil de acesso <span class="req">*</span></label><select name="role" id="user-role-select" required>' + ['diretor','coordenador','professor','aluno','responsavel'].map(r => '<option value="' + r + '"' + (u && u.role === r ? ' selected' : '') + '>' + Util.roleLabel(r) + '</option>').join('') + '</select></div>' +
    '<div class="field-group"><label>Senha ' + (editing ? '(deixe em branco para manter)' : '<span class="req">*</span>') + '</label><input type="text" name="password" ' + (editing ? '' : 'required') + ' placeholder="Mínimo 8 caracteres"><div class="err">Informe a senha.</div></div>' +
    '<div class="field-group full" id="user-aluno-field"><label>Aluno vinculado</label><select name="studentId"><option value="">— Nenhum vínculo —</option>' + DB.state.students.map(s => { const c = this.classById(s.classId); return '<option value="' + Util.esc(s.id) + '"' + (currentStudentId === s.id ? ' selected' : '') + '>' + Util.esc(s.name) + ' — ' + Util.esc(s.matricula) + (c ? ' — ' + Util.esc(c.name) : '') + '</option>'; }).join('') + '</select></div>' +
    '</div></form>' +
    (editing ?
      '<div class="field-group full" id="user-responsavel-field"><label>Filhos vinculados</label><div id="responsavel-filhos-list" class="mb-8"></div><div class="flex gap-8"><select id="responsavel-add-select" style="flex:1;"></select><button type="button" class="btn btn-secondary btn-sm" id="responsavel-add-btn">' + Icons.plus + ' Adicionar</button></div></div>'
      : '<div class="field-group full" id="user-responsavel-field"><p class="text-sm text-muted">Salve o cadastro para depois vincular os filhos.</p></div>');
  Modal.open({
    title: editing ? 'Editar usuário' : 'Novo usuário', icon: Icons.users, body: body, size: 'lg',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>' + (editing ? 'Salvar' : 'Criar conta') + '</button>',
    onMount: (bd, close) => {
      const form = bd.querySelector('#form-user');
      const roleSel = bd.querySelector('#user-role-select');
      const toggleFields = () => {
        bd.querySelector('#user-aluno-field').classList.toggle('hidden', roleSel.value !== 'aluno');
        bd.querySelector('#user-responsavel-field').classList.toggle('hidden', roleSel.value !== 'responsavel');
      };
      roleSel.addEventListener('change', toggleFields);
      toggleFields();

      // A responsável can have more than one child; that's a list of independent
      // links (DB.state.guardians), managed here with its own save, separate from
      // the account fields above that only save when "Salvar" is clicked.
      if (editing) {
        const listEl = bd.querySelector('#responsavel-filhos-list');
        const addSel = bd.querySelector('#responsavel-add-select');
        const refreshFilhos = () => {
          const links = DB.state.guardians.filter(g => g.userId === u.id);
          listEl.innerHTML = links.length ? links.map(g => {
            const st = this.studentById(g.studentId);
            return '<div class="flex items-center justify-between" style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13.5px;"><span>' + (st ? Util.esc(st.name) + ' <span class="text-xs text-muted mono">(' + Util.esc(st.matricula) + ')</span>' : '(aluno removido)') + '</span><button type="button" class="btn btn-danger btn-xs" data-remove-filho="' + Util.esc(g.id) + '">Remover</button></div>';
          }).join('') : '<p class="text-sm text-muted">Nenhum filho vinculado ainda.</p>';
          const linkedIds = links.map(g => g.studentId);
          addSel.innerHTML = '<option value="">Selecione um aluno...</option>' + DB.state.students.filter(s => !linkedIds.includes(s.id)).map(s => '<option value="' + Util.esc(s.id) + '">' + Util.esc(s.name) + ' — ' + Util.esc(s.matricula) + '</option>').join('');
        };
        refreshFilhos();
        Util.on(listEl, 'click', '[data-remove-filho]', (e, t) => {
          DB.state.guardians = DB.state.guardians.filter(g => g.id !== t.dataset.removeFilho);
          DB.save(); refreshFilhos(); Toast.success('Vínculo removido.');
        });
        bd.querySelector('#responsavel-add-btn').addEventListener('click', () => {
          if (!addSel.value) { Toast.warning('Selecione um aluno.'); return; }
          DB.state.guardians.push({ id: DB.id('gd'), userId: u.id, studentId: addSel.value });
          DB.save(); refreshFilhos(); Toast.success('Filho vinculado.');
        });
      }

      bd.querySelector('[data-save]').addEventListener('click', () => {
        if (!this.validateForm(form)) { Toast.error('Preencha os campos obrigatórios.'); return; }
        const d = Object.fromEntries(new FormData(form).entries());
        d.email = d.email.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) { Toast.error('Informe um e-mail válido.'); return; }
        const dup = DB.state.users.find(x => x.email.toLowerCase() === d.email.toLowerCase() && (!editing || x.id !== u.id));
        if (dup) { Toast.error('Este e-mail já está em uso.'); return; }
        if (d.role === 'aluno' && d.studentId) {
          const st = DB.state.students.find(s => s.id === d.studentId);
          d.matricula = st ? st.matricula : '';
        } else { delete d.studentId; d.matricula = ''; }
        if (editing) {
          if (!d.password) d.password = u.password;
          if (!('studentId' in d)) delete u.studentId;
          Object.assign(u, d);
          Toast.success('Usuário atualizado.');
        }
        else {
          if (d.password.length < MIN_PASSWORD) { Toast.error(MIN_PASSWORD_MSG); return; }
          d.id = DB.id('u'); d.avatar = d.name.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase(); d.createdAt = new Date().toISOString(); d.status = 'aprovado';
          DB.state.users.push(d);
          Toast.success('Usuário criado com sucesso.');
        }
        DB.save(); close(); this.navigate('usuarios');
      });
    }
  });
};

App.views.admin = function (el) {
  if (!Auth.isAdmin()) { el.innerHTML = this.emptyState('lock', 'Acesso restrito', 'Apenas o diretor pode acessar este painel.'); return; }
  this.setTitle('Painel Administrativo', 'Gerenciamento geral do sistema');
  const totA = DB.state.students.length, totT = DB.state.classes.length, totP = DB.state.teachers.length, totD = DB.state.subjects.length, totU = DB.state.users.length;
  el.innerHTML = '<div class="stats-grid mb-24">' +
      this.statCard('student', 'blue', 'Alunos', totA) +
      this.statCard('building', 'blue', 'Turmas', totT) +
      this.statCard('teacher', 'amber', 'Professores', totP) +
      this.statCard('bookOpen', 'blue', 'Disciplinas', totD) +
      this.statCard('users', 'green', 'Usuários', totU) +
    '</div>' +
    '<div class="grid-2 mb-24">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.student + ' Gerenciar alunos</h3></div><div class="card-body"><p class="text-sm text-muted mb-16">Cadastre, edite, pesquise e exclua alunos da instituição.</p><div class="flex gap-8"><button type="button" class="btn btn-primary btn-sm" data-goto="alunos">' + Icons.student + ' Ir para alunos</button><button type="button" class="btn btn-secondary btn-sm" id="admin-add-aluno">' + Icons.plus + ' Adicionar</button></div></div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.users + ' Gerenciar usuários</h3></div><div class="card-body"><p class="text-sm text-muted mb-16">Crie contas, altere perfis de acesso e remova usuários.</p><button type="button" class="btn btn-primary btn-sm" data-goto="usuarios">' + Icons.users + ' Ir para usuários</button></div></div>' +
    '</div>' +
    '<div class="grid-2 mb-24">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.building + ' Turmas</h3></div><div class="card-body"><p class="text-sm text-muted mb-16">Gerencie turmas, cursos e professores responsáveis.</p><button type="button" class="btn btn-primary btn-sm" data-goto="turmas">' + Icons.building + ' Ir para turmas</button></div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.bookOpen + ' Disciplinas</h3></div><div class="card-body"><p class="text-sm text-muted mb-16">Configure as disciplinas oferecidas pela instituição.</p><button type="button" class="btn btn-primary btn-sm" data-goto="disciplinas">' + Icons.bookOpen + ' Ir para disciplinas</button></div></div>' +
    '</div>' +
    '<div class="card" style="border-color:#fecaca;"><div class="card-header" style="background:var(--danger-soft);border-bottom-color:#fecaca;"><h3 style="color:var(--danger);">' + Icons.alert + ' Zona de risco</h3></div><div class="card-body"><p class="text-sm text-muted mb-16">Estas ações são irreversíveis. Use com cautela.</p><div class="flex gap-8 flex-wrap"><button type="button" class="btn btn-danger btn-sm" id="admin-clear-students">Apagar todos os alunos</button><button type="button" class="btn btn-danger btn-sm" id="admin-clear-all">Resetar todo o sistema</button></div></div></div>';
  this.wireGotos(el);
  const b1 = document.getElementById('admin-add-aluno');
  if (b1) b1.addEventListener('click', () => this.modalAluno());
  const bc = document.getElementById('admin-clear-students');
  if (bc) bc.addEventListener('click', () => {
    Modal.confirm('Apagar todos os alunos', 'Isso removerá TODOS os alunos, notas, frequências e ocorrências associadas.', () => {
      DB.state.students = []; DB.state.grades = []; DB.state.attendance = []; DB.state.occurrences = []; DB.state.guardians = [];
      DB.state.users.forEach(u => { delete u.studentId; });
      DB.save(); Toast.success('Todos os alunos foram removidos.'); this.navigate('admin');
    }, 'Apagar tudo');
  });
  const ba = document.getElementById('admin-clear-all');
  if (ba) ba.addEventListener('click', () => {
    this.confirmarExclusaoSegura({
      titulo: 'Resetar sistema completo',
      aviso: 'Esta ação é <strong style="color:var(--danger);">irreversível</strong>. Todos os dados (alunos, turmas, notas, usuários...) serão apagados e o sistema volta ao estado inicial. Você será desconectado.',
      mensagem: 'Para concluir o reset, digite o código de verificação abaixo.',
      label: 'Resetar sistema',
      onConfirm: password => DB.reset(password)
    });
  });
};

App.views.relatorios = function (el) {
  this.setTitle('Relatórios', 'Indicadores e estatísticas');
  const totA = DB.state.students.filter(s => s.status === 'Ativo').length;
  const totT = DB.state.classes.length;
  const totP = DB.state.teachers.length;
  const att = DB.state.attendance;
  const t = att.length;
  const p = att.filter(a => a.status === 'Presente').length;
  const j = att.filter(a => a.status === 'Justificada').length;
  const f = att.filter(a => a.status === 'Falta').length;
  const freq = t ? ((p + j * 0.5) / t) * 100 : 0;
  el.innerHTML = '<div class="stats-grid mb-24">' +
      this.statCard('student', 'blue', 'Alunos ativos', totA) +
      this.statCard('building', 'blue', 'Turmas', totT) +
      this.statCard('teacher', 'amber', 'Professores', totP) +
      this.statCard('checkCircle', 'green', 'Frequência geral', Util.fmtNum(freq, 1) + '%') +
    '</div>' +
    '<div class="grid-2 mb-24">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.checkCircle + ' Distribuição de frequência</h3></div><div class="card-body">' +
        '<div class="grid-3 text-center mb-16"><div><div class="mono" style="font-size:24px;font-weight:700;color:var(--success);">' + p + '</div><div class="text-xs text-muted" style="text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">Presenças</div></div><div><div class="mono" style="font-size:24px;font-weight:700;color:var(--yellow-dark);">' + j + '</div><div class="text-xs text-muted" style="text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">Justificadas</div></div><div><div class="mono" style="font-size:24px;font-weight:700;color:var(--danger);">' + f + '</div><div class="text-xs text-muted" style="text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">Faltas</div></div></div>' +
        '<div class="progress mt-16" style="height:8px;"><div class="bar green" style="width:' + (p / Math.max(t, 1) * 100) + '%;"></div></div>' +
        '<div class="progress mt-8" style="height:8px;"><div class="bar amber" style="width:' + (j / Math.max(t, 1) * 100) + '%;"></div></div>' +
        '<div class="progress mt-8" style="height:8px;"><div class="bar" style="width:' + (f / Math.max(t, 1) * 100) + '%;background:var(--danger);"></div></div>' +
      '</div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.chart + ' Média por turma</h3></div><div class="card-body">' + this.gradeBarsByClass() + '</div></div>' +
    '</div>' +
    '<div class="card"><div class="card-header"><h3>' + Icons.building + ' Panorama das turmas</h3></div><div class="card-body" style="padding:0;">' + this.panoramaTurmas() + '</div></div>';
};
