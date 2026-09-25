'use strict';

// School years: the current one, closing it to open the next (with the students promoted, kept
// back or graduated), and the frozen history of the closed ones. The server (api/years.php) does
// the real work and checks everything again; this file only collects the decisions.

App.activeYear = function () {
  return (DB.state.years || []).find(y => y.id === DB.state.activeYearId) || null;
};

App.yearById = function (id) { return (DB.state.years || []).find(y => y.id === id) || null; };

App.resultBadge = function (r) {
  return { 'Aprovado': 'green', 'Recuperação': 'amber', 'Reprovado': 'red', 'Sem notas': 'gray' }[r] || 'gray';
};

// "TDS1" -> "TDS2", "3º Módulo A" -> "4º Módulo A"; anything without a number keeps its name.
App.nextClassName = function (name) {
  const m = String(name).match(/^(.*?)(\d+)(\D*)$/);
  return m ? m[1] + (parseInt(m[2], 10) + 1) + m[3] : String(name);
};

App.nextYearName = function () {
  const y = this.activeYear();
  const m = y && y.name.match(/(\d{4})/);
  return m ? y.name.replace(m[1], String(parseInt(m[1], 10) + 1)) : 'Ano letivo ' + (new Date().getFullYear() + 1);
};

App.views.anos = function (el) {
  const u = Auth.currentUser;
  const isDir = u.role === 'diretor';
  const cur = this.activeYear();
  const closed = (DB.state.years || []).filter(y => y.status === 'encerrado');
  this.setTitle('Anos letivos', cur ? cur.name : '');
  const range = y => (y.startDate || y.endDate) ? Util.fmtDate(y.startDate) + ' a ' + Util.fmtDate(y.endDate) : 'sem datas definidas';
  let h = '<div class="card mb-16"><div class="card-header"><h3>' + Icons.calendar + ' Ano letivo em curso</h3>' +
    (isDir ? '<div class="flex gap-8"><button type="button" class="btn btn-secondary btn-sm" id="btn-editar-ano">Editar</button><button type="button" class="btn btn-primary btn-sm" id="btn-encerrar-ano">Encerrar ano e iniciar o próximo</button></div>' : '') +
    '</div><div class="card-body">' +
    (cur ? '<div class="stat-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">' +
      this.statCard('calendar', 'blue', 'Ano letivo', cur.name) + this.statCard('building', 'green', 'Turmas', DB.state.classes.length) +
      this.statCard('student', 'yellow', 'Alunos ativos', DB.state.students.filter(s => s.status === 'Ativo').length) + '</div>' +
      '<p class="text-sm text-muted mt-12">' + Util.esc(range(cur)) + '. Notas, frequência, diário, atividades e calendário que você vê nas telas são deste ano.</p>' : '<p class="text-muted">Nenhum ano letivo ativo.</p>') +
    '</div></div>';

  h += '<div class="card"><div class="card-header"><h3>' + Icons.clipboard + ' Anos encerrados</h3></div><div class="card-body">';
  if (!closed.length) h += this.emptyState('calendar', 'Nenhum ano encerrado', 'Quando o ano for encerrado, o histórico dos alunos aparece aqui.');
  else {
    h += '<div class="toolbar"><select id="ano-sel">' + closed.map(y => '<option value="' + Util.esc(y.id) + '">' + Util.esc(y.name) + '</option>').join('') + '</select>' +
      '<div class="search">' + Icons.search + '<input type="text" id="ano-busca" placeholder="Buscar aluno ou turma..."></div><div id="ano-tools"></div></div><div id="ano-corpo"></div>';
  }
  el.innerHTML = h + '</div></div>';

  if (isDir) {
    document.getElementById('btn-editar-ano').addEventListener('click', () => this.modalEditarAno());
    document.getElementById('btn-encerrar-ano').addEventListener('click', () => this.modalEncerrarAno());
  }
  if (closed.length) {
    Util.on(el, 'click', '[data-boletim-ano]', (e, t) => this.abrirBoletimDoAno(t.dataset.student, t.dataset.boletimAno));
    const draw = () => this.renderAnoEncerrado(document.getElementById('ano-sel').value, document.getElementById('ano-busca').value);
    document.getElementById('ano-sel').addEventListener('change', draw);
    document.getElementById('ano-busca').addEventListener('input', draw);
    draw();
  }
};

