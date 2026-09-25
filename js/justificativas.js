'use strict';

// Justifications of absence: a family asks (with an optional certificate), the coordination decides.
// api/justifications.php does the checking and the updating of the absences; this is the screen.

App.just = { items: [], filter: 'pendente' };

App.justStatusBadge = function (s) {
  return '<span class="badge ' + ({ pendente: 'amber', aceita: 'green', recusada: 'red' }[s] || 'gray') + '">' + ({ pendente: 'Aguardando', aceita: 'Aceita', recusada: 'Recusada' }[s] || s) + '</span>';
};

App.justPeriod = function (j) {
  return j.dateFrom === j.dateTo ? Util.fmtDate(j.dateFrom) : Util.fmtDate(j.dateFrom) + ' a ' + Util.fmtDate(j.dateTo);
};

App.views.justificativas = function (el) {
  const u = Auth.currentUser;
  const staff = ['diretor', 'coordenador'].includes(u.role);
  const canCreate = staff || ['aluno', 'responsavel'].includes(u.role);
  this.setTitle('Justificativas de falta', staff ? 'Pedidos das famílias' : u.role === 'professor' ? 'Pedidos dos seus alunos' : 'Peça para justificar uma falta');
  this.just.filter = staff ? 'pendente' : '';
  el.innerHTML = '<div class="card"><div class="card-header"><h3>' + Icons.clipboard + ' Pedidos</h3>' +
    (canCreate ? '<button type="button" class="btn btn-primary btn-sm" id="btn-nova-just">' + Icons.plus + ' Nova justificativa</button>' : '') + '</div><div class="card-body">' +
    (staff ? '<div class="toolbar"><select id="just-filtro"><option value="pendente">Aguardando resposta</option><option value="">Todos</option><option value="aceita">Aceitos</option><option value="recusada">Recusados</option></select></div>' : '') +
    '<div id="just-lista"><p class="text-muted text-sm">Carregando...</p></div></div></div>';
  if (canCreate) document.getElementById('btn-nova-just').addEventListener('click', () => this.modalNovaJustificativa());
  if (staff) document.getElementById('just-filtro').addEventListener('change', e => { this.just.filter = e.target.value; this.renderJustificativas(); });
  Util.on(el, 'click', '[data-just-anexar]', async (e, t) => {
    const files = await this.escolherArquivos(true);
    if (!files.length) return;
    const n = await this.enviarAnexos('justification', t.dataset.justAnexar, files);
    if (n) Toast.success(n === 1 ? 'Arquivo anexado.' : n + ' arquivos anexados.');
    this.carregarJustificativas();
  });
  Util.on(el, 'click', '[data-anexo-del]', (e, t) => {
    Modal.confirm('Remover arquivo', 'Remover este arquivo do pedido?', async () => { if (await this.removerAnexo(t.dataset.anexoDel)) { Toast.success('Arquivo removido.'); this.carregarJustificativas(); } }, 'Remover');
  });
  Util.on(el, 'click', '[data-just-cancelar]', (e, t) => {
    Modal.confirm('Retirar pedido', 'Retirar este pedido de justificativa? Os arquivos anexados também serão apagados.', async () => {
      const res = await apiPost(DB.API + 'justifications.php', { action: 'cancel', id: t.dataset.justCancelar });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) { Toast.error(d.error || 'Não foi possível retirar.'); return; }
      Toast.success('Pedido retirado.'); this.carregarJustificativas();
    }, 'Retirar');
  });
  Util.on(el, 'click', '[data-just-decidir]', (e, t) => this.modalDecidirJustificativa(t.dataset.justDecidir, t.dataset.decisao));
  this.carregarJustificativas();
};

App.carregarJustificativas = async function () {
  const box = document.getElementById('just-lista'); if (!box) return;
  try {
    const res = await fetch(DB.API + 'justifications.php', { credentials: 'include' });
    if (sessionLost(res)) return;
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'erro');
    this.just.items = d.items;
  } catch (e) { if (box.isConnected) box.innerHTML = '<div class="empty"><p>Não foi possível carregar os pedidos.</p></div>'; return; }
  this.renderJustificativas();
  if (typeof this.updateMsgBadge === 'function') this.updateMsgBadge();
};

