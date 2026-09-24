'use strict';

App.panoramaTurmas = function () {
  if (!DB.state.classes.length) return this.emptyState('building', 'Nenhuma turma', 'Cadastre turmas para gerar relatórios.');
  let h = '<div class="table-wrap"><table class="data"><thead><tr><th>Turma</th><th>Curso</th><th>Período</th><th>Alunos</th><th>Média</th><th>Frequência</th></tr></thead><tbody>';
  DB.state.classes.forEach(c => {
    const alunos = this.studentsOfClass(c.id);
    const m = this.classAverage(c.id);
    let t = 0, p = 0, j = 0;
    alunos.forEach(s => {
      const r = DB.state.attendance.filter(a => a.studentId === s.id && a.classId === c.id);
      t += r.length; p += r.filter(a => a.status === 'Presente').length; j += r.filter(a => a.status === 'Justificada').length;
    });
    const f = t ? ((p + j * 0.5) / t) * 100 : 0;
    h += '<tr><td><strong>' + Util.esc(c.name) + '</strong></td><td class="text-sm text-muted">' + Util.esc(c.course) + '</td><td>' + Util.esc(c.period) + '</td><td class="mono">' + alunos.length + '</td><td><span class="badge ' + Util.notaBadge(m) + ' mono">' + Util.fmtNum(m, 1) + '</span></td><td><span class="badge ' + (f >= 90 ? 'green' : f >= 75 ? 'amber' : 'red') + ' mono">' + Util.fmtNum(f, 1) + '%</span></td></tr>';
  });
  h += '</tbody></table></div>';
  return h;
};

App.views['minhas-turmas'] = function (el) {
  const u = Auth.currentUser;
  const prof = DB.state.teachers.find(t => t.userId === u.id || t.email === u.email);
  const turmas = prof ? DB.state.classes.filter(c => c.teacherId === prof.id) : [];
  this.setTitle('Minhas Turmas', turmas.length + ' turma(s)');
  el.innerHTML = '<div class="card"><div class="card-header"><h3>' + Icons.building + ' Turmas sob sua responsabilidade</h3></div><div class="card-body">' +
    (turmas.length ? '<div class="grid-cards">' + turmas.map(c => {
      const q = this.studentsOfClass(c.id).length;
      const m = this.classAverage(c.id);
      return '<div class="turma-card" data-view-class="' + Util.esc(c.id) + '"><div class="t-head"><div><div class="t-code">' + Util.esc(c.name) + '</div><div class="t-sub">' + Util.esc(c.course) + '</div></div><span class="badge blue">' + q + ' alunos</span></div><div class="t-meta"><span>' + Util.esc(c.period) + '</span><span>' + Util.esc(c.room || '—') + '</span><span>Média ' + Util.fmtNum(m, 1) + '</span></div></div>';
    }).join('') + '</div>' : this.emptyState('building', 'Sem turmas atribuídas', 'Você ainda não está vinculado como professor responsável por nenhuma turma.')) +
    '</div></div>';
  Util.on(el, 'click', '[data-view-class]', (e, t) => this.verTurma(t.dataset.viewClass));
};

