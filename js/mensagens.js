'use strict';

// Direct messages (api/messages.php). The server decides who can write to whom; this screen lists the
// conversations, shows one, sends, and polls for news while it is open.

App.msg = { current: null, lastId: 0, threadTimer: null, badgeTimer: null, contacts: null, threads: [] };

App.msgApi = async function (query) {
  const res = await fetch(DB.API + 'messages.php?' + query, { credentials: 'include' });
  if (sessionLost(res)) throw new Error('session');
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || 'Falha ao carregar as mensagens.');
  return d;
};

// "2026-09-25 14:03:11" (server time) -> "14:03" today, "25/09 14:03" before, "25/09/2025" older than a year
App.msgTime = function (ts) {
  const m = String(ts || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return '';
  const today = Util.todayISO();
  if (m[1] + '-' + m[2] + '-' + m[3] === today) return m[4] + ':' + m[5];
  return m[3] + '/' + m[2] + (m[1] !== today.slice(0, 4) ? '/' + m[1] : '') + ' ' + m[4] + ':' + m[5];
};

App.updateMsgBadge = async function () {
  const btn = document.querySelector('.nav-item[data-view="mensagens"]');
  if (!btn || !Auth.currentUser) return;
  try {
    const { unread } = await this.msgApi('action=unread');
    let b = btn.querySelector('.nav-badge');
    if (!unread) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('i'); b.className = 'nav-badge'; btn.appendChild(b); }
    b.textContent = unread > 99 ? '99+' : unread;
  } catch (e) { /* offline or logged out: leave the badge as it was */ }
};

// Called once after the sidebar exists; the timer only asks while the tab is visible.
App.startMsgBadge = function () {
  clearInterval(this.msg.badgeTimer);
  this.updateMsgBadge();
  this.msg.badgeTimer = setInterval(() => { if (!document.hidden && Auth.currentUser) this.updateMsgBadge(); }, 45000);
};

App.views.mensagens = function (el) {
  this.setTitle('Mensagens', 'Conversas com professores, coordenação e famílias');
  this.msg.current = null; this.msg.lastId = 0; clearInterval(this.msg.threadTimer);
  el.innerHTML = '<div class="msg-layout" id="msg-layout"><aside class="msg-side"><div class="msg-side-head"><button type="button" class="btn btn-primary btn-sm" id="msg-nova">' + Icons.plus + ' Nova conversa</button></div>' +
    '<div id="msg-list" class="msg-list"><p class="text-muted text-sm" style="padding:16px;">Carregando...</p></div></aside>' +
    '<section class="msg-main" id="msg-main"><div class="msg-empty">' + Icons.chat + '<p>Escolha uma conversa ou comece uma nova.</p></div></section></div>';
  document.getElementById('msg-nova').addEventListener('click', () => this.modalNovaConversa());
  Util.on(el, 'click', '[data-msg-abrir]', (e, t) => this.abrirConversa(t.dataset.msgAbrir));
  Util.on(el, 'click', '[data-msg-voltar]', () => { document.getElementById('msg-layout').classList.remove('show-thread'); this.msg.current = null; clearInterval(this.msg.threadTimer); this.carregarConversas(); });
  this.carregarConversas();
};

App.carregarConversas = async function () {
  const box = document.getElementById('msg-list'); if (!box) return;
  let d;
  try { d = await this.msgApi('action=threads'); }
  catch (e) { if (box.isConnected && e.message !== 'session') box.innerHTML = '<p class="text-muted text-sm" style="padding:16px;">' + Util.esc(e.message) + '</p>'; return; }
  if (!box.isConnected) return;
  this.msg.threads = d.threads;
  if (!d.threads.length) { box.innerHTML = '<p class="text-muted text-sm" style="padding:16px;">Nenhuma conversa ainda. Use "Nova conversa".</p>'; return; }
  box.innerHTML = d.threads.map(t =>
    '<button type="button" class="msg-item' + (t.otherId === this.msg.current ? ' active' : '') + '" data-msg-abrir="' + Util.esc(t.otherId) + '">' +
      '<div class="avatar-sm" style="background:' + Util.colorFor(t.otherName) + '">' + Util.esc(Util.initials(t.otherName)) + '</div>' +
      '<div class="msg-item-body"><div class="msg-item-top"><strong>' + Util.esc(t.otherName) + '</strong><span class="text-muted text-sm">' + Util.esc(this.msgTime(t.lastAt)) + '</span></div>' +
      '<div class="msg-item-last">' + (t.lastFromMe ? 'Você: ' : '') + Util.esc(t.lastBody) + '</div></div>' +
      (t.unread ? '<i class="nav-badge" style="position:static;">' + t.unread + '</i>' : '') + '</button>').join('');
};

App.bolhaHtml = function (m) {
  const mine = m.senderId === Auth.currentUser.id;
  return '<div class="msg-row ' + (mine ? 'mine' : 'theirs') + '" data-mid="' + m.id + '"><div class="msg-bubble">' + Util.esc(m.body) + '<span class="msg-time">' + Util.esc(this.msgTime(m.createdAt)) + '</span></div></div>';
};