App.renderAnoEncerrado = function (yearId, busca) {
  const ct = document.getElementById('ano-corpo'); if (!ct) return;
  const q = (busca || '').trim().toLowerCase();
  const list = (DB.state.enrollments || []).filter(e => e.yearId === yearId && (!q || e.studentName.toLowerCase().includes(q) || e.className.toLowerCase().includes(q)))
    .sort((a, b) => a.className.localeCompare(b.className) || a.studentName.localeCompare(b.studentName));
  if (!list.length) { ct.innerHTML = this.emptyState('student', 'Nada encontrado', 'Nenhum aluno com esses filtros neste ano.'); return; }
  const fmt = v => v === null ? '—' : Util.fmtNum(v, 1);
  let h = '<div class="table-wrap"><table class="data"><thead><tr><th>Aluno</th><th>Turma</th><th>Média</th><th>Frequência</th><th>Resultado</th><th>Destino</th><th></th></tr></thead><tbody>';
  list.forEach(e => {
    h += '<tr><td><strong>' + Util.esc(e.studentName) + '</strong></td><td>' + Util.esc(e.className) + '</td><td class="mono">' + fmt(e.average) + '</td>' +
      '<td class="mono">' + (e.frequency === null ? '—' : fmt(e.frequency) + '%') + '</td><td><span class="badge ' + this.resultBadge(e.result) + '">' + Util.esc(e.result) + '</span></td>' +
      '<td>' + Util.esc(e.decision) + '</td><td><button type="button" class="btn btn-ghost btn-sm" data-boletim-ano="' + Util.esc(yearId) + '" data-student="' + Util.esc(e.studentId) + '">Boletim</button></td></tr>';
  });
  ct.innerHTML = h + '</tbody></table></div>';
  const tools = document.getElementById('ano-tools');
  if (tools && !tools.firstChild && typeof this.botaoExportar === 'function') this.botaoExportar(tools, () => this.exportarAno(document.getElementById('ano-sel').value));
};

App.modalEditarAno = function () {
  const y = this.activeYear(); if (!y) return;
  Modal.open({
    title: 'Editar ano letivo', icon: Icons.calendar,
    body: '<form id="form-ano"><div class="field-group"><label>Nome <span class="req">*</span></label><input type="text" name="name" maxlength="100" value="' + Util.esc(y.name) + '"></div>' +
      '<div class="grid-2"><div class="field-group"><label>Início</label><input type="date" name="startDate" value="' + Util.esc(y.startDate) + '"></div>' +
      '<div class="field-group"><label>Fim</label><input type="date" name="endDate" value="' + Util.esc(y.endDate) + '"></div></div></form>',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>Salvar</button>',
    onMount: (bd, close) => bd.querySelector('[data-save]').addEventListener('click', async () => {
      const f = bd.querySelector('#form-ano');
      const body = { action: 'update', name: f.name.value, startDate: f.startDate.value, endDate: f.endDate.value };
      const res = await apiPost(DB.API + 'years.php', body); const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) { Toast.error(d.error || 'Não foi possível salvar.'); return; }
      close(); await DB.load(); this.buildTopbarYear(); this.navigate('anos'); Toast.success('Ano letivo atualizado.');
    })
  });
};