App.views.diario = function (el) {
  const u = Auth.currentUser;
  const isStaff = ['diretor','coordenador'].includes(u.role);

  let turmas;
  if (isStaff) {
    turmas = DB.state.classes.slice();
  } else {
    const prof = DB.state.teachers.find(t => t.userId === u.id || t.email === u.email);
    turmas = prof ? DB.state.classes.filter(c => c.teacherId === prof.id) : [];
  }

  if (!turmas.length) {
    this.setTitle('Diário de Classe', 'Registro de frequência');
    const msg = (!isStaff && DB.state.classes.length) ? 'Você ainda não está vinculado a nenhuma turma.' : 'Cadastre turmas antes de usar o diário de classe.';
    el.innerHTML = this.emptyState('book', 'Sem turmas', msg);
    return;
  }

  this.setTitle('Diário de Classe', 'Escolha a turma, disciplina e data para fazer a chamada');

  const today = Util.todayISO();

  el.innerHTML =
    '<div class="card mb-24">' +
      '<div class="card-header">' +
        '<h3>' + Icons.book + ' Selecionar aula</h3>' +
        '<span class="chip">' + turmas.length + ' turma(s) disponível(is)</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="form-grid">' +
          '<div class="field-group">' +
            '<label>Turma <span class="req">*</span></label>' +
            '<select id="diario-turma">' +
              turmas.map(c => '<option value="' + Util.esc(c.id) + '">' + Util.esc(c.name) + ' — ' + Util.esc(c.course || '') + ' — ' + Util.esc(c.period) + '</option>').join('') +
            '</select>' +
          '</div>' +
          '<div class="field-group">' +
            '<label>Disciplina</label>' +
            '<select id="diario-disc">' +
              '<option value="">— Sem disciplina específica —</option>' +
              DB.state.subjects.map(s => '<option value="' + Util.esc(s.id) + '">' + Util.esc(s.name) + '</option>').join('') +
            '</select>' +
          '</div>' +
          '<div class="field-group">' +
            '<label>Data da aula <span class="req">*</span></label>' +
            '<input type="date" id="diario-data" value="' + today + '">' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="diary-summary mb-24" id="diario-resumo"></div>' +

    '<div class="card mb-24">' +
      '<div class="card-header">' +
        '<h3>' + Icons.checkCircle + ' Chamada — marque a presença de cada aluno</h3>' +
        '<div class="flex gap-8 flex-wrap">' +
          '<button type="button" class="btn btn-secondary btn-sm" id="marcar-todos">' + Icons.check + ' Todos presentes</button>' +
          '<button type="button" class="btn btn-secondary btn-sm" id="limpar-todos">Limpar</button>' +
          '<button type="button" class="btn btn-primary btn-sm" id="salvar-chamada">' + Icons.checkCircle + ' Salvar chamada</button>' +
        '</div>' +
      '</div>' +
      '<div class="card-body" id="chamada-corpo" style="padding:0;"></div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header"><h3>' + Icons.bookOpen + ' Conteúdo da aula (opcional)</h3></div>' +
      '<div class="card-body">' +
        '<div class="field-group mb-12"><label>Conteúdo trabalhado</label>' +
          '<textarea id="aula-conteudo" placeholder="Descreva o conteúdo lecionado nesta aula..."></textarea></div>' +
        '<div class="field-group mb-12"><label>Observações</label>' +
          '<input id="aula-obs" type="text" placeholder="Observações adicionais (opcional)"></div>' +
        '<button type="button" class="btn btn-primary" id="salvar-conteudo">' + Icons.checkCircle + ' Salvar conteúdo</button>' +
      '</div>' +
    '</div>';

  // once, here: renderChamada runs again on every turma/disciplina/data change
  Util.on(document.getElementById('chamada-corpo'), 'click', '.att-btn', (e, t) => {
    this.setAttendanceRow(t.closest('.attendance-row'), t.dataset.sid, t.dataset.status);
    this.updateDiarioResumo();
  });
  document.getElementById('diario-turma').addEventListener('change', () => this.renderChamada());
  document.getElementById('diario-disc').addEventListener('change', () => this.renderChamada());
  document.getElementById('diario-data').addEventListener('change', () => this.renderChamada());
  document.getElementById('marcar-todos').addEventListener('click', () => {
    document.querySelectorAll('#chamada-corpo .attendance-row').forEach(r =>
      this.setAttendanceRow(r, r.dataset.sid, 'Presente'));
    this.updateDiarioResumo();
  });
  document.getElementById('limpar-todos').addEventListener('click', () => {
    document.querySelectorAll('#chamada-corpo .attendance-row').forEach(r => {
      r.querySelectorAll('.att-btn').forEach(b => b.classList.remove('active-present', 'active-absent', 'active-just'));
    });
    this.updateDiarioResumo();
  });
  document.getElementById('salvar-chamada').addEventListener('click', () => this.salvarChamada());
  document.getElementById('salvar-conteudo').addEventListener('click', () => this.salvarConteudo());

  this.renderChamada();
};

App.renderChamada = function () {
  const tEl = document.getElementById('diario-turma');
  const dEl = document.getElementById('diario-disc');
  const dtEl = document.getElementById('diario-data');
  if (!tEl || !dtEl) return;
  const tid = tEl.value;
  const did = dEl ? dEl.value : '';
  const date = dtEl.value;
  const ct = document.getElementById('chamada-corpo');
  const alunos = this.studentsOfClass(tid);

  if (!alunos.length) {
    ct.innerHTML = this.emptyState('student', 'Sem alunos', 'Esta turma não possui alunos ativos.');
    this.updateDiarioResumo();
    return;
  }

  let h = '';
  alunos.forEach((s, idx) => {
    h += '<div class="attendance-row" data-sid="' + Util.esc(s.id) + '" style="animation: fadeUp .4s ' + (idx * 0.03) + 's both;">' +
      '<div class="a-name">' +
        '<div class="avatar-sm" style="width:36px;height:36px;font-size:12px;background:' + Util.colorFor(s.name) + ';border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">' + Util.esc(Util.initials(s.name)) + '</div>' +
        '<div style="min-width:0;">' +
          '<strong>' + Util.esc(s.name) + '</strong><br>' +
          '<span class="text-xs text-muted mono">' + Util.esc(s.matricula) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="att-group">' +
        '<button type="button" class="att-btn" data-status="Presente" data-sid="' + Util.esc(s.id) + '">' + Icons.check + ' Presente</button>' +
        '<button type="button" class="att-btn" data-status="Falta" data-sid="' + Util.esc(s.id) + '">' + Icons.close + ' Falta</button>' +
        '<button type="button" class="att-btn" data-status="Justificada" data-sid="' + Util.esc(s.id) + '">' + Icons.clock + ' Justificada</button>' +
      '</div>' +
    '</div>';
  });
  ct.innerHTML = h;

  alunos.forEach(s => {
    const r = DB.state.attendance.find(a =>
      a.studentId === s.id && a.date === date &&
      ((did && a.subjectId === did) || (!did && !a.subjectId))
    );
    this.setAttendanceRow(ct.querySelector('[data-sid="' + Util.esc(s.id) + '"]'), s.id, r ? r.status : 'Presente');
  });

  this.updateDiarioResumo();
};

