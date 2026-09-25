'use strict';

// The report card as a self-contained document: one row per subject with each
// bimestre's average, the subject's final average, then attendance and the
// overall situation (same 7 / 5 cut-offs the Notas screen already uses).
// ctx (optional) renders a closed school year instead of the current one:
// { student, className, yearName, grades, attendance } as api/years.php returns them.
App.boletimHtml = function (sid, ctx) {
  const s = (ctx && ctx.student) || this.studentById(sid);
  const t = ctx ? null : this.classById(s.classId);
  const className = ctx ? ctx.className : (t ? t.name : '');
  const grades = ctx ? ctx.grades : DB.state.grades.filter(g => g.studentId === sid);
  const hasLoose = grades.some(g => !g.bimestre);
  const cols = BIMESTRES.concat(hasLoose ? ['Sem bimestre'] : []);
  const cell = v => v === null ? '—' : Util.fmtNum(v, 1);
  const bySubject = {};
  grades.forEach(g => { (bySubject[g.subjectId] = bySubject[g.subjectId] || []).push(g); });
  const subjectIds = DB.state.subjects.map(x => x.id).filter(id => bySubject[id]).concat(Object.keys(bySubject).filter(id => !this.subjectById(id)));
  let rows = '';
  subjectIds.forEach(id => {
    const list = bySubject[id];
    const sub = this.subjectById(id);
    rows += '<tr><td class="left">' + (sub ? Util.esc(sub.name) : '—') + '</td>' + cols.map(b => {
      const l = list.filter(g => (g.bimestre || 'Sem bimestre') === b);
      return '<td>' + cell(l.length ? this.gradesAverage(l) : null) + '</td>';
    }).join('') + '<td><strong>' + cell(this.gradesAverage(list)) + '</strong></td></tr>';
  });
  const media = this.overallAverage(grades);
  const a = ctx ? this.attendanceStatsOf(ctx.attendance) : this.attendanceStats(sid);
  const situacao = !grades.length ? 'Sem notas lançadas' : media >= 7 ? 'Aprovado' : media >= 5 ? 'Em recuperação' : 'Reprovado';
  return '<div class="boletim">' +
    '<div class="bol-head">' + LOGO_IMG + '<div><h1>Boletim escolar</h1><p>Portal of Future</p></div></div>' +
    '<div class="bol-info">' +
      '<div><span>Aluno(a)</span><strong>' + Util.esc(s.name) + '</strong></div>' +
      '<div><span>Matrícula</span><strong>' + Util.esc(s.matricula) + '</strong></div>' +
      '<div><span>Turma</span><strong>' + (className ? Util.esc(className) : '—') + '</strong></div>' +
      (ctx && ctx.yearName ? '<div><span>Ano letivo</span><strong>' + Util.esc(ctx.yearName) + '</strong></div>' : '') +
      '<div><span>Curso</span><strong>' + Util.esc(s.course || (t && t.course) || '—') + '</strong></div>' +
    '</div>' +
    (rows
      ? '<table class="bol-table"><thead><tr><th class="left">Disciplina</th>' + cols.map(b => '<th>' + Util.esc(b) + '</th>').join('') + '<th>Média final</th></tr></thead><tbody>' + rows + '</tbody></table>'
      : '<p class="bol-empty">Nenhuma nota lançada até o momento.</p>') +
    '<div class="bol-summary">' +
      '<div><span>Média geral</span><strong>' + Util.fmtNum(media, 1) + '</strong></div>' +
      '<div><span>Frequência</span><strong>' + Util.fmtNum(a.freq, 1) + '%</strong></div>' +
      '<div><span>Presenças / Faltas / Justif.</span><strong>' + a.pres + ' / ' + a.faltas + ' / ' + a.just + '</strong></div>' +
      '<div><span>Situação</span><strong>' + situacao + '</strong></div>' +
    '</div>' +
    '<p class="bol-foot">Emitido em ' + Util.fmtDateLong(Util.todayISO()) + '. Aprovação com média igual ou superior a 7,0; recuperação a partir de 5,0.</p>' +
  '</div>';
};

