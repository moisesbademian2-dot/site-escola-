'use strict';

App.dashboardDiretor = function (el) {
  this.setTitle('Dashboard', 'Visão geral da instituição');
  const totA = DB.state.students.filter(s => s.status === 'Ativo').length;
  const totP = DB.state.teachers.length;
  const totT = DB.state.classes.length;
  const totO = DB.state.occurrences.length;
  const att = DB.state.attendance;
  const t = att.length;
  const p = att.filter(a => a.status === 'Presente').length;
  const j = att.filter(a => a.status === 'Justificada').length;
  const freq = t ? ((p + j * 0.5) / t) * 100 : 0;
  const m = DB.state.students.filter(s => s.status === 'Ativo').filter(s => this.hasGrades(s.id)).map(s => this.averageOf(s.id));
  const media = m.length ? Util.avg(m) : 0;
  el.innerHTML = '<div class="stats-grid">' +
      this.statCard('student', 'blue', 'Alunos ativos', totA) +
      this.statCard('teacher', 'amber', 'Professores', totP) +
      this.statCard('building', 'blue', 'Turmas', totT) +
      this.statCard('checkCircle', 'green', 'Frequência média', Util.fmtNum(freq, 1) + '%') +
      this.statCard('edit', 'amber', 'Média geral', Util.fmtNum(media, 1)) +
      this.statCard('alert', 'red', 'Ocorrências', totO) +
    '</div>' +
    '<div class="grid-2 mb-24">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.chart + ' Frequência por turma</h3></div><div class="card-body">' + this.freqBarsByClass() + '</div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.chart + ' Média por turma</h3></div><div class="card-body">' + this.gradeBarsByClass() + '</div></div>' +
    '</div>' +
    '<div class="grid-2">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.alert + ' Ocorrências recentes</h3></div><div class="card-body">' + this.recentOccurrences(5) + '</div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.megaphone + ' Comunicados</h3></div><div class="card-body">' + this.recentAnnouncements(4) + '</div></div>' +
    '</div>';
};

App.dashboardCoordenador = function (el) {
  this.setTitle('Dashboard', 'Acompanhamento de alunos e turmas');
  const totA = DB.state.students.filter(s => s.status === 'Ativo').length;
  const totT = DB.state.classes.length;
  const totO = DB.state.occurrences.length;
  const att = DB.state.attendance;
  const t = att.length;
  const p = att.filter(a => a.status === 'Presente').length;
  const freq = t ? (p / t) * 100 : 0;
  const m = DB.state.students.filter(s => s.status === 'Ativo').filter(s => this.hasGrades(s.id)).map(s => this.averageOf(s.id));
  const media = m.length ? Util.avg(m) : 0;
  const risky = DB.state.students.filter(s => s.status === 'Ativo').map(s => ({ s, st: this.attendanceStats(s.id) })).filter(o => o.st.freq < 85 && o.st.total > 0).sort((a, b) => a.st.freq - b.st.freq).slice(0, 5);
  const low = DB.state.students.filter(s => s.status === 'Ativo').map(s => ({ s, m: this.averageOf(s.id) })).filter(o => this.hasGrades(o.s.id) && o.m < 6).sort((a, b) => a.m - b.m).slice(0, 5);
  el.innerHTML = '<div class="stats-grid">' +
      this.statCard('student', 'blue', 'Alunos', totA) +
      this.statCard('building', 'blue', 'Turmas', totT) +
      this.statCard('checkCircle', 'green', 'Frequência geral', Util.fmtNum(freq, 1) + '%') +
      this.statCard('edit', 'amber', 'Média geral', Util.fmtNum(media, 1)) +
      this.statCard('alert', 'red', 'Ocorrências', totO) +
      this.statCard('megaphone', 'amber', 'Comunicados', DB.state.announcements.length) +
    '</div>' +
    '<div class="grid-2 mb-24">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.alert + ' Maior índice de faltas</h3><button type="button" class="btn btn-ghost btn-sm" data-goto="alunos">Ver todos</button></div><div class="card-body" style="padding:0;">' + (risky.length ? this.riskyTable(risky) : '<div class="empty" style="padding:32px;"><p>Nenhum aluno em situação crítica.</p></div>') + '</div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.trendUp + ' Baixo rendimento</h3></div><div class="card-body" style="padding:0;">' + (low.length ? this.lowGradeTable(low) : '<div class="empty" style="padding:32px;"><p>Nenhum aluno abaixo da média.</p></div>') + '</div></div>' +
    '</div>' +
    '<div class="card"><div class="card-header"><h3>' + Icons.megaphone + ' Comunicados recentes</h3><button type="button" class="btn btn-secondary btn-sm" data-goto="comunicados">Gerenciar</button></div><div class="card-body">' + this.recentAnnouncements(5) + '</div></div>';
  this.wireGotos(el);
};

