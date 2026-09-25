'use strict';

// Audit trail screen (diretor only): who changed what and when, with filters and paging.
// The data comes from api/audit.php; nothing here can edit or erase it.

const AUDIT_ENTITIES = {
  students: 'Alunos', classes: 'Turmas', teachers: 'Professores', subjects: 'Disciplinas', users: 'Usuários',
  grades: 'Notas', attendance: 'Frequência', lessons: 'Diário de classe', activities: 'Atividades',
  occurrences: 'Ocorrências', announcements: 'Comunicados', guardians: 'Vínculos de responsáveis', events: 'Calendário',
  sessao: 'Acesso à conta', sistema: 'Sistema', ano_letivo: 'Ano letivo', periodo: 'Fechamento de notas', anexo: 'Arquivos anexados', justificativa: 'Justificativas de falta'
};
const AUDIT_ACTIONS = {
  criar: 'Criou', alterar: 'Alterou', excluir: 'Excluiu', entrar: 'Entrou', falha_login: 'Falha ao entrar',
  cadastro: 'Cadastro', senha_redefinida: 'Redefiniu a senha', reset: 'Resetou o sistema', encerrar_ano: 'Encerrou o ano',
  fechar_periodo: 'Fechou o bimestre', reabrir_periodo: 'Reabriu o bimestre', prazo_periodo: 'Definiu o prazo',
  aceitar_justificativa: 'Aceitou a justificativa', recusar_justificativa: 'Recusou a justificativa'
};
const AUDIT_FIELDS = {
  name: 'Nome', email: 'E-mail', phone: 'Telefone', role: 'Papel', status: 'Situação', matricula: 'Matrícula', studentId: 'Aluno',
  classId: 'Turma', subjectId: 'Disciplina', teacherId: 'Professor', userId: 'Usuário', course: 'Curso', period: 'Turno',
  semester: 'Semestre', room: 'Sala', birth: 'Nascimento', guardian: 'Responsável', guardianPhone: 'Tel. do responsável',
  assessment: 'Avaliação', value: 'Valor', weight: 'Peso', date: 'Data', bimestre: 'Bimestre', content: 'Conteúdo', note: 'Observação',
  title: 'Título', subject: 'Disciplina', dueDate: 'Entrega', description: 'Descrição', category: 'Categoria', situation: 'Situação',
  target: 'Destinatários', author: 'Autor', message: 'Mensagem', type: 'Tipo', endDate: 'Data final', createdBy: 'Criado por',
  senha: 'Senha', papel: 'Papel', avatar: 'Avatar', code: 'Código', cursoPretendido: 'Curso pretendido', turnoPretendido: 'Turno pretendido',
  createdAt: 'Criado em', observacao: 'Observação', novoAno: 'Novo ano', turmasNovas: 'Turmas criadas', promovidos: 'Promovidos', retidos: 'Retidos', concluidos: 'Concluídos', desligados: 'Desligados', startDate: 'Início', situacao: 'Situação', prazo: 'Prazo', tipo: 'Tipo', tamanho: 'Tamanho (bytes)', de: 'De', ate: 'Até', faltasJustificadas: 'Faltas justificadas'
};

App.audit = { page: 1, per: 50, total: 0, seq: 0, timer: null };

App.auditValue = function (field, v) {
  if (v === null || v === undefined || v === '') return '(vazio)';
  const lookup = { studentId: 'students', classId: 'classes', subjectId: 'subjects', teacherId: 'teachers', userId: 'users', createdBy: 'users' }[field];
  if (lookup) { const r = (DB.state[lookup] || []).find(x => x.id === v); if (r) return r.name; }
  if (field === 'date' || field === 'dueDate' || field === 'endDate' || field === 'birth') return Util.fmtDate(v);
  return String(v);
};