// The whole closing on one screen: name of the next year, then for every class where its students go.
App.modalEncerrarAno = function () {
  const cur = this.activeYear(); if (!cur) return;
  const classes = DB.state.classes.slice().sort((a, b) => a.name.localeCompare(b.name));
  const withStudents = classes.map(c => ({ c, students: DB.state.students.filter(s => s.classId === c.id).sort((a, b) => a.name.localeCompare(b.name)) })).filter(x => x.students.length);
  const decisionOpts = sel => ['Promovido', 'Retido', 'Concluído'].map(d => '<option' + (d === sel ? ' selected' : '') + '>' + d + '</option>').join('');
  let body = '<p class="text-sm text-muted mb-16">Encerrar <strong>' + Util.esc(cur.name) + '</strong> guarda as notas, a frequência e as turmas dele como histórico (só leitura) e abre o próximo ano com as turmas novas e os alunos já colocados. ' +
    'A sugestão promove quem tem média a partir de 5,0 e retém quem ficou abaixo; ajuste caso a caso. <strong>Isso não pode ser desfeito pela tela.</strong></p>' +
    '<form id="form-virada"><div class="grid-3"><div class="field-group"><label>Nome do próximo ano <span class="req">*</span></label><input type="text" name="name" maxlength="100" value="' + Util.esc(this.nextYearName()) + '"></div>' +
    '<div class="field-group"><label>Início</label><input type="date" name="startDate"></div><div class="field-group"><label>Fim</label><input type="date" name="endDate"></div></div>';
  if (!withStudents.length) body += '<p class="text-muted">Não há alunos em turmas: só o ano será trocado.</p>';
  withStudents.forEach(({ c, students }, i) => {
    body += '<div class="card mb-16" data-classe="' + Util.esc(c.id) + '" style="border:1px solid var(--border);"><div class="card-body">' +
      '<div class="flex items-center justify-between gap-12 mb-8" style="flex-wrap:wrap;"><h4 style="margin:0;">' + Util.esc(c.name) + ' <span class="text-muted text-sm">(' + students.length + ' aluno' + (students.length > 1 ? 's' : '') + ')</span></h4>' +
      '<label class="text-sm" style="display:flex;align-items:center;gap:6px;"><input type="checkbox" data-formandos> Turma de formandos (concluir todos)</label></div>' +
      '<div class="field-group" style="max-width:340px;"><label>Turma dos promovidos no próximo ano</label><input type="text" data-destino maxlength="255" value="' + Util.esc(this.nextClassName(c.name)) + '"></div>' +
      '<div class="table-wrap"><table class="data"><thead><tr><th>Aluno</th><th>Média</th><th>Situação</th><th>Decisão</th></tr></thead><tbody>' +
      students.map(s => {
        if (s.status !== 'Ativo') return '<tr data-aluno="' + Util.esc(s.id) + '" data-inativo="1"><td>' + Util.esc(s.name) + '</td><td>—</td><td><span class="badge gray">' + Util.esc(s.status) + '</span></td><td class="text-muted">Sai da turma (não está ativo)</td></tr>';
        const has = this.hasGrades(s.id), m = this.averageOf(s.id);
        const res = !has ? 'Sem notas' : m >= 7 ? 'Aprovado' : m >= 5 ? 'Recuperação' : 'Reprovado';
        const def = has && m < 5 ? 'Retido' : 'Promovido';
        return '<tr data-aluno="' + Util.esc(s.id) + '"><td>' + Util.esc(s.name) + '</td><td class="mono">' + (has ? Util.fmtNum(m, 1) : '—') + '</td><td><span class="badge ' + this.resultBadge(res) + '">' + res + '</span></td>' +
          '<td><select data-decisao>' + decisionOpts(def) + '</select></td></tr>';
      }).join('') + '</tbody></table></div></div></div>';
  });
  body += '</form>';
  Modal.open({
    title: 'Encerrar ano letivo', icon: Icons.calendar, size: 'lg', body,
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-danger" data-go>Continuar</button>',
    onMount: (bd, close) => {
      bd.querySelectorAll('[data-formandos]').forEach(cb => cb.addEventListener('change', () => {
        const card = cb.closest('[data-classe]');
        card.querySelectorAll('[data-decisao]').forEach(sel => { sel.value = cb.checked ? 'Concluído' : 'Promovido'; sel.disabled = cb.checked; });
        card.querySelector('[data-destino]').disabled = cb.checked;
      }));
      bd.querySelector('[data-go]').addEventListener('click', () => {
        const f = bd.querySelector('#form-virada');
        const name = f.name.value.trim();
        if (!name) { Toast.error('Informe o nome do próximo ano.'); return; }
        const plan = [];
        for (const card of bd.querySelectorAll('[data-classe]')) {
          const decisions = {}; let promo = false;
          card.querySelectorAll('tr[data-aluno]').forEach(tr => { const sel = tr.querySelector('[data-decisao]'); if (sel) { decisions[tr.dataset.aluno] = sel.value; if (sel.value === 'Promovido') promo = true; } });
          const dest = card.querySelector('[data-destino]').value.trim();
          if (promo && !dest) { Toast.error('Informe a turma de destino dos promovidos de ' + this.classById(card.dataset.classe).name + '.'); return; }
          plan.push({ classId: card.dataset.classe, promoteTo: promo ? dest : null, students: decisions });
        }
        const startDate = f.startDate.value, endDate = f.endDate.value;
        close();
        this.confirmarExclusaoSegura({
          titulo: 'Encerrar ano letivo',
          aviso: 'Você vai encerrar <strong>' + Util.esc(cur.name) + '</strong> e abrir <strong>' + Util.esc(name) + '</strong>. Os registros do ano encerrado ficam só para consulta.',
          mensagem: 'Confirme para encerrar <strong>' + Util.esc(cur.name) + '</strong> e iniciar <strong>' + Util.esc(name) + '</strong>.',
          label: 'Encerrar ano',
          onConfirm: async password => {
            let d = {};
            try {
              const res = await apiPost(DB.API + 'years.php', { action: 'rollover', password, name, startDate, endDate, classes: plan });
              d = await res.json().catch(() => ({}));
              if (!res.ok || !d.ok) { Toast.error(d.error || 'Não foi possível encerrar o ano.'); return; }
            } catch (e) { Toast.error('Falha de conexão. Nada foi alterado.'); return; }
            await DB.load(); this.ensureActiveChild(); this.buildTopbarYear(); this.navigate('anos');
            Toast.success('Ano encerrado. Bom ' + name + '!');
          }
        });
      });
    }
  });
};