App.dashboardProfessor = function (el) {
  const u = Auth.currentUser;
  const prof = DB.state.teachers.find(t => t.userId === u.id || t.email === u.email);
  this.setTitle('Dashboard', 'Bem-vindo, ' + u.name.split(' ')[0]);
  const turmas = prof ? DB.state.classes.filter(c => c.teacherId === prof.id) : [];
  let totalAlunos = 0;
  turmas.forEach(c => { totalAlunos += this.studentsOfClass(c.id).length; });
  const turmaIds = turmas.map(c => c.id);
  const abertas = DB.state.activities.filter(a => turmaIds.includes(a.classId) && a.status !== 'Encerrada').length;
  const ocorr = DB.state.occurrences.filter(o => o.teacherId === (prof ? prof.id : '')).length;
  el.innerHTML = '<div class="stats-grid">' +
      this.statCard('building', 'blue', 'Minhas turmas', turmas.length) +
      this.statCard('student', 'blue', 'Alunos', totalAlunos) +
      this.statCard('clipboard', 'amber', 'Atividades abertas', abertas) +
      this.statCard('alert', 'red', 'Ocorrências', ocorr) +
    '</div>' +
    '<div class="grid-2 mb-24">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.building + ' Minhas turmas</h3><button type="button" class="btn btn-ghost btn-sm" data-goto="minhas-turmas">Ver todas</button></div><div class="card-body">' + (turmas.length ? this.turmasMiniCards(turmas) : this.emptyState('building', 'Sem turmas', 'Você ainda não está vinculado a turmas.')) + '</div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.megaphone + ' Comunicados</h3></div><div class="card-body">' + this.recentAnnouncements(4) + '</div></div>' +
    '</div>' +
    '<div class="grid-2">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.clipboard + ' Atividades recentes</h3><button type="button" class="btn btn-ghost btn-sm" data-goto="atividades">Gerenciar</button></div><div class="card-body">' + this.recentActivities(4) + '</div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.alert + ' Ocorrências recentes</h3><button type="button" class="btn btn-ghost btn-sm" data-goto="ocorrencias">Ver todas</button></div><div class="card-body">' + this.recentOccurrences(4) + '</div></div>' +
    '</div>';
  this.wireGotos(el);
};

App.dashboardAluno = function (el) {
  const u = Auth.currentUser;
  const st = u.studentId ? this.studentById(u.studentId) : null;
  if (!st) { this.setTitle('Portal do Aluno', 'Bem-vindo'); el.innerHTML = this.emptyState('student', 'Perfil não vinculado', 'Sua conta de aluno ainda não está vinculada a um cadastro.'); return; }
  this.setTitle('Meu Portal', 'Bem-vindo, ' + st.name.split(' ')[0]);
  const turma = this.classById(st.classId);
  const a = this.attendanceStats(st.id);
  const media = this.averageOf(st.id);
  const porDisc = this.averagesBySubject(st.id);
  const ativs = DB.state.activities.filter(x => x.classId === st.classId && x.status !== 'Encerrada');
  const ocorr = DB.state.occurrences.filter(o => o.studentId === st.id);
  el.innerHTML = '<div class="card card-pad mb-24" style="background:linear-gradient(135deg,var(--blue-dark) 0%,var(--blue) 100%);color:#fff;border:none;">' +
      '<div class="flex items-center gap-16">' +
        '<div style="width:60px;height:60px;border-radius:12px;background:var(--yellow);color:var(--blue-dark);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;letter-spacing:-0.02em;">' + Util.esc(Util.initials(st.name)) + '</div>' +
        '<div><h2 style="font-size:22px;font-weight:700;letter-spacing:-0.02em;">' + Util.esc(st.name) + '</h2>' +
        '<p style="color:#cbd5e1;font-size:13px;margin-top:4px;">Matrícula ' + Util.esc(st.matricula) + ' · ' + (turma ? Util.esc(turma.name) : '—') + ' · ' + Util.esc(st.period || '') + '</p></div>' +
      '</div>' +
    '</div>' +
    '<div class="stats-grid">' +
      this.statCard('edit', 'blue', 'Média geral', Util.fmtNum(media, 1)) +
      this.statCard('checkCircle', 'green', 'Frequência', Util.fmtNum(a.freq, 1) + '%') +
      this.statCard('alert', 'red', 'Faltas', a.faltas) +
      this.statCard('clipboard', 'amber', 'Atividades', ativs.length) +
    '</div>' +
    '<div class="grid-2 mb-24">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.chart + ' Desempenho por disciplina</h3></div><div class="card-body">' + this.subjectBars(porDisc) + '</div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.clipboard + ' Atividades pendentes</h3></div><div class="card-body">' + (ativs.length ? this.activitiesList(ativs.slice(0, 4)) : '<div class="empty"><p>Nenhuma atividade pendente.</p></div>') + '</div></div>' +
    '</div>' +
    '<div class="grid-2">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.megaphone + ' Comunicados</h3></div><div class="card-body">' + this.recentAnnouncements(3) + '</div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.alert + ' Minhas ocorrências</h3></div><div class="card-body">' + (ocorr.length ? this.occurrencesList(ocorr.slice(0, 4)) : '<div class="empty"><p>Nenhuma ocorrência registrada.</p></div>') + '</div></div>' +
    '</div>';
};