App.abrirBoletim = function (sid, ctx) {
  if (!ctx && !this.studentById(sid)) return;
  Modal.open({
    title: 'Boletim', icon: Icons.edit, size: 'lg',
    body: this.boletimHtml(sid, ctx),
    footer: '<button type="button" class="btn btn-secondary" data-close>Fechar</button><button type="button" class="btn btn-primary" data-print>Imprimir / Salvar em PDF</button>',
    onMount: bd => bd.querySelector('[data-print]').addEventListener('click', () => this.imprimirBoletim(sid, ctx))
  });
};

// Prints through the browser ("Salvar como PDF" in its print dialog): the report
// goes into a #boletim-print div that style.css shows alone under @media print.
App.imprimirBoletim = function (sid, ctx) {
  const box = document.createElement('div');
  box.id = 'boletim-print';
  box.innerHTML = this.boletimHtml(sid, ctx);
  document.body.appendChild(box);
  const done = () => { window.removeEventListener('afterprint', done); if (box.parentNode) box.parentNode.removeChild(box); };
  window.addEventListener('afterprint', done);
  window.print();
};

App.notasDetalhadas = function (sid) {
  const gs = DB.state.grades.filter(g => g.studentId === sid);
  if (!gs.length) return '<div class="empty" style="padding:32px;"><p>Nenhuma nota lançada.</p></div>';
  const byBim = {};
  gs.forEach(g => { const b = g.bimestre || 'Sem bimestre'; (byBim[b] = byBim[b] || []).push(g); });
  let h = '';
  BIMESTRES.concat(['Sem bimestre']).filter(b => byBim[b]).forEach(b => {
    const list = byBim[b].slice().sort((a, c) => (c.date || '').localeCompare(a.date || ''));
    const avg = this.gradesAverage(list);
    h += '<div class="mb-16"><div class="flex items-center justify-between mb-8" style="padding:12px 16px 0;"><strong style="font-size:13.5px;">' + Util.esc(b) + '</strong><span class="badge ' + Util.notaBadge(avg) + ' mono">Média ' + Util.fmtNum(avg, 1) + '</span></div>' +
      '<div class="table-wrap"><table class="data"><thead><tr><th>Disciplina</th><th>Avaliação</th><th>Data</th><th>Nota</th></tr></thead><tbody>';
    list.forEach(g => {
      const s = this.subjectById(g.subjectId);
      h += '<tr><td>' + (s ? Util.esc(s.name) : '—') + '</td><td>' + Util.esc(g.assessment) + '</td><td class="mono text-sm">' + Util.fmtDate(g.date) + '</td><td><span class="badge ' + Util.notaBadge(Number(g.value)) + ' mono">' + Util.fmtNum(g.value, 1) + '</span></td></tr>';
    });
    h += '</tbody></table></div></div>';
  });
  return h;
};

App.views['minha-frequencia'] = function (el) {
  const u = Auth.currentUser;
  const s = u.studentId ? this.studentById(u.studentId) : null;
  if (!s) { el.innerHTML = this.emptyState('student', 'Perfil não vinculado', 'Sua conta ainda não está vinculada a um aluno.'); return; }
  this.setTitle('Minha Frequência', s.name);
  const a = this.attendanceStats(s.id);
  const recs = DB.state.attendance.filter(x => x.studentId === s.id).sort((x, y) => (y.date || '').localeCompare(x.date || ''));
  el.innerHTML = '<div class="stats-grid mb-24">' +
      this.statCard('checkCircle', 'green', 'Frequência', Util.fmtNum(a.freq, 1) + '%') +
      this.statCard('book', 'blue', 'Total de aulas', a.total) +
      this.statCard('check', 'green', 'Presenças', a.pres) +
      this.statCard('clock', 'amber', 'Justificadas', a.just) +
      this.statCard('alert', 'red', 'Faltas', a.faltas) +
    '</div>' +
    '<div class="card mb-24"><div class="card-body"><div class="progress ' + (a.freq >= 90 ? 'green' : a.freq >= 75 ? 'amber' : 'red') + '" style="height:8px;"><div class="bar" style="width:' + a.freq.toFixed(1) + '%;"></div></div><p class="text-sm text-muted mt-12">Mínimo de 75% de frequência para aprovação.</p></div></div>' +
    '<div class="card"><div class="card-header"><h3>' + Icons.clock + ' Histórico de frequência</h3></div><div class="card-body" style="padding:0;">' + this.historicoFrequencia(recs) + '</div></div>';
};

