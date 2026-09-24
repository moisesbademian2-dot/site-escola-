'use strict';

const LOGO_IMG = '<img src="logo2.0-quadrada.png" alt="Portal of Future" class="logo-img">';

// POST helper: every state-changing request needs this header (api/config.php checks
// it) so a cross-site form or fetch() can't reach those endpoints — see that file for why.
function apiPost(url, body) {
  return fetch(url, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'PortalOfFuture' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
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
  clock: '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  shield: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  lock: '<svg class="ico" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
};

const DB = {
  API: 'api/',
  COLLECTIONS: ['users', 'students', 'classes', 'teachers', 'subjects', 'attendance', 'grades', 'activities', 'occurrences', 'announcements', 'lessons', 'guardians'],
  state: { users: [], students: [], classes: [], teachers: [], subjects: [], attendance: [], grades: [], activities: [], occurrences: [], announcements: [], lessons: [], guardians: [] },
  synced: {},
  queue: Promise.resolve(),
  async load() {
    try {
      const res = await fetch(this.API + 'state.php', { credentials: 'include' });
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
  reset() {
    apiPost(this.API + 'reset.php').finally(() => location.reload());
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
    const d = new Date(iso); if (isNaN(d)) return Util.esc(iso);
    const m = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    return d.getDate() + ' de ' + m[d.getMonth()] + ' de ' + d.getFullYear();
  },
  todayISO() { return new Date().toISOString().slice(0, 10); },
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
  slug(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); },
  // CSV -> [{ line, cells }]. Handles a BOM, quoted fields (with commas, doubled quotes
  // and line breaks inside), CRLF, and picks ; , or tab from the header line, since
  // Excel in Portuguese saves CSV with ";". Blank lines are dropped; `line` is the
  // number of the line in the file, for error messages.
  parseCsv(text) {
    text = String(text).replace(/^﻿/, '');
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

const BIMESTRES = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

const MENUS = {
  diretor: [
    { group: 'Visão Geral', items: [ { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' }, { id: 'relatorios', icon: 'chart', label: 'Relatórios' } ]},
    { group: 'Administração', items: [ { id: 'admin', icon: 'shield', label: 'Painel Admin' }, { id: 'usuarios', icon: 'users', label: 'Usuários' } ]},
    { group: 'Instituição', items: [ { id: 'turmas', icon: 'building', label: 'Turmas' }, { id: 'professores', icon: 'teacher', label: 'Professores' }, { id: 'alunos', icon: 'student', label: 'Alunos' }, { id: 'disciplinas', icon: 'bookOpen', label: 'Disciplinas' } ]},
    { group: 'Acompanhamento', items: [ { id: 'diario', icon: 'book', label: 'Diário de Classe' }, { id: 'frequencia', icon: 'checkCircle', label: 'Frequência' }, { id: 'notas', icon: 'edit', label: 'Notas' }, { id: 'ocorrencias', icon: 'alert', label: 'Ocorrências' }, { id: 'comunicados', icon: 'megaphone', label: 'Comunicados' } ]}
  ],
  coordenador: [
    { group: 'Painel', items: [{ id: 'dashboard', icon: 'dashboard', label: 'Dashboard' }]},
    { group: 'Gestão', items: [ { id: 'alunos', icon: 'student', label: 'Alunos' }, { id: 'turmas', icon: 'building', label: 'Turmas' }, { id: 'professores', icon: 'teacher', label: 'Professores' }, { id: 'disciplinas', icon: 'bookOpen', label: 'Disciplinas' } ]},
    { group: 'Acompanhamento', items: [ { id: 'diario', icon: 'book', label: 'Diário de Classe' }, { id: 'notas', icon: 'edit', label: 'Notas' }, { id: 'frequencia', icon: 'checkCircle', label: 'Frequência' }, { id: 'ocorrencias', icon: 'alert', label: 'Ocorrências' }, { id: 'comunicados', icon: 'megaphone', label: 'Comunicados' }, { id: 'relatorios', icon: 'chart', label: 'Relatórios' } ]}
  ],
  professor: [
    { group: 'Painel', items: [ { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' }, { id: 'minhas-turmas', icon: 'building', label: 'Minhas Turmas' } ]},
    { group: 'Diário de Classe', items: [ { id: 'diario', icon: 'book', label: 'Diário' }, { id: 'frequencia', icon: 'checkCircle', label: 'Frequência' }, { id: 'notas', icon: 'edit', label: 'Notas' }, { id: 'conteudos', icon: 'bookOpen', label: 'Conteúdos' } ]},
    { group: 'Extras', items: [ { id: 'atividades', icon: 'clipboard', label: 'Atividades' }, { id: 'ocorrencias', icon: 'alert', label: 'Ocorrências' }, { id: 'comunicados', icon: 'megaphone', label: 'Comunicados' } ]}
  ],
  aluno: [
    { group: 'Meu Portal', items: [ { id: 'dashboard', icon: 'dashboard', label: 'Início' }, { id: 'minhas-notas', icon: 'edit', label: 'Minhas Notas' }, { id: 'minha-frequencia', icon: 'checkCircle', label: 'Minha Frequência' } ]},
    { group: 'Escola', items: [ { id: 'atividades', icon: 'clipboard', label: 'Atividades' }, { id: 'comunicados', icon: 'megaphone', label: 'Comunicados' }, { id: 'ocorrencias', icon: 'alert', label: 'Ocorrências' }, { id: 'perfil', icon: 'user', label: 'Meu Perfil' } ]}
  ],
  responsavel: [
    { group: 'Acompanhamento', items: [ { id: 'dashboard', icon: 'dashboard', label: 'Início' }, { id: 'minhas-notas', icon: 'edit', label: 'Notas' }, { id: 'minha-frequencia', icon: 'checkCircle', label: 'Frequência' } ]},
    { group: 'Escola', items: [ { id: 'atividades', icon: 'clipboard', label: 'Atividades' }, { id: 'comunicados', icon: 'megaphone', label: 'Comunicados' }, { id: 'ocorrencias', icon: 'alert', label: 'Ocorrências' }, { id: 'perfil', icon: 'user', label: 'Perfil do Aluno' } ]}
  ]
};

const App = {
  currentView: 'dashboard',
  async init() {
    Toast.init();
    this.bindAuth();
    this.bindShell();
    const resetToken = new URLSearchParams(location.search).get('reset');
    if (resetToken) { this.showAuthForm('reset-form'); return; }
    await this.refreshAuthUI();
    const restored = await Auth.restore();
    if (restored) { await DB.load(); this.startApp(); }
  },
  // Shows one of the auth-screen forms and hides the rest (and the "first setup" badge,
  // except on setup-form itself).
  showAuthForm(id) {
    ['login-form', 'signup-form', 'setup-form', 'forgot-form', 'reset-form'].forEach(f => {
      document.getElementById(f).classList.toggle('hidden', f !== id);
    });
    document.getElementById('setup-notice').classList.toggle('hidden', id !== 'setup-form');
  },
  async refreshAuthUI() {
    const first = await Auth.isFirstUser();
    this.showAuthForm(first ? 'setup-form' : 'login-form');
  },
  bindAuth() {
    let coursesLoaded = false;
    const loadCourses = async () => {
      if (coursesLoaded) return;
      coursesLoaded = true;
      try {
        const res = await fetch(DB.API + 'public_courses.php');
        const d = await res.json();
        const sel = document.getElementById('signup-curso');
        (d.courses || []).forEach(c => { sel.insertAdjacentHTML('beforeend', '<option value="' + Util.esc(c) + '">' + Util.esc(c) + '</option>'); });
      } catch (e) {}
    };
    const syncSignupFields = () => {
      const role = document.getElementById('signup-role').value;
      document.getElementById('signup-matricula-field').classList.toggle('hidden', role !== 'responsavel');
      document.getElementById('signup-curso-field').classList.toggle('hidden', role !== 'aluno');
      document.getElementById('signup-turno-field').classList.toggle('hidden', role !== 'aluno');
    };
    document.getElementById('link-to-signup').addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('login-form').classList.add('hidden');
      document.getElementById('signup-form').classList.remove('hidden');
      loadCourses();
      syncSignupFields();
    });
    document.getElementById('link-to-login').addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('signup-form').classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
    });
    document.getElementById('link-to-forgot').addEventListener('click', e => {
      e.preventDefault();
      this.showAuthForm('forgot-form');
    });
    document.getElementById('link-to-login-from-forgot').addEventListener('click', e => {
      e.preventDefault();
      this.showAuthForm('login-form');
    });
    document.getElementById('forgot-form').addEventListener('submit', async e => {
      e.preventDefault();
      const msg = document.getElementById('forgot-msg');
      msg.classList.remove('show');
      const email = document.getElementById('forgot-email').value.trim();
      if (!email) { msg.textContent = 'Informe o e-mail.'; msg.className = 'auth-msg error show'; return; }
      const btn = document.querySelector('#forgot-form button[type=submit]');
      btn.disabled = true;
      const r = await Auth.forgotPassword(email);
      btn.disabled = false;
      msg.textContent = r.message;
      msg.className = 'auth-msg ' + (r.ok ? 'success' : 'error') + ' show';
      if (r.ok) document.getElementById('forgot-form').reset();
    });
    document.getElementById('reset-form').addEventListener('submit', async e => {
      e.preventDefault();
      const msg = document.getElementById('reset-msg');
      msg.classList.remove('show');
      const senha = document.getElementById('reset-senha').value;
      const senha2 = document.getElementById('reset-senha2').value;
      if (senha.length < 4) { msg.textContent = 'A senha deve ter no mínimo 4 caracteres.'; msg.className = 'auth-msg error show'; return; }
      if (senha !== senha2) { msg.textContent = 'As senhas não coincidem.'; msg.className = 'auth-msg error show'; return; }
      const token = new URLSearchParams(location.search).get('reset') || '';
      const btn = document.querySelector('#reset-form button[type=submit]');
      btn.disabled = true;
      const r = await Auth.resetPassword(token, senha);
      btn.disabled = false;
      if (!r.ok) { msg.textContent = r.error; msg.className = 'auth-msg error show'; return; }
      history.replaceState(null, '', location.pathname + location.hash); // drop ?reset=... from the URL
      if (r.user) {
        Toast.success('Senha redefinida! Bem-vindo(a), ' + r.user.name.split(' ')[0] + '.');
        await DB.load();
        this.startApp();
      } else {
        msg.textContent = r.message || 'Senha redefinida.';
        msg.className = 'auth-msg success show';
        setTimeout(() => this.showAuthForm('login-form'), 2600);
      }
    });
    document.getElementById('signup-role').addEventListener('change', syncSignupFields);
    document.getElementById('signup-form').addEventListener('submit', async e => {
      e.preventDefault();
      const msg = document.getElementById('signup-msg');
      msg.classList.remove('show');
      const role = document.getElementById('signup-role').value;
      const name = document.getElementById('signup-nome').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const celular = document.getElementById('signup-celular').value.trim();
      const senha = document.getElementById('signup-senha').value;
      const matricula = document.getElementById('signup-matricula').value.trim();
      const curso = document.getElementById('signup-curso').value;
      const turno = document.getElementById('signup-turno').value;
      if (!name || !email || !celular || !senha) { msg.textContent = 'Preencha todos os campos obrigatórios.'; msg.className = 'auth-msg error show'; return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = 'Informe um e-mail válido.'; msg.className = 'auth-msg error show'; return; }
      if (senha.length < 4) { msg.textContent = 'A senha deve ter no mínimo 4 caracteres.'; msg.className = 'auth-msg error show'; return; }
      if (role === 'aluno' && (!curso || !turno)) { msg.textContent = 'Selecione o curso e o turno.'; msg.className = 'auth-msg error show'; return; }
      const r = await Auth.signup({ role, name, email, celular, password: senha, matricula, curso, turno });
      if (!r.ok) { msg.textContent = r.error; msg.className = 'auth-msg error show'; return; }
      msg.textContent = 'Cadastro enviado! Aguarde a aprovação do diretor para conseguir entrar.';
      msg.className = 'auth-msg success show';
      document.getElementById('signup-form').reset();
      setTimeout(() => {
        document.getElementById('signup-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
        syncSignupFields();
      }, 2200);
    });
    document.getElementById('login-form').addEventListener('submit', async e => {
      e.preventDefault();
      const msg = document.getElementById('login-msg');
      msg.classList.remove('show');
      const email = document.getElementById('login-email').value.trim();
      const senha = document.getElementById('login-senha').value;
      if (!email || !senha) { msg.textContent = 'Preencha e-mail e senha para continuar.'; msg.className = 'auth-msg error show'; return; }
      const r = await Auth.login(email, senha);
      if (!r.ok) { msg.textContent = r.error; msg.className = 'auth-msg error show'; return; }
      Toast.success('Bem-vindo(a), ' + r.user.name.split(' ')[0] + '!');
      await DB.load();
      this.startApp();
    });
    document.getElementById('setup-form').addEventListener('submit', async e => {
      e.preventDefault();
      const msg = document.getElementById('setup-msg');
      msg.classList.remove('show');
      const name = document.getElementById('setup-nome').value.trim();
      const email = document.getElementById('setup-email').value.trim();
      const senha = document.getElementById('setup-senha').value;
      const senha2 = document.getElementById('setup-senha2').value;
      if (!name || !email || !senha || !senha2) { msg.textContent = 'Preencha todos os campos para criar o administrador.'; msg.className = 'auth-msg error show'; return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = 'Informe um e-mail válido.'; msg.className = 'auth-msg error show'; return; }
      if (senha.length < 4) { msg.textContent = 'A senha deve ter no mínimo 4 caracteres.'; msg.className = 'auth-msg error show'; return; }
      if (senha !== senha2) { msg.textContent = 'As senhas não coincidem.'; msg.className = 'auth-msg error show'; return; }
      const r = await Auth.register({ name, email, role: 'diretor', password: senha });
      if (!r.ok) { msg.textContent = r.error; msg.className = 'auth-msg error show'; return; }
      msg.textContent = 'Administrador criado com sucesso!';
      msg.className = 'auth-msg success show';
      document.getElementById('setup-form').reset();
      setTimeout(async () => {
        await this.refreshAuthUI();
        document.getElementById('login-email').value = email;
        document.getElementById('login-senha').value = senha;
        document.getElementById('login-senha').focus();
      }, 900);
    });
  },
  startApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    this.ensureActiveChild();
    this.buildSidebar();
    this.buildTopbar();
    this.navigate('dashboard');
  },
  // Every child linked to the logged-in responsável, sorted by name. Empty for
  // any other role.
  myChildren() {
    const u = Auth.currentUser;
    if (!u || u.role !== 'responsavel') return [];
    return DB.state.guardians.filter(g => g.userId === u.id)
      .map(g => this.studentById(g.studentId)).filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  // A responsável can have more than one child, but the rest of the app (dashboard,
  // Minhas Notas, Minha Frequência, Atividades, Ocorrências, Perfil) was written
  // around a single Auth.currentUser.studentId — same as it already is for aluno,
  // which really does have exactly one. So this keeps studentId pointing at
  // whichever child is currently "active", switchable from the sidebar, instead of
  // rewriting every one of those screens to juggle a list.
  ensureActiveChild() {
    const u = Auth.currentUser;
    if (!u || u.role !== 'responsavel') return;
    const kids = this.myChildren();
    if (!kids.find(s => s.id === u.studentId)) u.studentId = kids.length ? kids[0].id : '';
  },
  bindShell() {
    document.getElementById('overlay').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('overlay').classList.add('hidden');
    });
  },
  buildSidebar() {
    const u = Auth.currentUser;
    const menu = MENUS[u.role] || [];
    const sb = document.getElementById('sidebar');
    let nav = '';
    let idx = 0;
    menu.forEach(g => {
      nav += '<div class="nav-group-title">' + Util.esc(g.group) + '</div>';
      g.items.forEach(it => {
        idx++;
        nav += '<button type="button" class="nav-item" data-view="' + Util.esc(it.id) + '" style="animation-delay:' + (0.25 + idx * 0.04) + 's">' +
          Icons[it.icon] + '<span>' + Util.esc(it.label) + '</span></button>';
      });
    });
    const kids = this.myChildren();
    const switcher = kids.length > 1
      ? '<div style="padding:0 20px 16px;"><label style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;">Acompanhando</label><select id="child-switcher" style="width:100%;">' +
        kids.map(s => '<option value="' + Util.esc(s.id) + '"' + (s.id === u.studentId ? ' selected' : '') + '>' + Util.esc(s.name) + '</option>').join('') + '</select></div>'
      : '';
    sb.innerHTML =
      '<div class="sidebar-header"><div class="logo">' + LOGO_IMG + '</div></div>' +
      '<nav class="sidebar-nav">' + nav + '</nav>' +
      switcher +
      '<div class="sidebar-footer">' +
        '<div class="avatar">' + Util.esc(u.avatar || Util.initials(u.name)) + '</div>' +
        '<div class="uinfo">' +
          '<strong>' + Util.esc(u.name) + '</strong>' +
          '<span>' + Util.roleLabel(u.role) + '</span>' +
        '</div>' +
      '</div>';
    sb.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigate(btn.dataset.view);
        if (window.innerWidth <= 820) {
          sb.classList.remove('open');
          document.getElementById('overlay').classList.add('hidden');
        }
      });
    });
    const switcherSel = document.getElementById('child-switcher');
    if (switcherSel) switcherSel.addEventListener('change', () => {
      u.studentId = switcherSel.value;
      this.navigate(this.currentView);
    });
  },
  buildTopbar() {
    const tb = document.getElementById('topbar');
    tb.innerHTML =
      '<div class="topbar-inner">' +
        '<button type="button" class="menu-toggle" id="menu-toggle">' + Icons.menu + '</button>' +
        '<div class="page-title" id="page-title">Dashboard<small>Visão geral</small></div>' +
        '<div class="topbar-actions">' +
          '<button type="button" class="icon-btn" id="btn-notif" title="Notificações">' + Icons.bell + '<span class="dot"></span></button>' +
          '<button type="button" class="icon-btn" id="btn-refresh" title="Recarregar">' + Icons.refresh + '</button>' +
          '<button type="button" class="btn btn-secondary btn-sm" id="btn-logout">Sair</button>' +
        '</div>' +
      '</div>';
    document.getElementById('menu-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('overlay').classList.toggle('hidden');
    });
    document.getElementById('btn-logout').addEventListener('click', () => {
      Modal.confirm('Encerrar sessão', 'Deseja realmente sair do sistema?', async () => { await Auth.logout(); location.reload(); }, 'Sair');
    });
    document.getElementById('btn-refresh').addEventListener('click', async () => { await DB.load(); this.ensureActiveChild(); this.buildSidebar(); this.navigate(this.currentView); Toast.info('Dados recarregados.'); });
    document.getElementById('btn-notif').addEventListener('click', () => this.showNotifications());
  },
  setTitle(t, s) { const el = document.getElementById('page-title'); if (!el) return; el.innerHTML = Util.esc(t) + (s ? '<small>' + Util.esc(s) + '</small>' : ''); },
  navigate(view) {
    if (!view) return;
    this.currentView = view;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    // Views bind delegated listeners with Util.on(el, ...) directly on this
    // container. Clearing innerHTML alone doesn't drop those (they're on el
    // itself, not its children), so re-rendering the same view twice would
    // double-fire every row action. Cloning drops them; nothing else keeps a
    // reference to the old node, since this is the only place #view is looked up.
    const old = document.getElementById('view');
    const el = old.cloneNode(false);
    old.replaceWith(el);
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    try {
      const fn = this.views[view];
      if (typeof fn === 'function') fn.call(this, el);
      else el.innerHTML = '<div class="empty"><div class="empty-icon">' + Icons.alert + '</div><h4>Tela em construção</h4></div>';
    } catch (err) { console.error(err); el.innerHTML = '<div class="empty"><p>Erro: ' + Util.esc(err.message) + '</p></div>'; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  showNotifications() {
    const list = DB.state.announcements.slice(-5).reverse();
    let html = '<div class="timeline">';
    if (!list.length) html += '<p class="text-muted">Nenhuma notificação no momento.</p>';
    else list.forEach(a => { html += '<div class="timeline-item"><div class="t-title">' + Util.esc(a.title) + '</div><div class="t-time">' + Util.fmtDate(a.date) + ' · ' + Util.esc(a.author) + '</div><div class="t-desc">' + Util.esc(a.message.slice(0, 140)) + (a.message.length > 140 ? '…' : '') + '</div></div>'; });
    html += '</div>';
    Modal.open({ title: 'Notificações', icon: Icons.bell, body: html, footer: '<button type="button" class="btn btn-primary" data-close>Fechar</button>' });
  },
  studentById(id) { return DB.state.students.find(s => s.id === id); },
  classById(id) { return DB.state.classes.find(c => c.id === id); },
  teacherById(id) { return DB.state.teachers.find(t => t.id === id); },
  subjectById(id) { return DB.state.subjects.find(s => s.id === id); },
  userById(id) { return DB.state.users.find(u => u.id === id); },
  studentsOfClass(cid) { return DB.state.students.filter(s => s.classId === cid && s.status === 'Ativo'); },
  attendanceStats(sid) {
    const r = DB.state.attendance.filter(a => a.studentId === sid);
    const total = r.length;
    const pres = r.filter(a => a.status === 'Presente').length;
    const just = r.filter(a => a.status === 'Justificada').length;
    const faltas = r.filter(a => a.status === 'Falta').length;
    return { total, pres, just, faltas, freq: total ? ((pres + just * 0.5) / total) * 100 : 0 };
  },
  // Average of a set of grades: notes are first averaged (weighted) within each
  // bimestre, then those bimestre averages are averaged into one final number.
  // A grade with no bimestre set (from before that field existed) falls into its
  // own "Sem bimestre" bucket, so it still counts as one bucket rather than being
  // dropped or silently merged into whichever bimestre happens to be filtered.
  gradesAverage(list) {
    if (!list.length) return 0;
    const byBim = {};
    list.forEach(g => { const b = g.bimestre || 'Sem bimestre'; (byBim[b] = byBim[b] || []).push(g); });
    const bimAvgs = Object.values(byBim).map(bl => {
      const tw = bl.reduce((s, x) => s + (Number(x.weight) || 1), 0) || 1;
      return bl.reduce((s, x) => s + Number(x.value) * (Number(x.weight) || 1), 0) / tw;
    });
    return Util.avg(bimAvgs);
  },
  // Overall average: the mean of each subject's own average, so a subject counts
  // once however many assessments it has (and it matches the report card, whose
  // last column is exactly those per-subject averages).
  overallAverage(list) {
    if (!list.length) return 0;
    const bySub = {};
    list.forEach(g => { (bySub[g.subjectId || ''] = bySub[g.subjectId || ''] || []).push(g); });
    return Util.avg(Object.values(bySub).map(l => this.gradesAverage(l)));
  },
  averageOf(sid) { return this.overallAverage(DB.state.grades.filter(x => x.studentId === sid)); },
  averagesBySubject(sid) {
    const map = {};
    DB.state.grades.filter(g => g.studentId === sid).forEach(g => {
      const s = this.subjectById(g.subjectId);
      const k = s ? s.name : g.subjectId;
      (map[k] = map[k] || []).push(g);
    });
    const o = {}; Object.keys(map).forEach(k => o[k] = this.gradesAverage(map[k]));
    return o;
  },
  classAverage(cid) {
    const sts = this.studentsOfClass(cid); if (!sts.length) return 0;
    const m = sts.map(s => this.averageOf(s.id)).filter(x => x > 0);
    return m.length ? Util.avg(m) : 0;
  },
  validateForm(form) {
    let ok = true;
    form.querySelectorAll('.field-group').forEach(g => g.classList.remove('invalid'));
    form.querySelectorAll('[required]').forEach(i => { const g = i.closest('.field-group'); if (!i.value.trim()) { if (g) g.classList.add('invalid'); ok = false; } });
    return ok;
  },
  emptyState(iconName, title, message) {
    return '<div class="empty"><div class="empty-icon">' + (Icons[iconName] || Icons.alert) + '</div><h4>' + Util.esc(title) + '</h4><p>' + Util.esc(message) + '</p></div>';
  },
  statCard(iconName, color, label, value) {
    return '<div class="stat-card"><div class="stat-icon ' + color + '">' + Icons[iconName] + '</div><div class="stat-info"><div class="label">' + Util.esc(label) + '</div><div class="value">' + Util.esc(String(value)) + '</div></div></div>';
  },
  views: {}
};

App.views.dashboard = function (el) {
  const u = Auth.currentUser;
  if (u.role === 'diretor') return this.dashboardDiretor(el);
  if (u.role === 'coordenador') return this.dashboardCoordenador(el);
  if (u.role === 'professor') return this.dashboardProfessor(el);
  if (u.role === 'aluno') return this.dashboardAluno(el);
  if (u.role === 'responsavel') return this.dashboardResponsavel(el);
};

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
  const m = DB.state.students.filter(s => s.status === 'Ativo').map(s => this.averageOf(s.id)).filter(x => x > 0);
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
  const m = DB.state.students.filter(s => s.status === 'Ativo').map(s => this.averageOf(s.id)).filter(x => x > 0);
  const media = m.length ? Util.avg(m) : 0;
  const risky = DB.state.students.filter(s => s.status === 'Ativo').map(s => ({ s, st: this.attendanceStats(s.id) })).filter(o => o.st.freq < 85 && o.st.total > 0).sort((a, b) => a.st.freq - b.st.freq).slice(0, 5);
  const low = DB.state.students.filter(s => s.status === 'Ativo').map(s => ({ s, m: this.averageOf(s.id) })).filter(o => o.m > 0 && o.m < 6).sort((a, b) => a.m - b.m).slice(0, 5);
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
  this.renderAlunosTable();
  document.getElementById('busca-aluno').addEventListener('input', Util.debounce(() => this.renderAlunosTable(), 200));
  document.getElementById('filtro-turma').addEventListener('change', () => this.renderAlunosTable());
  document.getElementById('filtro-situacao').addEventListener('change', () => this.renderAlunosTable());
  if (canEdit) {
    document.getElementById('btn-novo-aluno').addEventListener('click', () => this.modalAluno());
    document.getElementById('btn-importar-alunos').addEventListener('click', () => this.modalImportarAlunos());
  }
};

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
  Util.on(ct, 'click', '[data-ver]', (e, t) => this.verAluno(t.dataset.ver));
  if (canEdit) {
    Util.on(ct, 'click', '[data-edit]', (e, t) => this.modalAluno(t.dataset.edit));
    Util.on(ct, 'click', '[data-del]', (e, t) => {
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
  const step2 = () => {
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
          opts.onConfirm();
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
        step2();
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
      const contexto = u.role === 'responsavel' && u.matricula ? 'Matrícula informada: ' + u.matricula : [u.cursoPretendido, u.turnoPretendido].filter(Boolean).join(' · ');
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
    '<div class="field-group"><label>Senha ' + (editing ? '(deixe em branco para manter)' : '<span class="req">*</span>') + '</label><input type="text" name="password" ' + (editing ? '' : 'required') + ' placeholder="Mínimo 4 caracteres"><div class="err">Informe a senha.</div></div>' +
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
          if (d.password.length < 4) { Toast.error('Senha deve ter pelo menos 4 caracteres.'); return; }
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
    Modal.confirm('Resetar sistema completo', 'Isso apagará TODOS os dados e voltará ao estado inicial. Você será desconectado.', () => { DB.reset(); }, 'Resetar sistema');
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

  Util.on(ct, 'click', '.att-btn', (e, t) => {
    this.setAttendanceRow(t.closest('.attendance-row'), t.dataset.sid, t.dataset.status);
    this.updateDiarioResumo();
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
    h += '<tr><td><div class="cell-user"><div class="avatar-sm" style="background:' + Util.colorFor(s.name) + '">' + Util.esc(Util.initials(s.name)) + '</div><div class="u-meta"><strong>' + Util.esc(s.name) + '</strong><span class="mono" style="font-size:11px;">' + Util.esc(s.matricula) + '</span></div></div></td><td>' + (t ? Util.esc(t.name) : '—') + '</td><td class="text-sm mono">' + g.length + '</td><td><strong class="mono" style="font-size:15px;">' + Util.fmtNum(m, 1) + '</strong></td><td><span class="badge ' + Util.notaBadge(m) + '">' + (m >= 7 ? 'Aprovado' : m >= 5 ? 'Recuperação' : m === 0 ? 'Sem nota' : 'Reprovado') + '</span></td></tr>';
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

// The report card as a self-contained document: one row per subject with each
// bimestre's average, the subject's final average, then attendance and the
// overall situation (same 7 / 5 cut-offs the Notas screen already uses).
App.boletimHtml = function (sid) {
  const s = this.studentById(sid);
  const t = this.classById(s.classId);
  const grades = DB.state.grades.filter(g => g.studentId === sid);
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
  const media = this.averageOf(sid);
  const a = this.attendanceStats(sid);
  const situacao = !grades.length ? 'Sem notas lançadas' : media >= 7 ? 'Aprovado' : media >= 5 ? 'Em recuperação' : 'Reprovado';
  return '<div class="boletim">' +
    '<div class="bol-head">' + LOGO_IMG + '<div><h1>Boletim escolar</h1><p>Portal of Future</p></div></div>' +
    '<div class="bol-info">' +
      '<div><span>Aluno(a)</span><strong>' + Util.esc(s.name) + '</strong></div>' +
      '<div><span>Matrícula</span><strong>' + Util.esc(s.matricula) + '</strong></div>' +
      '<div><span>Turma</span><strong>' + (t ? Util.esc(t.name) : '—') + '</strong></div>' +
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

App.abrirBoletim = function (sid) {
  if (!this.studentById(sid)) return;
  Modal.open({
    title: 'Boletim', icon: Icons.edit, size: 'lg',
    body: this.boletimHtml(sid),
    footer: '<button type="button" class="btn btn-secondary" data-close>Fechar</button><button type="button" class="btn btn-primary" data-print>Imprimir / Salvar em PDF</button>',
    onMount: bd => bd.querySelector('[data-print]').addEventListener('click', () => this.imprimirBoletim(sid))
  });
};

// Prints through the browser ("Salvar como PDF" in its print dialog): the report
// goes into a #boletim-print div that style.css shows alone under @media print.
App.imprimirBoletim = function (sid) {
  const box = document.createElement('div');
  box.id = 'boletim-print';
  box.innerHTML = this.boletimHtml(sid);
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
      h += '<div class="timeline-item"><div class="t-title">' + (s ? Util.esc(s.name) : 'Sem disciplina') + ' · ' + (c ? Util.esc(c.name) : '—') + '</div><div class="t-time mono">' + Util.fmtDateLong(l.date) + '</div><div class="t-desc">' + Util.esc(l.content) + (l.note ? '<br><em class="text-muted">Obs.: ' + Util.esc(l.note) + '</em>' : '') + '</div></div>';
    });
    h += '</div>';
  }
  h += '</div></div>';
  el.innerHTML = h;
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

document.addEventListener('DOMContentLoaded', () => {
  App.init().catch(e => { console.error('Erro na inicialização:', e); alert('Erro ao iniciar o sistema: ' + e.message); });
});