App.setAttendanceRow = function (row, sid, status) {
  if (!row) return;
  row.querySelectorAll('.att-btn').forEach(b => b.classList.remove('active-present', 'active-absent', 'active-just'));
  const b = row.querySelector('.att-btn[data-status="' + status + '"]');
  if (!b) return;
  if (status === 'Presente') b.classList.add('active-present');
  if (status === 'Falta') b.classList.add('active-absent');
  if (status === 'Justificada') b.classList.add('active-just');
};

App.updateDiarioResumo = function () {
  const box = document.getElementById('diario-resumo');
  if (!box) return;
  const rows = document.querySelectorAll('#chamada-corpo .attendance-row');
  let p = 0, f = 0, j = 0, sem = 0;
  rows.forEach(r => {
    if (r.querySelector('.att-btn.active-present')) p++;
    else if (r.querySelector('.att-btn.active-absent')) f++;
    else if (r.querySelector('.att-btn.active-just')) j++;
    else sem++;
  });
  box.innerHTML =
    '<div class="ds-item"><div class="ds-num" style="color:var(--blue);">' + rows.length + '</div><div class="ds-lbl">Total de alunos</div></div>' +
    '<div class="ds-item"><div class="ds-num" style="color:var(--success);">' + p + '</div><div class="ds-lbl">Presentes</div></div>' +
    '<div class="ds-item"><div class="ds-num" style="color:var(--danger);">' + f + '</div><div class="ds-lbl">Faltas</div></div>' +
    '<div class="ds-item"><div class="ds-num" style="color:var(--yellow-dark);">' + j + '</div><div class="ds-lbl">Justificadas</div></div>' +
    (sem > 0 ? '<div class="ds-item"><div class="ds-num" style="color:var(--muted);">' + sem + '</div><div class="ds-lbl">Sem marcação</div></div>' : '');
};

App.salvarChamada = function () {
  const tEl = document.getElementById('diario-turma');
  const dEl = document.getElementById('diario-disc');
  const dtEl = document.getElementById('diario-data');
  if (!tEl || !dtEl) return;
  const tid = tEl.value;
  const did = dEl ? dEl.value : '';
  const date = dtEl.value;

  if (!date) { Toast.error('Informe a data da aula.'); return; }

  const rows = document.querySelectorAll('#chamada-corpo .attendance-row');
  if (!rows.length) { Toast.error('Nenhum aluno para registrar.'); return; }

  const u = Auth.currentUser;
  const prof = DB.state.teachers.find(t => t.userId === u.id || t.email === u.email);
  const teacherId = prof ? prof.id : '';

  let c = 0, semMarcacao = 0;
  rows.forEach(r => {
    const sid = r.dataset.sid;
    const a = r.querySelector('.att-btn.active-present, .att-btn.active-absent, .att-btn.active-just');
    if (!a) { semMarcacao++; return; }
    const status = a.dataset.status;

    let ex = DB.state.attendance.find(x =>
      x.studentId === sid && x.date === date &&
      ((did && x.subjectId === did) || (!did && !x.subjectId))
    );

    if (ex) {
      ex.status = status;
      ex.classId = tid;
      if (did) ex.subjectId = did;
      if (teacherId) ex.teacherId = teacherId;
    } else {
      DB.state.attendance.push({
        id: DB.id('att'),
        studentId: sid,
        classId: tid,
        subjectId: did || '',
        date: date,
        status: status,
        teacherId: teacherId
      });
    }
    c++;
  });

  DB.save();
  Toast.success('Chamada salva para ' + c + ' aluno(s).' + (semMarcacao ? ' ' + semMarcacao + ' sem marcação.' : ''));
};

App.salvarConteudo = function () {
  const tEl = document.getElementById('diario-turma');
  const dEl = document.getElementById('diario-disc');
  const dtEl = document.getElementById('diario-data');
  if (!tEl || !dtEl) return;
  const tid = tEl.value;
  const did = dEl ? dEl.value : '';
  const date = dtEl.value;
  const content = document.getElementById('aula-conteudo').value.trim();
  const note = document.getElementById('aula-obs').value.trim();
  if (!content) { Toast.error('Informe o conteúdo trabalhado.'); return; }
  DB.state.lessons.push({ id: DB.id('l'), classId: tid, subjectId: did, date: date, content: content, note: note });
  DB.save();
  document.getElementById('aula-conteudo').value = '';
  document.getElementById('aula-obs').value = '';
  Toast.success('Conteúdo registrado.');
};

