'use strict';

// Attached files: class material on activities and lessons, and the certificates of justifications.
// The server checks who may add, remove or read each one and what kinds are allowed (api/attachments.php);
// this file only offers the buttons and the upload.

const ANEXO_MAX_BYTES = 5 * 1024 * 1024;
const ANEXO_EXTENSOES = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'doc', 'xls', 'ppt', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'txt', 'csv'];
const ANEXO_ACCEPT = ANEXO_EXTENSOES.map(e => '.' + e).join(',');

App.fmtBytes = function (n) {
  return n >= 1048576 ? Util.fmtNum(n / 1048576, 1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
};

App.anexosDe = function (type, id) {
  return (DB.state.attachments || []).filter(a => a.ownerType === type && a.ownerId === id);
};

// Whether the logged-in person may add or remove files on this activity/lesson (the server decides again).
App.podeAnexar = function (rec) {
  const r = Auth.currentUser.role;
  if (r === 'diretor' || r === 'coordenador') return true;
  return r === 'professor' && DB.state.classes.some(c => c.id === rec.classId);
};

// One file as a link that downloads it (the browser sends the session cookie along).
App.anexoChip = function (a, canDelete) {
  const inline = /\.(pdf|png|jpe?g|gif|webp)$/i.test(a.name) ? '&inline=1' : '';
  return '<span class="anexo-chip"><a href="' + DB.API + 'attachments.php?action=download&id=' + encodeURIComponent(a.id) + inline + '" target="_blank" rel="noopener" title="Abrir ' + Util.esc(a.name) + '">' +
    Icons.paperclip + '<span>' + Util.esc(a.name) + '</span><em>' + this.fmtBytes(a.size) + '</em></a>' +
    (canDelete ? '<button type="button" class="anexo-x" data-anexo-del="' + Util.esc(a.id) + '" title="Remover" aria-label="Remover ' + Util.esc(a.name) + '">&times;</button>' : '') + '</span>';
};

// Chips plus the "Anexar" button, for an activity or a lesson.
App.anexosHtml = function (type, rec) {
  const canEdit = this.podeAnexar(rec);
  const list = this.anexosDe(type, rec.id);
  if (!list.length && !canEdit) return '';
  return '<div class="anexos">' + list.map(a => this.anexoChip(a, canEdit)).join('') +
    (canEdit ? '<button type="button" class="btn btn-ghost btn-sm" data-anexar="' + type + ':' + Util.esc(rec.id) + '">' + Icons.paperclip + ' Anexar</button>' : '') + '</div>';
};

// Validates on this side too, so a 40 MB video is refused before it travels.
App.validarArquivo = function (file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ANEXO_EXTENSOES.includes(ext)) return 'Tipo não permitido (' + file.name + '). Aceitos: ' + ANEXO_EXTENSOES.join(', ') + '.';
  if (file.size === 0) return file.name + ' está vazio.';
  if (file.size > ANEXO_MAX_BYTES) return file.name + ' passa de 5 MB.';
  return null;
};

App.enviarAnexo = async function (type, id, file) {
  const problema = this.validarArquivo(file);
  if (problema) throw new Error(problema);
  const res = await fetch(DB.API + 'attachments.php?action=upload&ownerType=' + encodeURIComponent(type) + '&ownerId=' + encodeURIComponent(id) + '&name=' + encodeURIComponent(file.name), {
    method: 'POST', credentials: 'include',
    headers: { 'X-Requested-With': 'PortalOfFuture', 'Content-Type': file.type || 'application/octet-stream' }, body: file
  });
  sessionLost(res);
  const d = await res.json().catch(() => ({}));
  if (!res.ok || !d.ok) throw new Error(d.error || 'Não foi possível enviar ' + file.name + '.');
  if (type !== 'justification') { DB.state.attachments = (DB.state.attachments || []).concat([d.attachment]); }
  return d.attachment;
};

// Sends several files in order; returns how many went through and toasts each refusal.
App.enviarAnexos = async function (type, id, files) {
  let ok = 0;
  for (const f of files) {
    try { await this.enviarAnexo(type, id, f); ok++; } catch (e) { Toast.error(e.message); }
  }
  return ok;
};

App.escolherArquivos = function (multiple) {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = !!multiple; input.accept = ANEXO_ACCEPT;
    input.addEventListener('change', () => resolve(Array.from(input.files)));
    input.addEventListener('cancel', () => resolve([]));
    input.click();
  });
};

App.removerAnexo = async function (id) {
  const res = await apiPost(DB.API + 'attachments.php', { action: 'delete', id });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || !d.ok) { Toast.error(d.error || 'Não foi possível remover.'); return false; }
  DB.state.attachments = (DB.state.attachments || []).filter(a => a.id !== id);
  return true;
};

// Delegated buttons for a view that shows chips from anexosHtml(); redraw() repaints what it shows.
App.bindAnexos = function (el, redraw) {
  Util.on(el, 'click', '[data-anexar]', async (e, t) => {
    const [type, id] = t.dataset.anexar.split(':');
    const files = await this.escolherArquivos(true);
    if (!files.length) return;
    t.disabled = true;
    const n = await this.enviarAnexos(type, id, files);
    if (n) Toast.success(n === 1 ? 'Arquivo anexado.' : n + ' arquivos anexados.');
    redraw();
  });
  Util.on(el, 'click', '[data-anexo-del]', (e, t) => {
    const a = (DB.state.attachments || []).find(x => x.id === t.dataset.anexoDel);
    if (!a) return;
    Modal.confirm('Remover arquivo', 'Remover "' + a.name + '"? Quem tem acesso deixará de vê-lo.', async () => { if (await this.removerAnexo(a.id)) { Toast.success('Arquivo removido.'); redraw(); } }, 'Remover');
  });
};
