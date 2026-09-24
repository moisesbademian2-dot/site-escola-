'use strict';

// ---------------------------------------------------------------------------
// Calendário: provas, eventos, feriados e reuniões (DB.state.events), mais o prazo
// de entrega das atividades, que já existiam e aparecem aqui sem cadastro extra.
// ---------------------------------------------------------------------------

const EVENT_TYPES = ['Prova', 'Evento', 'Feriado', 'Reunião'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LONGOS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const CAL_TYPE_CLASS = { 'Prova': 'prova', 'Evento': 'evento', 'Feriado': 'feriado', 'Reunião': 'reuniao', 'Atividade': 'atividade' };

App.cal = null; // { y, m (0-based), sel (ISO day), cls (class filter, '' = all) } — kept while navigating

// Who may add events: diretor and coordenador anywhere; a professor for their own classes.
App.calCanCreate = function () {
  const r = Auth.currentUser.role;
  return r === 'diretor' || r === 'coordenador' || (r === 'professor' && DB.state.classes.length > 0);
};
// ...and change them: staff any; a professor only the ones they created (the server enforces the same).
App.calCanEdit = function (ev) {
  const u = Auth.currentUser;
  return u.role === 'diretor' || u.role === 'coordenador' || (u.role === 'professor' && ev.createdBy === u.id);
};

App.calItems = function () {
  const items = [];
  DB.state.events.forEach(ev => items.push({ kind: 'event', title: ev.title, type: ev.type || 'Evento', start: ev.date, end: ev.endDate || ev.date, classId: ev.classId, ev: ev }));
  DB.state.activities.forEach(a => { if (a.dueDate) items.push({ kind: 'activity', title: a.title, type: 'Atividade', start: a.dueDate, end: a.dueDate, classId: a.classId, act: a }); });
  const cls = this.cal.cls;
  return items.filter(i => !cls || i.classId === cls || i.classId === '')
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
};

App.views.calendario = function (el) {
  this.setTitle('Calendário', 'Provas, eventos e prazos');
  if (!this.cal) { const t = Util.todayISO(); this.cal = { y: +t.slice(0, 4), m: +t.slice(5, 7) - 1, sel: t, cls: '' }; }
  const canCreate = this.calCanCreate();
  el.innerHTML =
    '<div class="card mb-24"><div class="card-header"><h3>' + Icons.calendar + ' <span id="cal-title"></span></h3>' +
      '<div class="flex gap-8" style="flex-wrap:wrap;align-items:center;">' +
        (DB.state.classes.length > 1 ? '<select id="cal-cls" style="width:auto;"><option value="">Todas as turmas</option>' + DB.state.classes.map(c => '<option value="' + Util.esc(c.id) + '"' + (this.cal.cls === c.id ? ' selected' : '') + '>' + Util.esc(c.name) + '</option>').join('') + '</select>' : '') +
        '<button type="button" class="btn btn-secondary btn-sm" id="cal-prev" aria-label="Mês anterior">‹</button>' +
        '<button type="button" class="btn btn-secondary btn-sm" id="cal-today">Hoje</button>' +
        '<button type="button" class="btn btn-secondary btn-sm" id="cal-next" aria-label="Próximo mês">›</button>' +
        (canCreate ? '<button type="button" class="btn btn-primary btn-sm" id="cal-new">' + Icons.plus + ' Novo evento</button>' : '') +
      '</div></div><div class="card-body" style="padding:0;"><div id="cal-grid"></div></div></div>' +
    '<div class="grid-2"><div class="card"><div class="card-header"><h3 id="cal-day-title"></h3></div><div class="card-body" id="cal-day"></div></div>' +
    '<div class="card"><div class="card-header"><h3>' + Icons.clock + ' Próximos</h3></div><div class="card-body" id="cal-upcoming"></div></div></div>';

  const shift = n => { const d = new Date(this.cal.y, this.cal.m + n, 1); this.cal.y = d.getFullYear(); this.cal.m = d.getMonth(); this.renderCalendario(); };
  const goTo = iso => { this.cal.sel = iso; this.cal.y = +iso.slice(0, 4); this.cal.m = +iso.slice(5, 7) - 1; this.renderCalendario(); };
  document.getElementById('cal-prev').addEventListener('click', () => shift(-1));
  document.getElementById('cal-next').addEventListener('click', () => shift(1));
  document.getElementById('cal-today').addEventListener('click', () => goTo(Util.todayISO()));
  const clsSel = document.getElementById('cal-cls');
  if (clsSel) clsSel.addEventListener('change', () => { this.cal.cls = clsSel.value; this.renderCalendario(); });
  if (canCreate) document.getElementById('cal-new').addEventListener('click', () => this.modalEvento(null, this.cal.sel));

  Util.on(el, 'click', '[data-day]', (e, t) => goTo(t.dataset.day));
  Util.on(el, 'keydown', '[data-day]', (e, t) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(t.dataset.day); } });
  Util.on(el, 'click', '[data-ev-edit]', (e, t) => this.modalEvento(t.dataset.evEdit));
  Util.on(el, 'click', '[data-ev-del]', (e, t) => {
    const ev = DB.state.events.find(x => x.id === t.dataset.evDel);
    if (!ev) return;
    Modal.confirm('Excluir evento', 'Deseja excluir "' + ev.title + '"?', () => {
      DB.state.events = DB.state.events.filter(x => x.id !== ev.id);
      DB.save(); this.navigate('calendario'); Toast.success('Evento excluído.');
    }, 'Excluir');
  });
  Util.on(el, 'click', '[data-day-new]', (e, t) => this.modalEvento(null, t.dataset.dayNew));
  this.renderCalendario();
};