App.views.frequencia = function (el) {
  this.setTitle('Frequência', 'Acompanhamento de presenças e faltas');
  el.innerHTML = '<div class="card mb-24"><div class="card-header"><h3>' + Icons.search + ' Filtrar</h3></div><div class="card-body"><div class="toolbar"><div class="search">' + Icons.search + '<input type="text" id="freq-busca" placeholder="Buscar aluno..."></div><select id="freq-turma"><option value="">Todas as turmas</option>' + DB.state.classes.map(c => '<option value="' + Util.esc(c.id) + '">' + Util.esc(c.name) + '</option>').join('') + '</select></div></div></div><div class="card"><div class="card-body" id="freq-tabela" style="padding:0;"></div></div>';
  this.renderFrequenciaTabela();
  document.getElementById('freq-busca').addEventListener('input', Util.debounce(() => this.renderFrequenciaTabela(), 200));
  document.getElementById('freq-turma').addEventListener('change', () => this.renderFrequenciaTabela());
};

App.renderFrequenciaTabela = function () {
  const busca = (document.getElementById('freq-busca') || {}).value || '';
  const turma = (document.getElementById('freq-turma') || {}).value || '';
  const ct = document.getElementById('freq-tabela');
  if (!ct) return;
  let list = DB.state.students.filter(s => s.status === 'Ativo');
  if (busca) list = list.filter(s => s.name.toLowerCase().includes(busca.toLowerCase()));
  if (turma) list = list.filter(s => s.classId === turma);
  if (!list.length) { ct.innerHTML = DB.state.students.length === 0 ? this.emptyState('student', 'Nenhum aluno cadastrado', 'Cadastre alunos para acompanhar a frequência.') : '<div class="empty"><p>Nenhum aluno encontrado.</p></div>'; return; }
  let h = '<div class="table-wrap"><table class="data"><thead><tr><th>Aluno</th><th>Turma</th><th>Aulas</th><th>Presenças</th><th>Faltas</th><th>Justificadas</th><th>Frequência</th></tr></thead><tbody>';
  list.forEach(s => {
    const a = this.attendanceStats(s.id);
    const cls = a.freq >= 90 ? 'green' : a.freq >= 75 ? 'amber' : 'red';
    const t = this.classById(s.classId);
    h += '<tr><td><div class="cell-user"><div class="avatar-sm" style="background:' + Util.colorFor(s.name) + '">' + Util.esc(Util.initials(s.name)) + '</div><div class="u-meta"><strong>' + Util.esc(s.name) + '</strong><span class="mono" style="font-size:11px;">' + Util.esc(s.matricula) + '</span></div></div></td><td>' + (t ? Util.esc(t.name) : '—') + '</td><td class="mono">' + a.total + '</td><td><span class="badge green mono">' + a.pres + '</span></td><td><span class="badge red mono">' + a.faltas + '</span></td><td><span class="badge amber mono">' + a.just + '</span></td><td><span class="badge ' + cls + ' mono">' + Util.fmtNum(a.freq, 1) + '%</span></td></tr>';
  });
  h += '</tbody></table></div>';
  ct.innerHTML = h;
};

App.views.notas = function (el) {
  const canEdit = ['diretor','coordenador','professor'].includes(Auth.currentUser.role);
  this.setTitle('Notas', 'Lançamento e consulta de notas');
  el.innerHTML = '<div class="card mb-24"><div class="card-header"><h3>' + Icons.search + ' Filtrar</h3>' + (canEdit ? '<button type="button" class="btn btn-primary btn-sm" id="btn-lancar-nota">' + Icons.plus + ' Lançar nota</button>' : '') + '</div><div class="card-body"><div class="toolbar"><div class="search">' + Icons.search + '<input type="text" id="notas-busca" placeholder="Buscar aluno..."></div><select id="notas-turma"><option value="">Todas as turmas</option>' + DB.state.classes.map(c => '<option value="' + Util.esc(c.id) + '">' + Util.esc(c.name) + '</option>').join('') + '</select><select id="notas-disc"><option value="">Todas as disciplinas</option>' + DB.state.subjects.map(s => '<option value="' + Util.esc(s.id) + '">' + Util.esc(s.name) + '</option>').join('') + '</select><select id="notas-bim"><option value="">Média final (todos os bimestres)</option>' + BIMESTRES.map(b => '<option>' + b + '</option>').join('') + '</select></div></div></div><div class="card"><div class="card-body" id="notas-tabela" style="padding:0;"></div></div>';
  this.renderNotasTabela();
  document.getElementById('notas-busca').addEventListener('input', Util.debounce(() => this.renderNotasTabela(), 200));
  document.getElementById('notas-turma').addEventListener('change', () => this.renderNotasTabela());
  document.getElementById('notas-disc').addEventListener('change', () => this.renderNotasTabela());
  document.getElementById('notas-bim').addEventListener('change', () => this.renderNotasTabela());
  if (canEdit) { const b = document.getElementById('btn-lancar-nota'); if (b) b.addEventListener('click', () => this.modalNota()); }
};