App.dashboardResponsavel = function (el) {
  const u = Auth.currentUser;
  const st = u.studentId ? this.studentById(u.studentId) : null;
  if (!st) { this.setTitle('Portal do Responsável', 'Bem-vindo'); el.innerHTML = this.emptyState('users', 'Sem aluno vinculado', 'Sua conta ainda não está associada a um aluno.'); return; }
  this.setTitle('Acompanhamento', 'Aluno: ' + st.name.split(' ')[0]);
  const turma = this.classById(st.classId);
  const a = this.attendanceStats(st.id);
  const media = this.averageOf(st.id);
  const porDisc = this.averagesBySubject(st.id);
  const ativs = DB.state.activities.filter(x => x.classId === st.classId);
  const ocorr = DB.state.occurrences.filter(o => o.studentId === st.id);
  el.innerHTML = '<div class="card card-pad mb-24" style="background:linear-gradient(135deg,var(--blue-dark) 0%,var(--blue) 100%);color:#fff;border:none;">' +
      '<div class="flex items-center gap-16">' +
        '<div style="width:60px;height:60px;border-radius:12px;background:var(--yellow);color:var(--blue-dark);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;">' + Util.esc(Util.initials(st.name)) + '</div>' +
        '<div><p style="color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">Aluno(a)</p>' +
        '<h2 style="font-size:22px;font-weight:700;letter-spacing:-0.02em;margin-top:2px;">' + Util.esc(st.name) + '</h2>' +
        '<p style="color:#cbd5e1;font-size:13px;margin-top:4px;">Turma ' + (turma ? Util.esc(turma.name) : '—') + ' · Matrícula ' + Util.esc(st.matricula) + '</p></div>' +
      '</div>' +
    '</div>' +
    '<div class="stats-grid">' +
      this.statCard('edit', 'blue', 'Média', Util.fmtNum(media, 1)) +
      this.statCard('checkCircle', 'green', 'Frequência', Util.fmtNum(a.freq, 1) + '%') +
      this.statCard('alert', 'red', 'Faltas', a.faltas) +
      this.statCard('alert', 'amber', 'Ocorrências', ocorr.length) +
    '</div>' +
    '<div class="grid-2 mb-24">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.chart + ' Desempenho por disciplina</h3></div><div class="card-body">' + this.subjectBars(porDisc) + '</div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.checkCircle + ' Situação de frequência</h3></div><div class="card-body">' +
          '<div class="donut" style="background:conic-gradient(var(--blue) 0% ' + a.freq.toFixed(1) + '%, var(--border) 0);"><div class="hole"><strong>' + Util.fmtNum(a.freq, 0) + '%</strong><span>Frequência</span></div></div>' +
          '<div class="grid-3 mt-24" style="text-align:center;">' +
            '<div><div class="text-bold mono" style="font-size:20px;color:var(--success);">' + a.pres + '</div><div class="text-xs text-muted">Presenças</div></div>' +
            '<div><div class="text-bold mono" style="font-size:20px;color:var(--yellow-dark);">' + a.just + '</div><div class="text-xs text-muted">Justificadas</div></div>' +
            '<div><div class="text-bold mono" style="font-size:20px;color:var(--danger);">' + a.faltas + '</div><div class="text-xs text-muted">Faltas</div></div>' +
          '</div>' +
        '</div></div>' +
    '</div>' +
    '<div class="grid-2">' +
      '<div class="card"><div class="card-header"><h3>' + Icons.clipboard + ' Atividades</h3></div><div class="card-body">' + (ativs.length ? this.activitiesList(ativs.slice(0, 4)) : '<div class="empty"><p>Nenhuma atividade disponível.</p></div>') + '</div></div>' +
      '<div class="card"><div class="card-header"><h3>' + Icons.megaphone + ' Comunicados</h3></div><div class="card-body">' + this.recentAnnouncements(4) + '</div></div>' +
    '</div>';
};