App.auditDateTime = function (ts) {
  const m = String(ts || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  return m ? m[3] + '/' + m[2] + '/' + m[1] + ' ' + m[4] + ':' + m[5] : Util.esc(ts);
};

App.auditDetailsHtml = function (d) {
  if (!d || !Object.keys(d).length) return '<span class="text-muted">Sem detalhes.</span>';
  return '<ul style="margin:0;padding-left:18px;">' + Object.keys(d).map(k => {
    const v = d[k]; const label = Util.esc(AUDIT_FIELDS[k] || k);
    return Array.isArray(v)
      ? '<li><strong>' + label + ':</strong> ' + Util.esc(this.auditValue(k, v[0])) + ' <span class="text-muted">→</span> ' + Util.esc(this.auditValue(k, v[1])) + '</li>'
      : '<li><strong>' + label + ':</strong> ' + Util.esc(this.auditValue(k, v)) + '</li>';
  }).join('') + '</ul>';
};

App.auditQuery = function (extra) {
  const p = new URLSearchParams();
  const v = id => (document.getElementById(id) || {}).value || '';
  [['q', 'aud-q'], ['user', 'aud-user'], ['entity', 'aud-entity'], ['action', 'aud-action'], ['from', 'aud-from'], ['to', 'aud-to']].forEach(([k, id]) => { if (v(id)) p.set(k, v(id)); });
  Object.keys(extra || {}).forEach(k => p.set(k, extra[k]));
  return p.toString();
};

App.views.auditoria = function (el) {
  if (Auth.currentUser.role !== 'diretor') { el.innerHTML = this.emptyState('lock', 'Acesso restrito', 'Somente o diretor vê a auditoria.'); return; }
  this.setTitle('Auditoria', 'Quem alterou o quê, e quando');
  this.audit.page = 1;
  const opt = (map) => Object.keys(map).map(k => '<option value="' + k + '">' + Util.esc(map[k]) + '</option>').join('');
  el.innerHTML = '<div class="card"><div class="card-header"><h3>' + Icons.shield + ' Registro de alterações</h3><div class="flex gap-8" id="aud-tools"></div></div><div class="card-body">' +
    '<div class="toolbar"><div class="search">' + Icons.search + '<input type="text" id="aud-q" placeholder="Buscar no registro (nome, nota, e-mail...)"></div>' +
    '<input type="text" id="aud-user" placeholder="Quem fez" style="padding:10px 14px;border:1px solid var(--border-2);border-radius:var(--radius);font-size:13.5px;width:150px;">' +
    '<select id="aud-entity"><option value="">Todos os itens</option>' + opt(AUDIT_ENTITIES) + '</select>' +
    '<select id="aud-action"><option value="">Todas as ações</option>' + opt(AUDIT_ACTIONS) + '</select>' +
    '<input type="date" id="aud-from" title="De" style="padding:9px 10px;border:1px solid var(--border-2);border-radius:var(--radius);font-size:13px;">' +
    '<input type="date" id="aud-to" title="Até" style="padding:9px 10px;border:1px solid var(--border-2);border-radius:var(--radius);font-size:13px;"></div>' +
    '<div id="aud-corpo"></div><div class="flex items-center justify-between mt-16" id="aud-pag"></div></div></div>';
  const reload = () => { this.audit.page = 1; this.loadAudit(); };
  ['aud-entity', 'aud-action', 'aud-from', 'aud-to'].forEach(id => document.getElementById(id).addEventListener('change', reload));
  ['aud-q', 'aud-user'].forEach(id => document.getElementById(id).addEventListener('input', () => { clearTimeout(this.audit.timer); this.audit.timer = setTimeout(reload, 300); }));
  Util.on(el, 'click', '[data-aud-page]', (e, t) => { this.audit.page += Number(t.dataset.audPage); this.loadAudit(); });
  Util.on(el, 'click', '[data-aud-det]', (e, t) => {
    const row = document.getElementById('aud-det-' + t.dataset.audDet);
    if (row) row.classList.toggle('hidden');
  });
  this.botaoExportar(document.getElementById('aud-tools'), () => this.exportarAuditoria());
  this.loadAudit();
};

App.loadAudit = async function () {
  const box = document.getElementById('aud-corpo'); if (!box) return;
  const seq = ++this.audit.seq; // an older, slower answer must not overwrite a newer search
  let d;
  try {
    const res = await fetch(DB.API + 'audit.php?' + this.auditQuery({ page: this.audit.page, per: this.audit.per }), { credentials: 'include' });
    if (sessionLost(res)) return;
    d = await res.json();
    if (!res.ok) throw new Error(d.error || 'erro');
  } catch (e) { if (seq === this.audit.seq && box.isConnected) box.innerHTML = '<div class="empty"><p>Não foi possível carregar a auditoria.</p></div>'; return; }
  if (seq !== this.audit.seq || !box.isConnected) return;
  this.audit.total = d.total;
  this.audit.rows = d.rows;
  if (!d.rows.length) box.innerHTML = this.emptyState('shield', 'Nada encontrado', 'Nenhum registro com esses filtros.');
  else {
    let h = '<div class="table-wrap"><table class="data"><thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>Onde</th><th>Registro</th><th></th></tr></thead><tbody>';
    d.rows.forEach(r => {
      const who = r.user_name ? Util.esc(r.user_name) + ' <span class="text-muted text-sm">(' + Util.esc(Util.roleLabel(r.user_role)) + ')</span>' : '<span class="text-muted">—</span>';
      const badge = { criar: 'green', alterar: 'blue', excluir: 'red', falha_login: 'amber', reset: 'red' }[r.action] || 'gray';
      h += '<tr><td class="mono text-sm" style="white-space:nowrap;">' + this.auditDateTime(r.created_at) + '</td><td>' + who + '</td>' +
        '<td><span class="badge ' + badge + '">' + Util.esc(AUDIT_ACTIONS[r.action] || r.action) + '</span></td>' +
        '<td>' + Util.esc(AUDIT_ENTITIES[r.entity] || r.entity) + '</td><td>' + Util.esc(r.label || '—') + '</td>' +
        '<td>' + (r.details && Object.keys(r.details).length ? '<button type="button" class="btn btn-ghost btn-sm" data-aud-det="' + r.id + '">Detalhes</button>' : '') + '</td></tr>' +
        '<tr class="hidden" id="aud-det-' + r.id + '"><td colspan="6" style="background:var(--surface-2);">' + this.auditDetailsHtml(r.details) +
        '<div class="text-muted text-sm mt-8">IP: ' + Util.esc(r.ip || '—') + '</div></td></tr>';
    });
    box.innerHTML = h + '</tbody></table></div>';
  }
  const pages = Math.max(1, Math.ceil(d.total / d.per));
  document.getElementById('aud-pag').innerHTML = '<span class="text-sm text-muted">' + d.total + ' registro(s) · página ' + d.page + ' de ' + pages + '</span><div class="flex gap-8">' +
    '<button type="button" class="btn btn-secondary btn-sm" data-aud-page="-1"' + (d.page <= 1 ? ' disabled' : '') + '>Anterior</button>' +
    '<button type="button" class="btn btn-secondary btn-sm" data-aud-page="1"' + (d.page >= pages ? ' disabled' : '') + '>Próxima</button></div>';
};
