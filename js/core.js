'use strict';

const MIN_PASSWORD = 8;
const MIN_PASSWORD_MSG = 'A senha deve ter no mínimo ' + MIN_PASSWORD + ' caracteres.';
const LOGO_IMG = '<img src="logo2.0-quadrada.png" alt="Portal of Future" class="logo-img">';

// POST helper: every state-changing request needs this header (api/config.php checks
// it) so a cross-site form or fetch() can't reach those endpoints — see that file for why.
function apiPost(url, body) {
  return fetch(url, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'PortalOfFuture' },
    body: body === undefined ? undefined : JSON.stringify(body)
  }).then(res => { sessionLost(res); return res; });
}

// A 401 while somebody is logged in means the session is gone (it expired, or was ended
// elsewhere). Without this, what they were saving just failed with "Não autenticado" and
// the screen stayed as if nothing had happened.
function sessionLost(res) {
  if (res.status !== 401 || !Auth.currentUser || sessionLost.fired) return false;
  sessionLost.fired = true;
  Toast.error('Sua sessão expirou. Entre novamente.');
  setTimeout(() => location.reload(), 2000);
  return true;
}

const Icons = {
  dashboard: '<svg class="ico" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  users: '<svg class="ico" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  student: '<svg class="ico" viewBox="0 0 24 24"><path d="M22 10v6"/><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  teacher: '<svg class="ico" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  building: '<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01M12 6h.01M12 10h.01M12 14h.01"/></svg>',
  check: '<svg class="ico" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
  checkCircle: '<svg class="ico" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  edit: '<svg class="ico" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  clipboard: '<svg class="ico" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
  alert: '<svg class="ico" viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  megaphone: '<svg class="ico" viewBox="0 0 24 24"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
  chart: '<svg class="ico" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  user: '<svg class="ico" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  book: '<svg class="ico" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  bookOpen: '<svg class="ico" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  bell: '<svg class="ico" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  refresh: '<svg class="ico" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  search: '<svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  plus: '<svg class="ico ico-sm" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  trash: '<svg class="ico" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
  close: '<svg class="ico ico-sm" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  menu: '<svg class="ico" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  trendUp: '<svg class="ico" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  calendar: '<svg class="ico" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  clock: '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  shield: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  lock: '<svg class="ico" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  chat: '<svg class="ico" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  chevronLeft: '<svg class="ico" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
  paperclip: '<svg class="ico" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>'
};

const DB = {
  API: 'api/',
  COLLECTIONS: ['users', 'students', 'classes', 'teachers', 'subjects', 'attendance', 'grades', 'activities', 'occurrences', 'announcements', 'lessons', 'guardians', 'events'],
  state: { users: [], students: [], classes: [], teachers: [], subjects: [], attendance: [], grades: [], activities: [], occurrences: [], announcements: [], lessons: [], guardians: [], events: [], years: [], enrollments: [], activeYearId: '' },
  synced: {},
  queue: Promise.resolve(),
  async load() {
    try {
      const res = await fetch(this.API + 'state.php', { credentials: 'include' });
      if (sessionLost(res)) return;
      if (!res.ok) throw new Error('request failed');
      this.state = Object.assign(this.state, await res.json());
      this.synced = this.snapshot();
    } catch (e) { console.error(e); Toast.error('Não foi possível carregar os dados do servidor.'); }
  },
  // { collection: { id: JSON of the record } }, used to tell what changed since the last sync.
  snapshot() {
    const snap = {};
    this.COLLECTIONS.forEach(k => {
      snap[k] = {};
      (this.state[k] || []).forEach(r => { snap[k][r.id] = JSON.stringify(r); });
    });
    return snap;
  },
  // Sends only the records created, changed or removed since the last sync; the server checks each one against the user's role.
  save() {
    const now = this.snapshot();
    const changes = {};
    this.COLLECTIONS.forEach(k => {
      const before = this.synced[k] || {};
      const upsert = Object.keys(now[k]).filter(id => now[k][id] !== before[id]).map(id => JSON.parse(now[k][id]));
      const del = Object.keys(before).filter(id => !(id in now[k]));
      if (upsert.length || del.length) changes[k] = { upsert: upsert, delete: del };
    });
    // A new password is sent once and never kept in memory.
    this.state.users.forEach(u => { delete u.password; });
    this.synced = this.snapshot();
    if (!Object.keys(changes).length) return;
    this.queue = this.queue.then(async () => {
      let error = null;
      try {
        const res = await apiPost(this.API + 'sync.php', { changes: changes });
        if (res.status === 401) return; // sessionLost() already told the user and is reloading
        const d = await res.json().catch(() => ({}));
        if (!res.ok || !d.ok) error = d.error || 'Falha ao salvar no servidor.';
      } catch (e) { error = 'Falha ao salvar no servidor. Verifique sua conexão.'; }
      if (error) {
        // The screen already shows the change; reload so it matches what the server kept.
        Toast.error(error);
        await this.load();
        App.navigate(App.currentView);
      }
    });
  },
  async reset(password) {
    try {
      const res = await apiPost(this.API + 'reset.php', { password });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) { Toast.error(d.error || 'Não foi possível resetar o sistema.'); return; }
    } catch (e) { Toast.error('Falha de conexão. Nada foi apagado.'); return; }
    location.reload();
  },
  id(p) { return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
};