App.renderCalendario = function () {
  const { y, m, sel } = this.cal;
  const items = this.calItems();
  const today = Util.todayISO();
  const onDay = iso => items.filter(i => i.start <= iso && iso <= i.end);
  document.getElementById('cal-title').textContent = MESES[m].charAt(0).toUpperCase() + MESES[m].slice(1) + ' de ' + y;

  // 6 weeks at most, starting on the Sunday on or before the 1st
  const first = new Date(y, m, 1);
  const lead = first.getDay();
  const total = Math.ceil((lead + new Date(y, m + 1, 0).getDate()) / 7) * 7;
  let h = '<div class="cal-head">' + DIAS_CURTOS.map(d => '<div>' + d + '</div>').join('') + '</div><div class="cal-grid">';
  for (let i = 0; i < total; i++) {
    const d = new Date(y, m, 1 - lead + i);
    const iso = Util.isoDate(d.getFullYear(), d.getMonth(), d.getDate());
    const its = onDay(iso);
    h += '<div class="cal-day' + (d.getMonth() !== m ? ' other' : '') + (iso === today ? ' today' : '') + (iso === sel ? ' sel' : '') + '" data-day="' + iso + '" role="button" tabindex="0" aria-label="' + d.getDate() + ' de ' + MESES[d.getMonth()] + (its.length ? ', ' + its.length + ' item(ns)' : '') + '">' +
      '<span class="cal-num">' + d.getDate() + '</span><div class="cal-items">' +
      its.slice(0, 3).map(i => '<span class="cal-chip cal-t-' + CAL_TYPE_CLASS[i.type] + '" title="' + Util.esc(i.type + ': ' + i.title) + '">' + Util.esc(i.title) + '</span>').join('') +
      (its.length > 3 ? '<span class="cal-more">+' + (its.length - 3) + ' mais</span>' : '') +
      '</div></div>';
  }
  document.getElementById('cal-grid').innerHTML = h + '</div>';

  // the selected day
  const sd = new Date(+sel.slice(0, 4), +sel.slice(5, 7) - 1, +sel.slice(8, 10));
  document.getElementById('cal-day-title').textContent = DIAS_LONGOS[sd.getDay()].charAt(0).toUpperCase() + DIAS_LONGOS[sd.getDay()].slice(1) + ', ' + Util.fmtDateLong(sel);
  const cls = id => { const c = id ? this.classById(id) : null; return c ? c.name : 'Toda a escola'; };
  const dayItems = onDay(sel);
  let dh = dayItems.length ? dayItems.map(i => {
    const ev = i.ev;
    return '<div class="cal-item"><div class="flex items-center justify-between" style="gap:8px;"><span class="badge ' + (i.type === 'Prova' ? 'red' : i.type === 'Feriado' ? 'green' : i.type === 'Atividade' ? 'amber' : 'blue') + '">' + Util.esc(i.type) + '</span>' +
      (ev && this.calCanEdit(ev) ? '<span class="actions"><button type="button" class="btn btn-secondary btn-xs" data-ev-edit="' + Util.esc(ev.id) + '">Editar</button><button type="button" class="btn btn-danger btn-xs" data-ev-del="' + Util.esc(ev.id) + '">Excluir</button></span>' : '') + '</div>' +
      '<strong style="display:block;margin-top:6px;">' + Util.esc(i.title) + '</strong>' +
      '<span class="text-xs text-muted">' + (i.start !== i.end ? Util.fmtDate(i.start) + ' a ' + Util.fmtDate(i.end) + ' · ' : '') + Util.esc(cls(i.classId)) + (i.act ? ' · entrega da atividade' + (i.act.subject ? ' de ' + Util.esc(i.act.subject) : '') : '') + '</span>' +
      ((ev && ev.description) ? '<p class="text-sm" style="margin-top:6px;white-space:pre-wrap;">' + Util.esc(ev.description) + '</p>' : '') + '</div>';
  }).join('') : '<p class="text-muted text-sm">Nada marcado para este dia.</p>';
  if (this.calCanCreate()) dh += '<button type="button" class="btn btn-secondary btn-sm mt-12" data-day-new="' + sel + '">' + Icons.plus + ' Novo evento neste dia</button>';
  document.getElementById('cal-day').innerHTML = dh;

  // what's coming (from today on, whichever month is on screen)
  const next = items.filter(i => i.end >= today).slice(0, 6);
  document.getElementById('cal-upcoming').innerHTML = next.length ? next.map(i =>
    '<div class="cal-up" data-day="' + i.start + '" role="button" tabindex="0"><span class="mono text-sm">' + Util.fmtDate(i.start) + '</span><span class="badge ' + (i.type === 'Prova' ? 'red' : i.type === 'Feriado' ? 'green' : i.type === 'Atividade' ? 'amber' : 'blue') + '">' + Util.esc(i.type) + '</span><span class="cal-up-t">' + Util.esc(i.title) + '</span></div>').join('')
    : '<p class="text-muted text-sm">Nada marcado daqui para frente.</p>';
};