App.renderNotasTabela = function () {
  const busca = (document.getElementById('notas-busca') || {}).value || '';
  const turma = (document.getElementById('notas-turma') || {}).value || '';
  const disc = (document.getElementById('notas-disc') || {}).value || '';
  const bim = (document.getElementById('notas-bim') || {}).value || '';
  const ct = document.getElementById('notas-tabela');
  if (!ct) return;
  let list = DB.state.students.filter(s => s.status === 'Ativo');
  if (busca) list = list.filter(s => s.name.toLowerCase().includes(busca.toLowerCase()));
  if (turma) list = list.filter(s => s.classId === turma);
  if (!list.length) { ct.innerHTML = DB.state.students.length === 0 ? this.emptyState('student', 'Nenhum aluno', 'Cadastre alunos para lançar notas.') : '<div class="empty"><p>Nenhum aluno encontrado.</p></div>'; return; }
  let h = '<div class="table-wrap"><table class="data"><thead><tr><th>Aluno</th><th>Turma</th><th>Avaliações</th><th>' + (bim ? Util.esc(bim) : 'Média final') + '</th><th>Status</th></tr></thead><tbody>';
  list.forEach(s => {
    let g = DB.state.grades.filter(x => x.studentId === s.id);
    if (disc) g = g.filter(x => x.subjectId === disc);
    if (bim) g = g.filter(x => x.bimestre === bim);
    const m = this.overallAverage(g);
    const t = this.classById(s.classId);
    h += '<tr><td><div class="cell-user"><div class="avatar-sm" style="background:' + Util.colorFor(s.name) + '">' + Util.esc(Util.initials(s.name)) + '</div><div class="u-meta"><strong>' + Util.esc(s.name) + '</strong><span class="mono" style="font-size:11px;">' + Util.esc(s.matricula) + '</span></div></div></td><td>' + (t ? Util.esc(t.name) : '—') + '</td><td class="text-sm mono">' + g.length + '</td><td><strong class="mono" style="font-size:15px;">' + Util.fmtNum(m, 1) + '</strong></td><td><span class="badge ' + (g.length ? Util.notaBadge(m) : 'gray') + '">' + (!g.length ? 'Sem nota' : m >= 7 ? 'Aprovado' : m >= 5 ? 'Recuperação' : 'Reprovado') + '</span></td></tr>';
  });
  h += '</tbody></table></div>';
  ct.innerHTML = h;
};

App.modalNota = function () {
  if (!DB.state.students.length) { Toast.warning('Cadastre um aluno antes.'); return; }
  const body = '<form id="form-nota" novalidate><div class="form-grid">' +
    '<div class="field-group full"><label>Aluno <span class="req">*</span></label><select name="studentId" required><option value="">Selecione...</option>' + DB.state.students.filter(s => s.status === 'Ativo').map(s => '<option value="' + Util.esc(s.id) + '">' + Util.esc(s.name) + ' (' + Util.esc(s.matricula) + ')</option>').join('') + '</select><div class="err">Selecione um aluno.</div></div>' +
    '<div class="field-group"><label>Disciplina <span class="req">*</span></label><select name="subjectId" required><option value="">Selecione...</option>' + DB.state.subjects.map(s => '<option value="' + Util.esc(s.id) + '">' + Util.esc(s.name) + '</option>').join('') + '</select><div class="err">Selecione.</div></div>' +
    '<div class="field-group"><label>Bimestre <span class="req">*</span></label><select name="bimestre" required><option value="">Selecione...</option>' + BIMESTRES.map(b => '<option>' + b + '</option>').join('') + '</select><div class="err">Selecione o bimestre.</div></div>' +
    '<div class="field-group"><label>Avaliação <span class="req">*</span></label><input name="assessment" required placeholder="Ex: Prova 1"><div class="err">Informe o nome.</div></div>' +
    '<div class="field-group"><label>Nota (0 a 10) <span class="req">*</span></label><input type="number" name="value" min="0" max="10" step="0.1" required><div class="err">Informe a nota.</div></div>' +
    '<div class="field-group"><label>Data</label><input type="date" name="date" value="' + Util.todayISO() + '"></div>' +
    '</div></form>';
  Modal.open({
    title: 'Lançar nota', icon: Icons.edit, body: body, size: 'lg',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>Salvar nota</button>',
    onMount: (bd, close) => {
      const form = bd.querySelector('#form-nota');
      bd.querySelector('[data-save]').addEventListener('click', () => {
        if (!this.validateForm(form)) { Toast.error('Preencha os campos.'); return; }
        const d = Object.fromEntries(new FormData(form).entries());
        d.value = Number(d.value);
        if (isNaN(d.value) || d.value < 0 || d.value > 10) { Toast.error('Nota deve estar entre 0 e 10.'); return; }
        d.id = DB.id('gr'); d.weight = 1;
        DB.state.grades.push(d);
        DB.save(); close(); this.renderNotasTabela();
        Toast.success('Nota lançada.');
      });
    }
  });
};