const Auth = {
  currentUser: null,
  async isFirstUser() {
    try {
      const res = await fetch(DB.API + 'bootstrap.php', { credentials: 'include' });
      const d = await res.json();
      return !!d.isFirstUser;
    } catch (e) { return false; }
  },
  async login(email, password) {
    try {
      const res = await apiPost(DB.API + 'login.php', { email, password });
      const d = await res.json();
      if (!d.ok) return { ok: false, error: d.error || 'E-mail ou senha inválidos.' };
      this.currentUser = d.user;
      return { ok: true, user: d.user };
    } catch (e) { return { ok: false, error: 'Não foi possível conectar ao servidor.' }; }
  },
  async register(data) {
    try {
      const res = await apiPost(DB.API + 'register.php', data);
      const d = await res.json();
      if (!d.ok) return { ok: false, error: d.error || 'Não foi possível criar o administrador.' };
      return { ok: true, user: d.user };
    } catch (e) { return { ok: false, error: 'Não foi possível conectar ao servidor.' }; }
  },
  async signup(data) {
    try {
      const res = await apiPost(DB.API + 'signup.php', data);
      const d = await res.json();
      if (!d.ok) return { ok: false, error: d.error || 'Não foi possível enviar o cadastro.' };
      return { ok: true };
    } catch (e) { return { ok: false, error: 'Não foi possível conectar ao servidor.' }; }
  },
  async logout() {
    this.currentUser = null;
    try { await apiPost(DB.API + 'logout.php'); } catch (e) {}
  },
  async restore() {
    try {
      const res = await fetch(DB.API + 'session.php', { credentials: 'include' });
      const d = await res.json();
      if (d.user) { this.currentUser = d.user; return d.user; }
    } catch (e) {}
    return null;
  },
  async verifyPassword(password) {
    try {
      const res = await apiPost(DB.API + 'verify_password.php', { password });
      const d = await res.json();
      return !!d.ok;
    } catch (e) { return false; }
  },
  async forgotPassword(email) {
    try {
      const res = await apiPost(DB.API + 'forgot_password.php', { email });
      const d = await res.json();
      return { ok: !!d.ok, message: d.message || d.error || 'Não foi possível enviar o link.' };
    } catch (e) { return { ok: false, message: 'Não foi possível conectar ao servidor.' }; }
  },
  async resetPassword(token, password) {
    try {
      const res = await apiPost(DB.API + 'reset_password.php', { token, password });
      const d = await res.json();
      if (!d.ok) return { ok: false, error: d.error || 'Não foi possível redefinir a senha.' };
      if (d.user) this.currentUser = d.user;
      return { ok: true, user: d.user || null, message: d.message || null };
    } catch (e) { return { ok: false, error: 'Não foi possível conectar ao servidor.' }; }
  },
  isAdmin() { return this.currentUser && this.currentUser.role === 'diretor'; }
};

