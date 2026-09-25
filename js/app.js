'use strict';

const BIMESTRES = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

const MENUS = {
  diretor: [
    { group: 'Visão Geral', items: [ { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' }, { id: 'calendario', icon: 'calendar', label: 'Calendário' }, { id: 'relatorios', icon: 'chart', label: 'Relatórios' } ]},
    { group: 'Administração', items: [ { id: 'admin', icon: 'shield', label: 'Painel Admin' }, { id: 'usuarios', icon: 'users', label: 'Usuários' }, { id: 'anos', icon: 'calendar', label: 'Anos letivos' }, { id: 'auditoria', icon: 'clipboard', label: 'Auditoria' } ]},
    { group: 'Instituição', items: [ { id: 'turmas', icon: 'building', label: 'Turmas' }, { id: 'professores', icon: 'teacher', label: 'Professores' }, { id: 'alunos', icon: 'student', label: 'Alunos' }, { id: 'disciplinas', icon: 'bookOpen', label: 'Disciplinas' } ]},
    { group: 'Acompanhamento', items: [ { id: 'diario', icon: 'book', label: 'Diário de Classe' }, { id: 'frequencia', icon: 'checkCircle', label: 'Frequência' }, { id: 'notas', icon: 'edit', label: 'Notas' }, { id: 'ocorrencias', icon: 'alert', label: 'Ocorrências' }, { id: 'comunicados', icon: 'megaphone', label: 'Comunicados' } ]}
  ],
  coordenador: [
    { group: 'Painel', items: [{ id: 'dashboard', icon: 'dashboard', label: 'Dashboard' }, { id: 'calendario', icon: 'calendar', label: 'Calendário' }]},
    { group: 'Gestão', items: [ { id: 'anos', icon: 'calendar', label: 'Anos letivos' }, { id: 'alunos', icon: 'student', label: 'Alunos' }, { id: 'turmas', icon: 'building', label: 'Turmas' }, { id: 'professores', icon: 'teacher', label: 'Professores' }, { id: 'disciplinas', icon: 'bookOpen', label: 'Disciplinas' } ]},
    { group: 'Acompanhamento', items: [ { id: 'diario', icon: 'book', label: 'Diário de Classe' }, { id: 'notas', icon: 'edit', label: 'Notas' }, { id: 'frequencia', icon: 'checkCircle', label: 'Frequência' }, { id: 'ocorrencias', icon: 'alert', label: 'Ocorrências' }, { id: 'comunicados', icon: 'megaphone', label: 'Comunicados' }, { id: 'relatorios', icon: 'chart', label: 'Relatórios' } ]}
  ],
  professor: [
    { group: 'Painel', items: [ { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' }, { id: 'calendario', icon: 'calendar', label: 'Calendário' }, { id: 'minhas-turmas', icon: 'building', label: 'Minhas Turmas' } ]},
    { group: 'Diário de Classe', items: [ { id: 'diario', icon: 'book', label: 'Diário' }, { id: 'frequencia', icon: 'checkCircle', label: 'Frequência' }, { id: 'notas', icon: 'edit', label: 'Notas' }, { id: 'conteudos', icon: 'bookOpen', label: 'Conteúdos' } ]},
    { group: 'Extras', items: [ { id: 'atividades', icon: 'clipboard', label: 'Atividades' }, { id: 'ocorrencias', icon: 'alert', label: 'Ocorrências' }, { id: 'comunicados', icon: 'megaphone', label: 'Comunicados' } ]}
  ],
  aluno: [
    { group: 'Meu Portal', items: [ { id: 'dashboard', icon: 'dashboard', label: 'Início' }, { id: 'calendario', icon: 'calendar', label: 'Calendário' }, { id: 'minhas-notas', icon: 'edit', label: 'Minhas Notas' }, { id: 'minha-frequencia', icon: 'checkCircle', label: 'Minha Frequência' } ]},
    { group: 'Escola', items: [ { id: 'historico', icon: 'clipboard', label: 'Histórico' }, { id: 'atividades', icon: 'clipboard', label: 'Atividades' }, { id: 'comunicados', icon: 'megaphone', label: 'Comunicados' }, { id: 'ocorrencias', icon: 'alert', label: 'Ocorrências' }, { id: 'perfil', icon: 'user', label: 'Meu Perfil' } ]}
  ],
  responsavel: [
    { group: 'Acompanhamento', items: [ { id: 'dashboard', icon: 'dashboard', label: 'Início' }, { id: 'calendario', icon: 'calendar', label: 'Calendário' }, { id: 'minhas-notas', icon: 'edit', label: 'Notas' }, { id: 'minha-frequencia', icon: 'checkCircle', label: 'Frequência' } ]},
    { group: 'Escola', items: [ { id: 'historico', icon: 'clipboard', label: 'Histórico' }, { id: 'atividades', icon: 'clipboard', label: 'Atividades' }, { id: 'comunicados', icon: 'megaphone', label: 'Comunicados' }, { id: 'ocorrencias', icon: 'alert', label: 'Ocorrências' }, { id: 'perfil', icon: 'user', label: 'Perfil do Aluno' } ]}
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
      if (senha.length < MIN_PASSWORD) { msg.textContent = MIN_PASSWORD_MSG; msg.className = 'auth-msg error show'; return; }
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
      if (senha.length < MIN_PASSWORD) { msg.textContent = MIN_PASSWORD_MSG; msg.className = 'auth-msg error show'; return; }
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
      if (senha.length < MIN_PASSWORD) { msg.textContent = MIN_PASSWORD_MSG; msg.className = 'auth-msg error show'; return; }
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
      '<div class="sidebar-footer" id="btn-minha-conta" role="button" tabindex="0" title="Minha conta" style="cursor:pointer;">' +
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
    const conta = document.getElementById('btn-minha-conta');
    conta.addEventListener('click', () => this.modalMinhaConta());
    conta.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.modalMinhaConta(); } });
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
        '<span class="badge blue year-chip" id="year-chip" title="Ano letivo em curso"></span>' +
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
    document.getElementById('btn-refresh').addEventListener('click', async () => { await DB.load(); this.ensureActiveChild(); this.buildSidebar(); this.buildTopbarYear(); this.navigate(this.currentView); Toast.info('Dados recarregados.'); });
    document.getElementById('btn-notif').addEventListener('click', () => this.showNotifications());
    this.buildTopbarYear();
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
    const list = DB.state.announcements.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id)).slice(0, 5);
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
  attendanceStats(sid) { return this.attendanceStatsOf(DB.state.attendance.filter(a => a.studentId === sid)); },
  attendanceStatsOf(r) {
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
  // A real zero is an average of 0; "no grades yet" is something else. Counting them the same hid students
  // who actually got zeros from the low-performance list and lifted the class average.
  hasGrades(sid) { return DB.state.grades.some(x => x.studentId === sid); },
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
    const m = sts.filter(s => this.hasGrades(s.id)).map(s => this.averageOf(s.id));
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