App.views.atividades = function (el) {
  const canEdit = ['professor','coordenador','diretor'].includes(Auth.currentUser.role);
  this.setTitle('Atividades', DB.state.activities.length + ' atividades');
  el.innerHTML = '<div class="card"><div class="card-header"><h3>' + Icons.clipboard + ' Atividades cadastradas</h3>' + (canEdit ? '<button type="button" class="btn btn-primary btn-sm" id="btn-nova-atv">' + Icons.plus + ' Nova atividade</button>' : '') + '</div><div class="card-body" id="lista-atividades" style="padding:0;"></div></div>';
  this.renderAtividades();
  if (canEdit) { const b = document.getElementById('btn-nova-atv'); if (b) b.addEventListener('click', () => this.modalAtividade()); }
};

App.renderAtividades = function () {
  const ct = document.getElementById('lista-atividades');
  if (!ct) return;
  const u = Auth.currentUser;
  let list = DB.state.activities.slice();
  if (u.role === 'aluno' || u.role === 'responsavel') { const s = this.studentById(u.studentId); if (s) list = list.filter(a => a.classId === s.classId); }
  if (!list.length) { ct.innerHTML = this.emptyState('clipboard', 'Nenhuma atividade', 'Ainda não há atividades cadastradas.'); return; }
  let h = '<div class="table-wrap"><table class="data"><thead><tr><th>Título</th><th>Disciplina</th><th>Entrega</th><th>Valor</th><th>Status</th></tr></thead><tbody>';
  list.forEach(a => {
    h += '<tr><td><strong>' + Util.esc(a.title) + '</strong><div class="text-xs text-muted" style="margin-top:3px;">' + Util.esc(a.description || '') + '</div></td><td>' + Util.esc(a.subject) + '</td><td class="mono text-sm">' + Util.fmtDate(a.dueDate) + '</td><td class="mono">' + Util.esc(a.value) + ' pts</td><td><span class="badge ' + Util.statusClass(a.status) + '">' + Util.esc(a.status) + '</span></td></tr>';
  });
  h += '</tbody></table></div>';
  ct.innerHTML = h;
};

App.modalAtividade = function () {
  if (!DB.state.classes.length) { Toast.warning('Cadastre uma turma primeiro.'); return; }
  const body = '<form id="form-atv" novalidate><div class="form-grid">' +
    '<div class="field-group full"><label>Título <span class="req">*</span></label><input name="title" required><div class="err">Informe o título.</div></div>' +
    '<div class="field-group"><label>Disciplina <span class="req">*</span></label><select name="subject" required><option value="">Selecione...</option>' + DB.state.subjects.map(s => '<option>' + Util.esc(s.name) + '</option>').join('') + '</select><div class="err">Selecione.</div></div>' +
    '<div class="field-group"><label>Turma <span class="req">*</span></label><select name="classId" required><option value="">Selecione...</option>' + DB.state.classes.map(c => '<option value="' + Util.esc(c.id) + '">' + Util.esc(c.name) + '</option>').join('') + '</select><div class="err">Selecione.</div></div>' +
    '<div class="field-group"><label>Data de entrega <span class="req">*</span></label><input type="date" name="dueDate" required><div class="err">Informe a data.</div></div>' +
    '<div class="field-group"><label>Valor (pontos)</label><input type="number" name="value" value="10" min="0"></div>' +
    '<div class="field-group"><label>Status</label><select name="status"><option>Disponível</option><option>Em andamento</option><option>Encerrada</option></select></div>' +
    '<div class="field-group full"><label>Descrição</label><textarea name="description"></textarea></div>' +
    '</div></form>';
  Modal.open({
    title: 'Nova atividade', icon: Icons.clipboard, body: body, size: 'lg',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>Cadastrar</button>',
    onMount: (bd, close) => {
      const form = bd.querySelector('#form-atv');
      bd.querySelector('[data-save]').addEventListener('click', () => {
        if (!this.validateForm(form)) { Toast.error('Preencha os campos.'); return; }
        const d = Object.fromEntries(new FormData(form).entries());
        d.id = DB.id('a'); d.createdAt = Util.todayISO(); d.value = isNaN(Number(d.value)) ? 10 : Number(d.value);
        DB.state.activities.push(d);
        DB.save(); close(); this.renderAtividades(); Toast.success('Atividade cadastrada.');
      });
    }
  });
};