App.freqBarsByClass = function () {
  const cs = DB.state.classes;
  if (!cs.length) return this.emptyState('building', 'Nenhuma turma', 'Cadastre uma turma para ver os gráficos.');
  let max = 0;
  const data = cs.map(c => {
    const sts = this.studentsOfClass(c.id);
    let t = 0, p = 0, j = 0;
    sts.forEach(s => {
      const r = DB.state.attendance.filter(a => a.studentId === s.id && a.classId === c.id);
      t += r.length; p += r.filter(a => a.status === 'Presente').length; j += r.filter(a => a.status === 'Justificada').length;
    });
    const f = t ? ((p + j * 0.5) / t) * 100 : 0;
    max = Math.max(max, f);
    return { name: c.name, f };
  });
  let h = '<div class="bar-chart">';
  data.forEach(d => {
    const pct = max ? (d.f / max) * 100 : 0;
    const cls = d.f >= 90 ? 'green' : d.f >= 75 ? 'amber' : 'red';
    h += '<div class="col"><div class="bar-fill ' + cls + '" style="height:' + pct.toFixed(1) + '%;" title="' + d.f.toFixed(1) + '%"></div><div class="lbl">' + Util.esc(d.name) + '</div></div>';
  });
  h += '</div>';
  return h;
};

App.gradeBarsByClass = function () {
  const cs = DB.state.classes;
  if (!cs.length) return this.emptyState('building', 'Nenhuma turma', 'Cadastre uma turma para ver os gráficos.');
  const data = cs.map(c => ({ name: c.name, m: this.classAverage(c.id) }));
  const max = Math.max.apply(null, data.map(d => d.m).concat([10]));
  let h = '<div class="bar-chart">';
  data.forEach(d => {
    const pct = (d.m / max) * 100;
    const cls = d.m >= 7 ? 'green' : d.m >= 5 ? 'amber' : 'red';
    h += '<div class="col"><div class="bar-fill ' + cls + '" style="height:' + pct.toFixed(1) + '%;" title="Média ' + d.m.toFixed(1) + '"></div><div class="lbl">' + Util.esc(d.name) + '</div></div>';
  });
  h += '</div>';
  return h;
};

App.subjectBars = function (porDisc) {
  const k = Object.keys(porDisc);
  if (!k.length) return '<p class="text-muted text-sm">Sem notas registradas.</p>';
  let h = '';
  k.forEach(nome => {
    const m = porDisc[nome];
    const pct = Math.min(100, (m / 10) * 100);
    const cls = m >= 7 ? 'green' : m >= 5 ? 'amber' : 'red';
    h += '<div class="mb-16"><div class="flex items-center justify-between text-sm" style="margin-bottom:6px;"><strong>' + Util.esc(nome) + '</strong><span class="badge ' + cls + ' mono">' + Util.fmtNum(m, 1) + '</span></div><div class="progress ' + cls + '"><div class="bar" style="width:' + pct + '%;"></div></div></div>';
  });
  return h;
};

App.riskyTable = function (list) {
  let h = '<table class="data"><thead><tr><th>Aluno</th><th>Turma</th><th>Frequência</th><th>Faltas</th></tr></thead><tbody>';
  list.forEach(o => {
    const t = this.classById(o.s.classId);
    h += '<tr><td><div class="cell-user"><div class="avatar-sm" style="background:' + Util.colorFor(o.s.name) + '">' + Util.esc(Util.initials(o.s.name)) + '</div><div class="u-meta"><strong>' + Util.esc(o.s.name) + '</strong><span>' + Util.esc(o.s.matricula) + '</span></div></div></td><td>' + (t ? Util.esc(t.name) : '—') + '</td><td><span class="badge red mono">' + Util.fmtNum(o.st.freq, 1) + '%</span></td><td class="mono">' + o.st.faltas + '</td></tr>';
  });
  h += '</tbody></table>';
  return h;
};