// A past year's report card: the server hands back that year's grades and attendance for the student.
App.abrirBoletimDoAno = async function (sid, yearId) {
  let d;
  try {
    const res = await fetch(DB.API + 'years.php?year=' + encodeURIComponent(yearId) + '&student=' + encodeURIComponent(sid), { credentials: 'include' });
    if (sessionLost(res)) return;
    d = await res.json();
    if (!res.ok) throw new Error(d.error || 'erro');
  } catch (e) { Toast.error('Não foi possível carregar o boletim desse ano.'); return; }
  const live = this.studentById(sid);
  const enr = d.enrollment;
  const student = live ? Object.assign({}, live) : { name: enr ? enr.studentName : 'Aluno', matricula: '', course: '' };
  this.abrirBoletim(sid, { student, className: enr ? enr.className : '', yearName: d.year.name, grades: d.grades, attendance: d.attendance });
};

// One student's school record: a line per closed year, then the current year.
App.historicoEscolarHtml = function (sid) {
  const rows = (DB.state.enrollments || []).filter(e => e.studentId === sid).map(e => ({ e, y: this.yearById(e.yearId) }))
    .sort((a, b) => ((b.y && b.y.startDate) || '').localeCompare((a.y && a.y.startDate) || '') || (b.y ? b.y.name : '').localeCompare(a.y ? a.y.name : ''));
  const s = this.studentById(sid), cur = this.activeYear();
  if (!rows.length && !s) return this.emptyState('clipboard', 'Sem histórico', 'Ainda não há anos encerrados para este aluno.');
  const fmt = v => v === null ? '—' : Util.fmtNum(v, 1);
  let h = '<div class="table-wrap"><table class="data"><thead><tr><th>Ano letivo</th><th>Turma</th><th>Média</th><th>Frequência</th><th>Resultado</th><th>Destino</th><th></th></tr></thead><tbody>';
  if (s && s.status === 'Ativo' && cur) {
    const t = this.classById(s.classId);
    h += '<tr><td><strong>' + Util.esc(cur.name) + '</strong> <span class="badge blue">em curso</span></td><td>' + (t ? Util.esc(t.name) : '—') + '</td><td class="mono">' + (this.hasGrades(sid) ? fmt(this.averageOf(sid)) : '—') + '</td><td class="mono">' + fmt(this.attendanceStats(sid).total ? this.attendanceStats(sid).freq : null) + '</td><td>—</td><td>—</td><td></td></tr>';
  }
  rows.forEach(({ e, y }) => {
    h += '<tr><td><strong>' + Util.esc(y ? y.name : '—') + '</strong></td><td>' + Util.esc(e.className) + '</td><td class="mono">' + fmt(e.average) + '</td><td class="mono">' + (e.frequency === null ? '—' : fmt(e.frequency) + '%') + '</td>' +
      '<td><span class="badge ' + this.resultBadge(e.result) + '">' + Util.esc(e.result) + '</span></td><td>' + Util.esc(e.decision) + '</td>' +
      '<td><button type="button" class="btn btn-ghost btn-sm" data-boletim-ano="' + Util.esc(e.yearId) + '" data-student="' + Util.esc(sid) + '">Boletim</button></td></tr>';
  });
  return h + '</tbody></table></div>';
};

App.historicoEscolar = function (sid) {
  const s = this.studentById(sid);
  Modal.open({
    title: 'Histórico escolar' + (s ? ' — ' + s.name : ''), icon: Icons.clipboard, size: 'lg',
    body: this.historicoEscolarHtml(sid),
    footer: '<button type="button" class="btn btn-primary" data-close>Fechar</button>',
    onMount: bd => bd.addEventListener('click', e => { const t = e.target.closest('[data-boletim-ano]'); if (t) this.abrirBoletimDoAno(t.dataset.student, t.dataset.boletimAno); })
  });
};

App.views.historico = function (el) {
  const sid = Auth.currentUser.studentId;
  this.setTitle('Histórico escolar', 'Anos anteriores');
  el.innerHTML = '<div class="card"><div class="card-header"><h3>' + Icons.clipboard + ' Histórico escolar</h3></div><div class="card-body">' + (sid ? this.historicoEscolarHtml(sid) : this.emptyState('student', 'Sem aluno vinculado', 'Peça ao diretor para vincular um aluno à sua conta.')) + '</div></div>';
  Util.on(el, 'click', '[data-boletim-ano]', (e, t) => this.abrirBoletimDoAno(t.dataset.student, t.dataset.boletimAno));
};

App.buildTopbarYear = function () {
  const chip = document.getElementById('year-chip'); if (!chip) return;
  const y = this.activeYear();
  chip.textContent = y ? y.name : '';
  chip.classList.toggle('hidden', !y);
};