App.views.ocorrencias = function (el) {
  const canEdit = ['professor','coordenador','diretor'].includes(Auth.currentUser.role);
  this.setTitle('Ocorrências', DB.state.occurrences.length + ' registradas');
  el.innerHTML = '<div class="card"><div class="card-header"><h3>' + Icons.alert + ' Registro de ocorrências</h3>' + (canEdit ? '<button type="button" class="btn btn-primary btn-sm" id="btn-nova-oc">' + Icons.plus + ' Nova ocorrência</button>' : '') + '</div><div class="card-body" id="lista-oc" style="padding:0;"></div></div>';
  this.renderOcorrencias();
  if (canEdit) { const b = document.getElementById('btn-nova-oc'); if (b) b.addEventListener('click', () => this.modalOcorrencia()); }
};

App.renderOcorrencias = function () {
  const ct = document.getElementById('lista-oc');
  if (!ct) return;
  const u = Auth.currentUser;
  let list = DB.state.occurrences.slice();
  if (u.role === 'aluno' || u.role === 'responsavel') { const s = this.studentById(u.studentId); if (s) list = list.filter(o => o.studentId === s.id); }
  list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (!list.length) { ct.innerHTML = this.emptyState('alert', 'Nenhuma ocorrência', 'Ainda não há ocorrências registradas.'); return; }
  let h = '<div class="table-wrap"><table class="data"><thead><tr><th>Aluno</th><th>Data</th><th>Categoria</th><th>Descrição</th><th>Situação</th></tr></thead><tbody>';
  list.forEach(o => {
    const s = this.studentById(o.studentId);
    h += '<tr><td>' + (s ? '<div class="cell-user"><div class="avatar-sm" style="background:' + Util.colorFor(s.name) + '">' + Util.esc(Util.initials(s.name)) + '</div><div class="u-meta"><strong>' + Util.esc(s.name) + '</strong><span class="mono" style="font-size:11px;">' + Util.esc(s.matricula) + '</span></div></div>' : '—') + '</td><td class="mono text-sm">' + Util.fmtDate(o.date) + '</td><td>' + Util.esc(o.category || '—') + '</td><td class="text-sm">' + Util.esc(o.description) + '</td><td><span class="badge ' + Util.statusClass(o.situation) + '">' + Util.esc(o.situation) + '</span></td></tr>';
  });
  h += '</tbody></table></div>';
  ct.innerHTML = h;
};

App.modalOcorrencia = function () {
  if (!DB.state.students.length) { Toast.warning('Cadastre um aluno primeiro.'); return; }
  const body = '<form id="form-oc" novalidate><div class="form-grid">' +
    '<div class="field-group full"><label>Aluno <span class="req">*</span></label><select name="studentId" required><option value="">Selecione...</option>' + DB.state.students.filter(s => s.status === 'Ativo').map(s => '<option value="' + Util.esc(s.id) + '">' + Util.esc(s.name) + ' (' + Util.esc(s.matricula) + ')</option>').join('') + '</select><div class="err">Selecione.</div></div>' +
    '<div class="field-group"><label>Data <span class="req">*</span></label><input type="date" name="date" value="' + Util.todayISO() + '" required></div>' +
    '<div class="field-group"><label>Categoria <span class="req">*</span></label><select name="category" required><option value="">Selecione...</option>' + ['Comportamento','Atraso','Falta','Uso inadequado de equipamento','Uso de celular','Desrespeito','Outros'].map(c => '<option>' + c + '</option>').join('') + '</select><div class="err">Selecione.</div></div>' +
    '<div class="field-group"><label>Situação</label><select name="situation"><option>Registrada</option><option>Positiva</option><option>Resolvida</option></select></div>' +
    '<div class="field-group full"><label>Descrição <span class="req">*</span></label><textarea name="description" required></textarea><div class="err">Descreva.</div></div>' +
    '</div></form>';
  Modal.open({
    title: 'Nova ocorrência', icon: Icons.alert, body: body, size: 'lg',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>Registrar</button>',
    onMount: (bd, close) => {
      const form = bd.querySelector('#form-oc');
      bd.querySelector('[data-save]').addEventListener('click', () => {
        if (!this.validateForm(form)) { Toast.error('Preencha os campos.'); return; }
        const d = Object.fromEntries(new FormData(form).entries());
        const u = Auth.currentUser;
        const prof = DB.state.teachers.find(t => t.userId === u.id || t.email === u.email);
        d.id = DB.id('o'); d.teacherId = prof ? prof.id : '';
        DB.state.occurrences.push(d);
        DB.save(); close(); this.renderOcorrencias(); Toast.success('Ocorrência registrada.');
      });
    }
  });
};