App.lowGradeTable = function (list) {
  let h = '<table class="data"><thead><tr><th>Aluno</th><th>Turma</th><th>Média</th></tr></thead><tbody>';
  list.forEach(o => {
    const t = this.classById(o.s.classId);
    h += '<tr><td><div class="cell-user"><div class="avatar-sm" style="background:' + Util.colorFor(o.s.name) + '">' + Util.esc(Util.initials(o.s.name)) + '</div><div class="u-meta"><strong>' + Util.esc(o.s.name) + '</strong><span>' + Util.esc(o.s.matricula) + '</span></div></div></td><td>' + (t ? Util.esc(t.name) : '—') + '</td><td><span class="badge ' + Util.notaBadge(o.m) + ' mono">' + Util.fmtNum(o.m, 1) + '</span></td></tr>';
  });
  h += '</tbody></table>';
  return h;
};

App.recentOccurrences = function (limit) {
  const list = DB.state.occurrences.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, limit || 5);
  if (!list.length) return '<div class="empty"><p>Nenhuma ocorrência registrada.</p></div>';
  let h = '<div class="timeline">';
  list.forEach(o => {
    const st = this.studentById(o.studentId);
    const cls = o.situation === 'Positiva' ? 'success' : 'warning';
    h += '<div class="timeline-item ' + cls + '"><div class="t-title">' + Util.esc(o.category || 'Ocorrência') + ' — ' + (st ? Util.esc(st.name) : '—') + '</div><div class="t-time mono">' + Util.fmtDate(o.date) + '</div><div class="t-desc">' + Util.esc(o.description) + '</div></div>';
  });
  h += '</div>';
  return h;
};

App.recentAnnouncements = function (limit) {
  const list = DB.state.announcements.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, limit || 4);
  if (!list.length) return '<div class="empty"><p>Nenhum comunicado publicado.</p></div>';
  let h = '';
  list.forEach((a, i) => {
    h += '<div class="mb-16" style="' + (i < list.length - 1 ? 'padding-bottom:16px;border-bottom:1px solid var(--border);' : '') + '"><div class="flex items-center justify-between mb-8"><strong style="font-size:13.5px;">' + Util.esc(a.title) + '</strong><span class="text-xs text-muted mono">' + Util.fmtDate(a.date) + '</span></div><p class="text-sm text-muted" style="line-height:1.55;">' + Util.esc(a.message.slice(0, 180)) + (a.message.length > 180 ? '…' : '') + '</p><div class="mt-8 flex items-center gap-8"><span class="chip">' + Util.esc(a.author) + '</span><span class="chip">' + Util.esc(a.target) + '</span></div></div>';
  });
  return h;
};

App.recentActivities = function (limit) {
  const list = DB.state.activities.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, limit || 4);
  if (!list.length) return '<div class="empty"><p>Nenhuma atividade cadastrada.</p></div>';
  return this.activitiesList(list);
};

App.activitiesList = function (list) {
  let h = '';
  list.forEach(a => {
    h += '<div class="flex items-center gap-12 mb-12" style="padding:12px;border:1px solid var(--border);border-radius:var(--radius);"><div class="stat-icon amber" style="width:36px;height:36px;border-radius:var(--radius);">' + Icons.clipboard + '</div><div style="flex:1;min-width:0;"><strong style="display:block;font-size:13.5px;">' + Util.esc(a.title) + '</strong><span class="text-xs text-muted">' + Util.esc(a.subject) + ' · Entrega ' + Util.fmtDate(a.dueDate) + '</span></div><span class="badge ' + Util.statusClass(a.status) + '">' + Util.esc(a.status) + '</span></div>';
  });
  return h;
};

App.occurrencesList = function (list) {
  let h = '';
  list.forEach(o => {
    h += '<div class="flex items-start gap-12 mb-12" style="padding:12px;border:1px solid var(--border);border-radius:var(--radius);"><div class="stat-icon red" style="width:36px;height:36px;border-radius:var(--radius);flex-shrink:0;">' + Icons.alert + '</div><div style="flex:1;min-width:0;"><strong style="display:block;font-size:13.5px;">' + Util.esc(o.category || 'Ocorrência') + '</strong><span class="text-xs text-muted mono">' + Util.fmtDate(o.date) + '</span><p class="text-sm mt-8" style="color:var(--muted);">' + Util.esc(o.description) + '</p></div></div>';
  });
  return h;
};