App.modalEvento = function (id, date) {
  const ev = id ? DB.state.events.find(e => e.id === id) : null;
  if (id && !ev) return;
  const me = Auth.currentUser, isProf = me.role === 'professor';
  const body = '<form id="form-evento" novalidate><div class="form-grid">' +
    '<div class="field-group full"><label>Título <span class="req">*</span></label><input name="title" value="' + Util.esc(ev ? ev.title : '') + '" required placeholder="Ex: Prova de Banco de Dados"><div class="err">Informe o título.</div></div>' +
    '<div class="field-group"><label>Tipo</label><select name="type">' + EVENT_TYPES.map(t => '<option' + ((ev ? ev.type : 'Evento') === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></div>' +
    '<div class="field-group"><label>Turma' + (isProf ? ' <span class="req">*</span>' : '') + '</label><select name="classId"' + (isProf ? ' required' : '') + '>' + (isProf ? '<option value="">Selecione...</option>' : '<option value="">Toda a escola</option>') + DB.state.classes.map(c => '<option value="' + Util.esc(c.id) + '"' + (ev && ev.classId === c.id ? ' selected' : '') + '>' + Util.esc(c.name) + '</option>').join('') + '</select><div class="err">Selecione a turma.</div></div>' +
    '<div class="field-group"><label>Data <span class="req">*</span></label><input type="date" name="date" value="' + Util.esc(ev ? ev.date : (date || Util.todayISO())) + '" required><div class="err">Informe a data.</div></div>' +
    '<div class="field-group"><label>Data final (se durar mais de um dia)</label><input type="date" name="endDate" value="' + Util.esc(ev ? ev.endDate : '') + '"></div>' +
    '<div class="field-group full"><label>Descrição</label><textarea name="description">' + Util.esc(ev ? ev.description : '') + '</textarea></div>' +
    '</div></form>';
  Modal.open({
    title: ev ? 'Editar evento' : 'Novo evento', icon: Icons.calendar, body: body, size: 'lg',
    footer: '<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-primary" data-save>' + (ev ? 'Salvar' : 'Adicionar') + '</button>',
    onMount: (bd, close) => {
      const form = bd.querySelector('#form-evento');
      bd.querySelector('[data-save]').addEventListener('click', () => {
        if (!this.validateForm(form)) { Toast.error('Preencha os campos obrigatórios.'); return; }
        const d = Object.fromEntries(new FormData(form).entries());
        d.title = d.title.trim();
        if (!d.title) { Toast.error('Informe o título.'); return; }
        if (d.endDate && d.endDate < d.date) { Toast.error('A data final não pode ser antes da inicial.'); return; }
        if (ev) Object.assign(ev, d);
        else { d.id = DB.id('ev'); d.createdBy = me.id; DB.state.events.push(d); }
        this.cal = Object.assign(this.cal || {}, { sel: d.date, y: +d.date.slice(0, 4), m: +d.date.slice(5, 7) - 1 });
        DB.save(); close(); this.navigate('calendario');
        Toast.success(ev ? 'Evento atualizado.' : 'Evento adicionado.');
      });
    }
  });
};