App.renderJustificativas = function () {
  const box = document.getElementById('just-lista'); if (!box) return;
  const u = Auth.currentUser, staff = ['diretor', 'coordenador'].includes(u.role);
  const list = this.just.items.filter(j => !this.just.filter || j.status === this.just.filter);
  if (!list.length) { box.innerHTML = this.emptyState('clipboard', 'Nenhum pedido', this.just.filter === 'pendente' ? 'Nada aguardando resposta.' : 'Ainda não há pedidos de justificativa.'); return; }
  box.innerHTML = list.map(j => {
    const mine = j.createdBy === u.id;
    const canCancel = staff || (mine && j.status === 'pendente');
    const canAttach = (staff || (mine && j.status === 'pendente')) && j.attachments.length < 3;
    return '<div class="card mb-16 just-card" data-id="' + Util.esc(j.id) + '"><div class="card-body">' +
      '<div class="flex items-center justify-between gap-12 mb-8" style="flex-wrap:wrap;"><div><strong>' + Util.esc(j.studentName) + '</strong> <span class="text-muted text-sm">' + Util.esc(j.className) + '</span>' +
      '<div class="text-sm mono">' + this.justPeriod(j) + '</div></div>' + this.justStatusBadge(j.status) + '</div>' +
      '<p class="just-reason">' + Util.esc(j.reason) + '</p>' +
      '<div class="text-muted text-sm">Pedido de ' + Util.esc(j.createdByName || '—') + ' em ' + Util.esc(this.auditDateTime(j.createdAt)) + '</div>' +
      (j.status !== 'pendente' ? '<div class="text-sm mt-8"><strong>' + (j.status === 'aceita' ? 'Aceita' : 'Recusada') + '</strong> por ' + Util.esc(j.reviewedByName || '—') + (j.reviewNote ? ' — ' + Util.esc(j.reviewNote) : '') + '</div>' : '') +
      (j.attachments.length || canAttach ? '<div class="anexos mt-8">' + j.attachments.map(a => this.anexoChip(a, canCancel && (staff || j.status === 'pendente'))).join('') +
        (canAttach ? '<button type="button" class="btn btn-ghost btn-sm" data-just-anexar="' + Util.esc(j.id) + '">' + Icons.paperclip + ' Anexar atestado</button>' : '') + '</div>' : '') +
      '<div class="flex gap-8 mt-12" style="flex-wrap:wrap;">' +
      (staff && j.status === 'pendente' ? '<button type="button" class="btn btn-primary btn-sm" data-just-decidir="' + Util.esc(j.id) + '" data-decisao="aceita">Aceitar</button><button type="button" class="btn btn-secondary btn-sm" data-just-decidir="' + Util.esc(j.id) + '" data-decisao="recusada">Recusar</button>' : '') +
      (canCancel ? '<button type="button" class="btn btn-ghost btn-sm" data-just-cancelar="' + Util.esc(j.id) + '">Retirar pedido</button>' : '') + '</div></div></div>';
  }).join('');
};