const Util = {
  fmtDate(iso) { if (!iso) return '—'; const p = String(iso).slice(0, 10).split('-'); if (p.length !== 3) return Util.esc(iso); return Util.esc(p[2]) + '/' + Util.esc(p[1]) + '/' + Util.esc(p[0]); },
  fmtDateLong(iso) {
    if (!iso) return '—';
    // "2026-09-23" must be read as that day here, not as midnight UTC (which is the
    // evening of the 22nd in Brazil, so the date used to show one day early).
    const p = String(iso).slice(0, 10).split('-').map(Number);
    const d = p.length === 3 && !p.some(isNaN) ? new Date(p[0], p[1] - 1, p[2]) : new Date(iso);
    if (isNaN(d)) return Util.esc(iso);
    const m = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    return d.getDate() + ' de ' + m[d.getMonth()] + ' de ' + d.getFullYear();
  },
  // Today in the user's own time zone (toISOString() is UTC, which is already tomorrow after 21h in Brazil).
  todayISO() { const d = new Date(); return Util.isoDate(d.getFullYear(), d.getMonth(), d.getDate()); },
  // month is 0-based, like Date
  isoDate(y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); },
  esc(s) { if (s === null || s === undefined) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); },
  initials(n) { if (!n) return '?'; const p = String(n).trim().split(/\s+/); if (p.length === 1) return p[0].slice(0, 2).toUpperCase(); return (p[0][0] + p[p.length - 1][0]).toUpperCase(); },
  colorFor(s) {
    const pal = [
      'linear-gradient(135deg,#1e40af,#3b82f6)',
      'linear-gradient(135deg,#fbbf24,#fcd34d)',
      'linear-gradient(135deg,#1e3a8a,#2563eb)',
      'linear-gradient(135deg,#f59e0b,#fbbf24)',
      'linear-gradient(135deg,#2563eb,#60a5fa)',
      'linear-gradient(135deg,#d97706,#f59e0b)',
      'linear-gradient(135deg,#3730a3,#4f46e5)',
      'linear-gradient(135deg,#fcd34d,#fde68a)'
    ];
    let h = 0; const str = String(s || '');
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return pal[h % pal.length];
  },
  avg(a) { return a && a.length ? a.reduce((x, y) => x + Number(y || 0), 0) / a.length : 0; },
  fmtNum(n, d) { d = d === undefined ? 1 : d; if (isNaN(n)) return '0'; return Number(n).toFixed(d).replace('.', ','); },
  notaBadge(m) { return m >= 7 ? 'green' : m >= 5 ? 'amber' : 'red'; },
  statusClass(s) {
    const map = { 'Ativo':'green','Inativo':'gray','Transferido':'amber','Concluído':'blue','Presente':'green','Falta':'red','Justificada':'amber','Disponível':'blue','Em andamento':'amber','Encerrada':'gray','Registrada':'amber','Positiva':'green','Resolvida':'blue' };
    return map[s] || 'gray';
  },
  roleLabel(r) { return { diretor:'Diretor(a)', coordenador:'Coordenador(a)', professor:'Professor(a)', aluno:'Aluno(a)', responsavel:'Responsável' }[r] || r; },
  on(el, evt, sel, fn) { el.addEventListener(evt, e => { const t = e.target.closest(sel); if (t && el.contains(t)) fn.call(t, e, t); }); },
  debounce(fn, wait) { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), wait); }; },
  // Lowercase, no accents, letters and digits only: "Data de Nascimento" -> "datadenascimento".
  slug(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); },
  // CSV -> [{ line, cells }]. Handles a BOM, quoted fields (with commas, doubled quotes
  // and line breaks inside), CRLF, and picks ; , or tab from the header line, since
  // Excel in Portuguese saves CSV with ";". Blank lines are dropped; `line` is the
  // number of the line in the file, for error messages.
  parseCsv(text) {
    text = String(text).replace(/^\uFEFF/, ''); // BOM
    const head = text.split(/\r?\n/, 1)[0];
    const count = ch => head.split(ch).length - 1;
    const delim = [';', ',', '\t'].sort((a, b) => count(b) - count(a))[0];
    const rows = [];
    let cells = [], field = '', inQ = false, line = 1, start = 1;
    const endRow = () => { cells.push(field); if (cells.some(c => c.trim() !== '')) rows.push({ line: start, cells: cells }); cells = []; field = ''; start = line; };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '\n') line++;
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else if (c === '"') inQ = true;
      else if (c === delim) { cells.push(field); field = ''; }
      else if (c === '\n') endRow();
      else if (c === '\r') { if (text[i + 1] === '\n') continue; endRow(); }
      else field += c;
    }
    if (field !== '' || cells.length) endRow();
    return rows;
  }
};

const Toast = {
  el: null, timer: null,
  init() { this.el = document.getElementById('toast'); },
  show(msg, type) {
    if (!this.el) return;
    this.el.className = 'toast';
    if (type) this.el.classList.add(type);
    this.el.textContent = msg;
    void this.el.offsetWidth;
    this.el.classList.add('show');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.el.classList.remove('show'), 3400);
  },
  success(m) { this.show(m, 'success'); }, error(m) { this.show(m, 'error'); },
  warning(m) { this.show(m, 'warning'); }, info(m) { this.show(m); }
};

const Modal = {
  open(opts) {
    opts = opts || {};
    const bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    const size = opts.size === 'lg' ? ' modal-lg' : '';
    bd.innerHTML = '<div class="modal' + size + '"><div class="modal-header"><h3>' + (opts.icon || '') + Util.esc(opts.title || '') + '</h3><button type="button" class="close" data-close>' + Icons.close + '</button></div><div class="modal-body">' + (opts.body || '') + '</div>' + (opts.footer ? '<div class="modal-footer">' + opts.footer + '</div>' : '') + '</div>';
    document.body.appendChild(bd);
    const onKeydown = e => { if (e.key === 'Escape') close(); };
    const close = () => { bd.style.opacity = '0'; setTimeout(() => { if (bd.parentNode) bd.parentNode.removeChild(bd); }, 200); document.removeEventListener('keydown', onKeydown); if (opts.onClose) opts.onClose(); };
    bd.addEventListener('click', e => { if (e.target === bd) close(); if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKeydown);
    if (opts.onMount) opts.onMount(bd, close);
  },
  confirm(title, message, onConfirm, label) {
    Modal.open({
      title: title, icon: Icons.alert,
      body: '<p style="font-size:14px;line-height:1.65;color:var(--muted);">' + Util.esc(message) + '</p>',
      footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-danger" data-confirm>' + Util.esc(label || 'Confirmar') + '</button>',
      onMount: (bd, close) => { bd.querySelector('[data-confirm]').addEventListener('click', () => { close(); onConfirm(); }); }
    });
  }
};