App.turmasMiniCards = function (turmas) {
  let h = '<div class="grid-2">';
  turmas.forEach(c => {
    const q = this.studentsOfClass(c.id).length;
    h += '<div class="turma-card" data-view-class="' + Util.esc(c.id) + '"><div class="t-head"><div><div class="t-code">' + Util.esc(c.name) + '</div><div class="t-sub">' + Util.esc(c.period) + ' · ' + Util.esc(c.room || '') + '</div></div><span class="badge blue">' + q + ' alunos</span></div></div>';
  });
  h += '</div>';
  return h;
};

App.wireGotos = function (el) {
  el.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => App.navigate(b.dataset.goto)));
  el.querySelectorAll('[data-view-class]').forEach(b => b.addEventListener('click', () => App.verTurma(b.dataset.viewClass)));
};

App.views.alunos = function (el) {
  const canEdit = ['diretor','coordenador'].includes(Auth.currentUser.role);
  this.setTitle('Alunos', DB.state.students.length + ' registros');
  el.innerHTML = '<div class="card"><div class="card-header"><h3>' + Icons.student + ' Lista de alunos</h3>' + (canEdit ? '<div class="flex gap-8"><button type="button" class="btn btn-secondary btn-sm" id="btn-importar-alunos">Importar CSV</button><button type="button" class="btn btn-primary btn-sm" id="btn-novo-aluno">' + Icons.plus + ' Cadastrar aluno</button></div>' : '') + '</div><div class="card-body"><div class="toolbar"><div class="search">' + Icons.search + '<input type="text" id="busca-aluno" placeholder="Buscar por nome, matrícula ou e-mail..."></div><select id="filtro-turma"><option value="">Todas as turmas</option>' + DB.state.classes.map(c => '<option value="' + Util.esc(c.id) + '">' + Util.esc(c.name) + '</option>').join('') + '</select><select id="filtro-situacao"><option value="">Todas as situações</option><option>Ativo</option><option>Inativo</option><option>Transferido</option><option>Concluído</option></select></div><div id="tabela-alunos"></div></div></div>';
  // The table body is redrawn on every search/filter; these listeners live on the view instead,
  // bound once. (Bound inside renderAlunosTable they piled up: after 3 searches one click on
  // "Ver" opened 4 windows, and "Excluir" 4 confirmation dialogs.)
  Util.on(el, 'click', '[data-ver]', (e, t) => this.verAluno(t.dataset.ver));
  if (canEdit) {
    Util.on(el, 'click', '[data-edit]', (e, t) => this.modalAluno(t.dataset.edit));
    Util.on(el, 'click', '[data-del]', (e, t) => {
      const s = this.studentById(t.dataset.del);
      if (!s) return;
      this.confirmarExclusaoSegura({
        titulo: 'Excluir aluno',
        aviso: 'Esta ação é <strong style="color:var(--danger);">irreversível</strong>. O aluno "' + Util.esc(s.name) + '" e todas as notas, frequências e ocorrências vinculadas serão excluídos permanentemente.',
        mensagem: 'Para concluir a exclusão de "' + Util.esc(s.name) + '", digite o código de verificação abaixo.',
        label: 'Excluir aluno',
        onConfirm: () => {
          DB.state.students = DB.state.students.filter(x => x.id !== s.id);
          DB.state.grades = DB.state.grades.filter(g => g.studentId !== s.id);
          DB.state.attendance = DB.state.attendance.filter(a => a.studentId !== s.id);
          DB.state.occurrences = DB.state.occurrences.filter(o => o.studentId !== s.id);
          DB.state.users.forEach(u => { if (u.studentId === s.id) delete u.studentId; });
          DB.state.guardians = DB.state.guardians.filter(g => g.studentId !== s.id);
          DB.save(); this.renderAlunosTable(); Toast.success('Aluno excluído com sucesso.');
        }
      });
    });
  }
  this.renderAlunosTable();
  document.getElementById('busca-aluno').addEventListener('input', Util.debounce(() => this.renderAlunosTable(), 200));
  document.getElementById('filtro-turma').addEventListener('change', () => this.renderAlunosTable());
  document.getElementById('filtro-situacao').addEventListener('change', () => this.renderAlunosTable());
  if (canEdit) {
    document.getElementById('btn-novo-aluno').addEventListener('click', () => this.modalAluno());
    document.getElementById('btn-importar-alunos').addEventListener('click', () => this.modalImportarAlunos());
  }
};