App.modalDecidirJustificativa = function (id, decisao) {
  const j = this.just.items.find(x => x.id === id); if (!j) return;
  const aceitar = decisao === 'aceita';
  Modal.open({
    title: aceitar ? 'Aceitar justificativa' : 'Recusar justificativa', icon: Icons.clipboard,
    body: '<p class="text-sm text-muted mb-16">' + (aceitar ? 'As faltas de <strong>' + Util.esc(j.studentName) + '</strong> em ' + Util.esc(this.justPeriod(j)) + ' passam a "Justificada" (e as que forem lançadas depois nesse período também). A família recebe um aviso por e-mail.' : 'Nada muda nas faltas. A família recebe um aviso por e-mail.') + '</p>' +
      '<div class="field-group"><label>Observação para a família (opcional)</label><input type="text" id="just-nota" maxlength="255" placeholder="' + (aceitar ? 'Ex.: atestado conferido' : 'Ex.: falta o atestado') + '"></div>',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn ' + (aceitar ? 'btn-primary' : 'btn-danger') + '" data-ok>' + (aceitar ? 'Aceitar' : 'Recusar') + '</button>',
    onMount: (bd, close) => bd.querySelector('[data-ok]').addEventListener('click', async () => {
      const btn = bd.querySelector('[data-ok]'); btn.disabled = true;
      const res = await apiPost(DB.API + 'justifications.php', { action: 'review', id, decision: decisao, note: bd.querySelector('#just-nota').value });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) { Toast.error(d.error || 'Não foi possível responder.'); btn.disabled = false; return; }
      close();
      Toast.success(aceitar ? (d.absencesJustified ? d.absencesJustified + ' falta(s) justificada(s).' : 'Justificativa aceita.') : 'Justificativa recusada.');
      await DB.load(); this.carregarJustificativas();
    })
  });
};

App.modalNovaJustificativa = function () {
  const u = Auth.currentUser;
  const staff = ['diretor', 'coordenador'].includes(u.role);
  const students = staff ? DB.state.students.filter(s => s.status === 'Ativo').sort((a, b) => a.name.localeCompare(b.name))
    : u.role === 'responsavel' ? this.myChildren() : [this.studentById(u.studentId)].filter(Boolean);
  if (!students.length) { Toast.warning('Não há aluno vinculado à sua conta.'); return; }
  const hoje = Util.todayISO();
  Modal.open({
    title: 'Nova justificativa de falta', icon: Icons.clipboard, size: 'lg',
    body: '<form id="form-just" novalidate><div class="form-grid">' +
      '<div class="field-group full"><label>Aluno <span class="req">*</span></label><select name="studentId">' + students.map(s => '<option value="' + Util.esc(s.id) + '"' + (s.id === u.studentId ? ' selected' : '') + '>' + Util.esc(s.name) + '</option>').join('') + '</select></div>' +
      '<div class="field-group"><label>Primeiro dia da falta <span class="req">*</span></label><input type="date" name="dateFrom" value="' + hoje + '"></div>' +
      '<div class="field-group"><label>Último dia <span class="req">*</span></label><input type="date" name="dateTo" value="' + hoje + '"></div>' +
      '<div class="field-group full"><label>Motivo <span class="req">*</span></label><textarea name="reason" maxlength="1000" rows="3" placeholder="Ex.: consulta médica, doença..."></textarea></div>' +
      '<div class="field-group full"><label>Atestado ou comprovante (opcional, até 3 arquivos de 5 MB: PDF, imagem, Word...)</label><input type="file" name="arquivos" multiple accept="' + ANEXO_ACCEPT + '"></div>' +
      '</div></form>',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>Enviar pedido</button>',
    onMount: (bd, close) => bd.querySelector('[data-save]').addEventListener('click', async () => {
      const f = bd.querySelector('#form-just'), btn = bd.querySelector('[data-save]');
      const files = Array.from(f.arquivos.files).slice(0, 3);
      if (!f.reason.value.trim()) { Toast.error('Explique o motivo.'); return; }
      for (const file of files) { const p = this.validarArquivo(file); if (p) { Toast.error(p); return; } }
      btn.disabled = true;
      const res = await apiPost(DB.API + 'justifications.php', { action: 'create', studentId: f.studentId.value, dateFrom: f.dateFrom.value, dateTo: f.dateTo.value, reason: f.reason.value });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) { Toast.error(d.error || 'Não foi possível enviar.'); btn.disabled = false; return; }
      const enviados = await this.enviarAnexos('justification', d.id, files);
      close();
      Toast.success('Pedido enviado.' + (files.length && enviados < files.length ? ' Alguns arquivos não foram anexados; anexe-os no pedido.' : ''));
      this.carregarJustificativas();
    })
  });
};