App.historicoFrequencia = function (recs) {
  if (!recs.length) return '<div class="empty" style="padding:32px;"><p>Nenhum registro.</p></div>';
  let h = '<div class="table-wrap"><table class="data"><thead><tr><th>Data</th><th>Disciplina</th><th>Situação</th></tr></thead><tbody>';
  recs.forEach(r => {
    const s = this.subjectById(r.subjectId);
    h += '<tr><td class="mono text-sm">' + Util.fmtDate(r.date) + '</td><td>' + (s ? Util.esc(s.name) : '—') + '</td><td><span class="badge ' + Util.statusClass(r.status) + '">' + Util.esc(r.status) + '</span></td></tr>';
  });
  h += '</tbody></table></div>';
  return h;
};

App.views.conteudos = function (el) {
  this.setTitle('Conteúdos das Aulas', DB.state.lessons.length + ' registros');
  const list = DB.state.lessons.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  let h = '<div class="card"><div class="card-body">';
  if (!list.length) h += this.emptyState('bookOpen', 'Nenhum conteúdo', 'Ainda não há registros de conteúdo de aulas.');
  else {
    h += '<div class="timeline">';
    list.forEach(l => {
      const c = this.classById(l.classId);
      const s = this.subjectById(l.subjectId);
      h += '<div class="timeline-item"><div class="t-title">' + (s ? Util.esc(s.name) : 'Sem disciplina') + ' · ' + (c ? Util.esc(c.name) : '—') + '</div><div class="t-time mono">' + Util.fmtDateLong(l.date) + '</div><div class="t-desc">' + Util.esc(l.content) + (l.note ? '<br><em class="text-muted">Obs.: ' + Util.esc(l.note) + '</em>' : '') + this.anexosHtml('lesson', l) + '</div></div>';
    });
    h += '</div>';
  }
  h += '</div></div>';
  el.innerHTML = h;
  this.bindAnexos(el, () => this.navigate('conteudos'));
};

App.views.perfil = function (el) {
  const u = Auth.currentUser;
  const s = u.studentId ? this.studentById(u.studentId) : null;
  if (!s) { el.innerHTML = this.emptyState('user', 'Perfil não vinculado', 'Sua conta ainda não está associada a um aluno.'); return; }
  this.setTitle('Meu Perfil', s.name);
  const t = this.classById(s.classId);
  el.innerHTML = '<div class="card mb-24"><div class="card-body">' +
      '<div class="flex items-center gap-16">' +
        '<div style="width:72px;height:72px;border-radius:12px;background:' + Util.colorFor(s.name) + ';display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;">' + Util.esc(Util.initials(s.name)) + '</div>' +
        '<div><h2 style="font-size:22px;font-weight:700;letter-spacing:-0.02em;">' + Util.esc(s.name) + '</h2>' +
        '<p class="text-muted mt-8 mono" style="font-size:12.5px;">' + Util.esc(s.matricula) + ' · ' + (t ? Util.esc(t.name) : '—') + '</p>' +
        '<div class="mt-12 flex gap-8"><span class="badge ' + Util.statusClass(s.status) + '">' + Util.esc(s.status) + '</span><span class="chip">' + Util.esc(s.period || '') + '</span></div></div>' +
      '</div>' +
    '</div></div>' +
    '<div class="card"><div class="card-header"><h3>' + Icons.user + ' Dados pessoais</h3></div><div class="card-body"><div class="grid-2">' +
      '<div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Data de nascimento</span><div>' + Util.fmtDate(s.birth) + '</div></div>' +
      '<div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">E-mail</span><div>' + Util.esc(s.email || '—') + '</div></div>' +
      '<div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Telefone</span><div>' + Util.esc(s.phone || '—') + '</div></div>' +
      '<div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Curso</span><div>' + Util.esc(s.course || '—') + '</div></div>' +
      '<div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Responsável</span><div>' + Util.esc(s.guardian || '—') + '</div></div>' +
      '<div><span class="text-xs text-muted text-bold" style="text-transform:uppercase;letter-spacing:0.08em;">Tel. responsável</span><div>' + Util.esc(s.guardianPhone || '—') + '</div></div>' +
    '</div></div></div>';
};
