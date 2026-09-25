'use strict';

// Closing grades by bimestre. The server refuses grade changes in a closed bimestre whatever this
// screen does (api/sync.php); this file shows the state and lets the coordenador/diretor change it.

App.periodOf = function (bimestre) {
  return (DB.state.periods || []).find(p => p.bimestre === bimestre) || { bimestre, status: 'aberto', deadline: '', closed: false, reason: '' };
};

App.bimestreFechado = function (bimestre) { return this.periodOf(bimestre).closed; };

// A strip at the top of the Notas screen naming what is closed, so nobody types a grade in vain.
App.avisoFechamento = function () {
  const closed = BIMESTRES.filter(b => this.bimestreFechado(b));
  if (!closed.length) return '';
  return '<div class="card mb-16" style="border-left:3px solid var(--yellow);"><div class="card-body" style="padding:12px 16px;font-size:13px;">' + Icons.lock + ' <strong>Fechado para notas:</strong> ' +
    closed.map(b => Util.esc(b)).join(', ') + '. Para lançar ou corrigir, peça à coordenação para reabrir.</div></div>';
};

App.periodStatusHtml = function (p) {
  if (!p.closed) return '<span class="badge green">Aberto' + (p.deadline ? ' até ' + Util.fmtDate(p.deadline) : '') + '</span>';
  return '<span class="badge red">Fechado' + (p.reason === 'prazo' ? ' (prazo de ' + Util.fmtDate(p.deadline) + ' encerrado)' : '') + '</span>';
};

App.views.fechamento = function (el) {
  if (!['diretor', 'coordenador'].includes(Auth.currentUser.role)) { el.innerHTML = this.emptyState('lock', 'Acesso restrito', 'Somente a coordenação e o diretor fecham notas.'); return; }
  this.setTitle('Fechamento de notas', (this.activeYear() || {}).name || '');
  const rows = BIMESTRES.map(b => {
    const p = this.periodOf(b);
    const n = DB.state.grades.filter(g => g.bimestre === b).length;
    return '<tr data-bim="' + Util.esc(b) + '"><td><strong>' + Util.esc(b) + '</strong></td><td>' + this.periodStatusHtml(p) + '</td><td class="mono">' + n + '</td>' +
      '<td><div class="flex gap-8 items-center"><input type="date" data-prazo value="' + Util.esc(p.deadline) + '" min="' + Util.todayISO() + '" style="padding:7px 10px;border:1px solid var(--border-2);border-radius:var(--radius);font-size:13px;">' +
      '<button type="button" class="btn btn-secondary btn-sm" data-acao="deadline">Salvar prazo</button></div></td>' +
      '<td>' + (p.closed ? '<button type="button" class="btn btn-primary btn-sm" data-acao="reopen">Reabrir</button>' : '<button type="button" class="btn btn-danger btn-sm" data-acao="close">Fechar agora</button>') + '</td></tr>';
  }).join('');
  el.innerHTML = '<div class="card"><div class="card-header"><h3>' + Icons.lock + ' Notas por bimestre</h3></div><div class="card-body">' +
    '<p class="text-sm text-muted mb-16">Com o bimestre fechado (à mão ou porque o prazo passou), <strong>ninguém</strong> — nem o diretor — lança, altera ou apaga notas dele até que seja reaberto. ' +
    'Ao reabrir, informe até quando (ou deixe vazio para ficar aberto sem prazo).</p>' +
    '<div class="table-wrap"><table class="data"><thead><tr><th>Bimestre</th><th>Situação</th><th>Notas lançadas</th><th>Prazo para lançar</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div></div>';
  Util.on(el, 'click', '[data-acao]', (e, t) => {
    const tr = t.closest('tr');
    this.alterarPeriodo(tr.dataset.bim, t.dataset.acao, tr.querySelector('[data-prazo]').value);
  });
};

App.alterarPeriodo = async function (bimestre, action, deadline) {
  let d = {};
  try {
    const res = await apiPost(DB.API + 'periods.php', { action, bimestre, deadline });
    d = await res.json().catch(() => ({}));
    if (!res.ok || !d.ok) { Toast.error(d.error || 'Não foi possível alterar.'); return; }
  } catch (e) { Toast.error('Falha de conexão.'); return; }
  DB.state.periods = d.periods;
  Toast.success({ close: bimestre + ' fechado.', reopen: bimestre + ' reaberto.', deadline: 'Prazo salvo.' }[action]);
  this.navigate('fechamento');
};