App.views.comunicados = function (el) {
  const canPub = ['coordenador','diretor'].includes(Auth.currentUser.role);
  this.setTitle('Comunicados', DB.state.announcements.length + ' publicados');
  el.innerHTML = '<div class="card"><div class="card-header"><h3>' + Icons.megaphone + ' Mural de comunicados</h3>' + (canPub ? '<button type="button" class="btn btn-primary btn-sm" id="btn-novo-com">' + Icons.plus + ' Publicar</button>' : '') + '</div><div class="card-body" id="lista-com"></div></div>';
  this.renderComunicados();
  if (canPub) { const b = document.getElementById('btn-novo-com'); if (b) b.addEventListener('click', () => this.modalComunicado()); }
};

App.renderComunicados = function () {
  const ct = document.getElementById('lista-com');
  if (!ct) return;
  const list = DB.state.announcements.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (!list.length) { ct.innerHTML = this.emptyState('megaphone', 'Nenhum comunicado', 'Ainda não há comunicados publicados.'); return; }
  let h = '';
  list.forEach((a, idx) => {
    h += '<div class="card mb-16" style="border-left:3px solid var(--yellow);background:var(--blue-soft);animation: fadeUp .4s ' + (idx * 0.05) + 's both;"><div class="card-body"><div class="flex items-center justify-between mb-8"><h4 style="font-size:14.5px;font-weight:600;letter-spacing:-0.01em;">' + Util.esc(a.title) + '</h4><span class="text-xs text-muted mono">' + Util.fmtDateLong(a.date) + '</span></div><p class="text-sm" style="color:var(--ink-2);line-height:1.6;">' + Util.esc(a.message) + '</p><div class="mt-12 flex items-center gap-8"><span class="chip">' + Util.esc(a.author) + '</span><span class="chip">' + Util.esc(a.target) + '</span></div></div></div>';
  });
  ct.innerHTML = h;
};

App.modalComunicado = function () {
  const body = '<form id="form-com" novalidate><div class="form-grid">' +
    '<div class="field-group full"><label>Título <span class="req">*</span></label><input name="title" required><div class="err">Informe o título.</div></div>' +
    '<div class="field-group"><label>Destinatário</label><select name="target"><option>Todos</option><option>Professores</option><option>Alunos</option><option>Responsáveis</option></select></div>' +
    '<div class="field-group"><label>Autor</label><input name="author" value="' + Util.esc(Auth.currentUser.name) + '"></div>' +
    '<div class="field-group full"><label>Mensagem <span class="req">*</span></label><textarea name="message" required></textarea><div class="err">Escreva a mensagem.</div></div>' +
    '</div></form>';
  Modal.open({
    title: 'Novo comunicado', icon: Icons.megaphone, body: body, size: 'lg',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>Publicar</button>',
    onMount: (bd, close) => {
      const form = bd.querySelector('#form-com');
      bd.querySelector('[data-save]').addEventListener('click', () => {
        if (!this.validateForm(form)) { Toast.error('Preencha os campos.'); return; }
        const d = Object.fromEntries(new FormData(form).entries());
        d.id = DB.id('n'); d.date = Util.todayISO();
        DB.state.announcements.push(d);
        DB.save(); close(); this.renderComunicados(); Toast.success('Comunicado publicado.');
      });
    }
  });
};

App.views['minhas-notas'] = function (el) {
  const u = Auth.currentUser;
  const s = u.studentId ? this.studentById(u.studentId) : null;
  if (!s) { this.setTitle('Notas', ''); el.innerHTML = this.emptyState('student', 'Perfil não vinculado', 'Sua conta ainda não está vinculada a um aluno.'); return; }
  this.setTitle('Minhas Notas', s.name);
  const m = this.averageOf(s.id);
  const porDisc = this.averagesBySubject(s.id);
  el.innerHTML = '<div class="stats-grid mb-24">' +
      this.statCard('edit', 'blue', 'Média geral', Util.fmtNum(m, 1)) +
      this.statCard('bookOpen', 'amber', 'Disciplinas', Object.keys(porDisc).length) +
    '</div>' +
    '<div class="card mb-24"><div class="card-header"><h3>' + Icons.chart + ' Desempenho por disciplina</h3></div><div class="card-body">' + this.subjectBars(porDisc) + '</div></div>' +
    '<div class="card"><div class="card-header"><h3>' + Icons.edit + ' Detalhamento das avaliações</h3><button type="button" class="btn btn-secondary btn-sm" id="btn-boletim">Boletim (PDF)</button></div><div class="card-body" style="padding:0;">' + this.notasDetalhadas(s.id) + '</div></div>';
  document.getElementById('btn-boletim').addEventListener('click', () => this.abrirBoletim(s.id));
};