App.abrirConversa = async function (userId) {
  const main = document.getElementById('msg-main'); if (!main) return;
  document.getElementById('msg-layout').classList.add('show-thread');
  this.msg.current = userId; this.msg.lastId = 0; clearInterval(this.msg.threadTimer);
  let d;
  try { d = await this.msgApi('action=thread&with=' + encodeURIComponent(userId)); }
  catch (e) { if (e.message !== 'session') Toast.error(e.message); document.getElementById('msg-layout').classList.remove('show-thread'); return; }
  if (this.msg.current !== userId || !main.isConnected) return;
  main.innerHTML = '<div class="msg-head"><button type="button" class="icon-btn msg-back" data-msg-voltar title="Voltar">' + Icons.chevronLeft + '</button>' +
    '<div class="avatar-sm" style="background:' + Util.colorFor(d.other.name) + '">' + Util.esc(Util.initials(d.other.name)) + '</div>' +
    '<div><strong>' + Util.esc(d.other.name) + '</strong><div class="text-muted text-sm">' + Util.esc(d.other.detail || Util.roleLabel(d.other.role)) + '</div></div></div>' +
    '<div class="msg-messages" id="msg-messages"></div>' +
    (d.canSend
      ? '<form class="msg-composer" id="msg-form"><textarea id="msg-texto" rows="2" maxlength="2000" placeholder="Escreva uma mensagem... (Enter envia, Shift+Enter quebra a linha)"></textarea><button type="submit" class="btn btn-primary" id="msg-enviar">Enviar</button></form>'
      : '<div class="msg-composer text-muted text-sm">Você não pode mais enviar mensagens para esta pessoa, mas pode reler a conversa.</div>');
  const box = document.getElementById('msg-messages');
  box.innerHTML = d.messages.length ? d.messages.map(m => this.bolhaHtml(m)).join('') : '<p class="text-muted text-sm" id="msg-vazio" style="text-align:center;margin-top:24px;">Nenhuma mensagem ainda. Diga olá!</p>';
  d.messages.forEach(m => { this.msg.lastId = Math.max(this.msg.lastId, m.id); });
  box.scrollTop = box.scrollHeight;
  const form = document.getElementById('msg-form');
  if (form) {
    const ta = document.getElementById('msg-texto');
    form.addEventListener('submit', e => { e.preventDefault(); this.enviarMensagem(userId); });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
    if (window.innerWidth > 820) ta.focus();
  }
  this.msg.threadTimer = setInterval(() => this.atualizarConversa(userId), 8000);
  this.carregarConversas(); this.updateMsgBadge();
};

App.adicionarMensagens = function (list, fromSend) {
  const box = document.getElementById('msg-messages'); if (!box || !list.length) return;
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  const vazio = document.getElementById('msg-vazio'); if (vazio) vazio.remove();
  list.forEach(m => {
    if (box.querySelector('[data-mid="' + m.id + '"]')) return;
    box.insertAdjacentHTML('beforeend', this.bolhaHtml(m));
    // My own message must not move the polling cursor: something from the other side may have arrived just before it.
    if (!fromSend) this.msg.lastId = Math.max(this.msg.lastId, m.id);
  });
  if (nearBottom || list.some(m => m.senderId === Auth.currentUser.id)) box.scrollTop = box.scrollHeight;
};

App.atualizarConversa = async function (userId) {
  const box = document.getElementById('msg-messages');
  if (!box || !box.isConnected || this.msg.current !== userId) { clearInterval(this.msg.threadTimer); return; }
  if (document.hidden) return;
  try {
    const d = await this.msgApi('action=thread&with=' + encodeURIComponent(userId) + '&after=' + this.msg.lastId);
    if (this.msg.current !== userId) return;
    if (d.messages.length) { this.adicionarMensagens(d.messages); this.carregarConversas(); this.updateMsgBadge(); }
  } catch (e) { /* the next tick tries again */ }
};

App.enviarMensagem = async function (userId) {
  const ta = document.getElementById('msg-texto'), btn = document.getElementById('msg-enviar');
  if (!ta || !ta.value.trim()) return;
  btn.disabled = true;
  try {
    const res = await apiPost(DB.API + 'messages.php', { action: 'send', to: userId, body: ta.value });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.ok) { Toast.error(d.error || 'Não foi possível enviar.'); return; }
    ta.value = '';
    if (this.msg.current === userId) this.adicionarMensagens([d.message], true);
    this.carregarConversas();
  } catch (e) { Toast.error('Falha de conexão. A mensagem não foi enviada.'); }
  finally { btn.disabled = false; ta.focus(); }
};

App.modalNovaConversa = async function () {
  let contacts;
  try { contacts = (await this.msgApi('action=contacts')).contacts; }
  catch (e) { if (e.message !== 'session') Toast.error(e.message); return; }
  const rows = q => {
    const list = contacts.filter(c => !q || (c.name + ' ' + c.detail).toLowerCase().includes(q.toLowerCase())).slice(0, 80);
    return list.length ? list.map(c => '<button type="button" class="msg-item" data-contato="' + Util.esc(c.id) + '"><div class="avatar-sm" style="background:' + Util.colorFor(c.name) + '">' + Util.esc(Util.initials(c.name)) + '</div>' +
      '<div class="msg-item-body"><strong>' + Util.esc(c.name) + '</strong><div class="msg-item-last">' + Util.esc(c.detail || Util.roleLabel(c.role)) + '</div></div></button>').join('')
      : '<p class="text-muted text-sm" style="padding:12px;">Ninguém encontrado.</p>';
  };
  Modal.open({
    title: 'Nova conversa', icon: Icons.chat,
    body: contacts.length
      ? '<div class="field-group"><input type="text" id="contato-busca" placeholder="Buscar por nome, turma ou aluno..." autocomplete="off"></div><div class="msg-picker" id="contato-lista">' + rows('') + '</div>'
      : '<p class="text-muted">Você ainda não tem com quem conversar por aqui.</p>',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button>',
    onMount: (bd, close) => {
      const lista = bd.querySelector('#contato-lista'), busca = bd.querySelector('#contato-busca');
      if (busca) { busca.focus(); busca.addEventListener('input', () => { lista.innerHTML = rows(busca.value); }); }
      if (lista) lista.addEventListener('click', e => { const b = e.target.closest('[data-contato]'); if (b) { close(); this.abrirConversa(b.dataset.contato); } });
    }
  });
};
