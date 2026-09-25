'use strict';

// Excel (.xlsx) export, built in the browser with no library: an .xlsx is a zip of small XML files, and
// the zip only needs "stored" (uncompressed) entries. What gets exported is what DB.state already holds for the
// logged-in person, so nobody exports more than they can see on screen.

const Xlsx = {
  crcTable: null,
  crc32(bytes) {
    if (!this.crcTable) {
      this.crcTable = new Uint32Array(256);
      for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; this.crcTable[n] = c >>> 0; }
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) crc = this.crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  },
  // files: [{ name, data: string|Uint8Array }] -> Uint8Array of a zip with stored entries
  zip(files) {
    const enc = new TextEncoder();
    const parts = [], central = [];
    let offset = 0;
    const u16 = n => [n & 0xFF, (n >>> 8) & 0xFF];
    const u32 = n => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];
    files.forEach(f => {
      const name = enc.encode(f.name);
      const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = this.crc32(data);
      // fixed timestamp 2020-01-01 00:00 (the format needs one; nobody reads it)
      const time = [0, 0], date = u16(((2020 - 1980) << 9) | (1 << 5) | 1);
      const local = [0x50, 0x4B, 0x03, 0x04, ...u16(20), ...u16(0x0800), ...u16(0), ...time, ...date, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0)];
      parts.push(Uint8Array.from(local), name, data);
      central.push(Uint8Array.from([0x50, 0x4B, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...time, ...date, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
      offset += local.length + name.length + data.length;
    });
    const centralSize = central.reduce((s, p) => s + p.length, 0);
    const end = Uint8Array.from([0x50, 0x4B, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(centralSize), ...u32(offset), ...u16(0)]);
    const all = parts.concat(central, [end]);
    const out = new Uint8Array(all.reduce((s, p) => s + p.length, 0));
    let pos = 0; all.forEach(p => { out.set(p, pos); pos += p.length; });
    return out;
  },
  // XML 1.0 forbids most control characters; a stray one in a name would make Excel call the file corrupt.
  esc(s) {
    return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
  colName(i) { let s = ''; for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s; return s; },
  sheetName(name, used) {
    let n = String(name).replace(/[\[\]:*?\/\\]/g, ' ').trim().slice(0, 31) || 'Planilha';
    let base = n, k = 2;
    while (used.includes(n.toLowerCase())) n = base.slice(0, 31 - String(k).length - 1) + ' ' + k++;
    used.push(n.toLowerCase());
    return n;
  },
  // 'YYYY-MM-DD' -> Excel serial day number (1900 system)
  serial(iso) {
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000);
  },
  // cell values: string, number, null/'' (empty) or { date: 'YYYY-MM-DD' }
  cell(v, ref, style) {
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'object' && v.date) { const n = this.serial(v.date); return n === null ? '' : '<c r="' + ref + '" s="2"><v>' + n + '</v></c>'; }
    if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + (style ? ' s="' + style + '"' : '') + '><v>' + v + '</v></c>';
    return '<c r="' + ref + '" t="inlineStr"' + (style ? ' s="' + style + '"' : '') + '><is><t xml:space="preserve">' + this.esc(v) + '</t></is></c>';
  },
  sheetXml(sheet) {
    const cols = sheet.columns.length;
    const widths = sheet.columns.map((c, i) => {
      let w = Math.max(String(c.header).length, ...sheet.rows.slice(0, 200).map(r => { const v = r[i]; return v && typeof v === 'object' ? 10 : String(v === null || v === undefined ? '' : v).length; }));
      return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + Math.min(Math.max(w + 2, 8), 60) + '" customWidth="1"/>';
    }).join('');
    let x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>' + widths + '</cols><sheetData>';
    x += '<row r="1">' + sheet.columns.map((c, i) => this.cell(String(c.header), this.colName(i) + '1', 1)).join('') + '</row>';
    sheet.rows.forEach((r, ri) => {
      x += '<row r="' + (ri + 2) + '">' + sheet.columns.map((c, i) => this.cell(r[i], this.colName(i) + (ri + 2))).join('') + '</row>';
    });
    x += '</sheetData>' + (sheet.rows.length ? '<autoFilter ref="A1:' + this.colName(cols - 1) + (sheet.rows.length + 1) + '"/>' : '') + '</worksheet>';
    return x;
  },
  // sheets: [{ name, columns: [{ header }], rows: [[cell, ...]] }]
  build(sheets) {
    const used = [];
    const named = sheets.map(s => Object.assign({}, s, { name: this.sheetName(s.name, used) }));
    const files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + named.map((s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + named.map((s, i) => '<sheet name="' + this.esc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + named.map((s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rId' + (named.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      // style 0 = normal, 1 = bold header on a light fill, 2 = date dd/mm/yyyy
      { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDBEAFE"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>' }
    ].concat(named.map((s, i) => ({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: this.sheetXml(s) })));
    return new Blob([this.zip(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },
  download(filename, sheets) {
    const blob = this.build(sheets);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return blob;
  }
};

// ---------------------------------------------------------------------------
// The export buttons and what each one writes
// ---------------------------------------------------------------------------

App.exportName = function (base) {
  const y = this.activeYear && this.activeYear();
  return (base + (y ? ' ' + y.name : '') + ' ' + Util.todayISO()).replace(/[^\p{L}\p{N} _.-]/gu, '').replace(/\s+/g, '_') + '.xlsx';
};

App.botaoExportar = function (container, fn) {
  if (!container) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn btn-secondary btn-sm'; b.dataset.exportar = '1';
  b.textContent = 'Exportar Excel';
  b.addEventListener('click', async () => { try { await fn(); } catch (e) { console.error(e); Toast.error('Não foi possível gerar o arquivo.'); } });
  container.appendChild(b);
};

// Adds the button to the first card header of a view once it has rendered.
App.comExportacao = function (view, fn) {
  const orig = this.views[view];
  this.views[view] = function (el) {
    orig.call(this, el);
    const head = el.querySelector('.card-header');
    if (!head) return;
    const host = head.querySelector('.flex') || head;
    this.botaoExportar(host, () => fn.call(this));
  };
};

App.className = function (id) { const c = this.classById(id); return c ? c.name : ''; };
App.subjectName = function (id) { const s = this.subjectById(id); return s ? s.name : ''; };
App.studentName = function (id) { const s = this.studentById(id); return s ? s.name : ''; };

App.exportarAlunos = function () {
  const list = this.alunosFiltrados();
  Xlsx.download(this.exportName('Alunos'), [{
    name: 'Alunos',
    columns: ['Nome', 'Matrícula', 'Turma', 'Curso', 'Turno', 'Situação', 'E-mail', 'Telefone', 'Nascimento', 'Responsável', 'Telefone do responsável'].map(h => ({ header: h })),
    rows: list.map(s => [s.name, s.matricula, this.className(s.classId), s.course, s.period, s.status, s.email, s.phone, s.birth ? { date: s.birth } : '', s.guardian, s.guardianPhone])
  }]);
};

App.exportarNotas = function () {
  const students = DB.state.students.slice().sort((a, b) => a.name.localeCompare(b.name));
  const grades = DB.state.grades.slice().sort((a, b) => this.studentName(a.studentId).localeCompare(this.studentName(b.studentId)) || (a.bimestre || '').localeCompare(b.bimestre || ''));
  const detail = {
    name: 'Notas',
    columns: ['Aluno', 'Matrícula', 'Turma', 'Disciplina', 'Bimestre', 'Avaliação', 'Nota', 'Peso', 'Data'].map(h => ({ header: h })),
    rows: grades.map(g => { const s = this.studentById(g.studentId); return [s ? s.name : '', s ? s.matricula : '', s ? this.className(s.classId) : '', this.subjectName(g.subjectId), g.bimestre, g.assessment, Number(g.value), Number(g.weight) || 1, g.date ? { date: g.date } : '']; })
  };
  const cols = BIMESTRES;
  const summary = { name: 'Médias', columns: ['Aluno', 'Matrícula', 'Turma', 'Disciplina'].concat(cols, ['Média final']).map(h => ({ header: h })), rows: [] };
  students.forEach(s => {
    const mine = DB.state.grades.filter(g => g.studentId === s.id);
    const bySubject = {}; mine.forEach(g => { (bySubject[g.subjectId] = bySubject[g.subjectId] || []).push(g); });
    Object.keys(bySubject).sort((a, b) => this.subjectName(a).localeCompare(this.subjectName(b))).forEach(id => {
      const list = bySubject[id];
      const r = (v) => Math.round(v * 100) / 100;
      summary.rows.push([s.name, s.matricula, this.className(s.classId), this.subjectName(id)]
        .concat(cols.map(b => { const l = list.filter(g => g.bimestre === b); return l.length ? r(this.gradesAverage(l)) : ''; }), [r(this.gradesAverage(list))]));
    });
  });
  Xlsx.download(this.exportName('Notas'), [summary, detail]);
};

App.exportarFrequencia = function () {
  const list = this.frequenciaFiltrada();
  const ids = new Set(list.map(s => s.id));
  const resumo = {
    name: 'Resumo',
    columns: ['Aluno', 'Matrícula', 'Turma', 'Aulas', 'Presenças', 'Faltas', 'Justificadas', 'Frequência (%)'].map(h => ({ header: h })),
    rows: list.map(s => { const a = this.attendanceStats(s.id); return [s.name, s.matricula, this.className(s.classId), a.total, a.pres, a.faltas, a.just, a.total ? Math.round(a.freq * 10) / 10 : '']; })
  };
  const detalhe = {
    name: 'Chamadas',
    columns: ['Data', 'Aluno', 'Turma', 'Disciplina', 'Situação'].map(h => ({ header: h })),
    rows: DB.state.attendance.filter(a => ids.has(a.studentId)).sort((a, b) => (a.date || '').localeCompare(b.date || '') || this.studentName(a.studentId).localeCompare(this.studentName(b.studentId)))
      .map(a => [a.date ? { date: a.date } : '', this.studentName(a.studentId), this.className(a.classId), this.subjectName(a.subjectId), a.status])
  };
  Xlsx.download(this.exportName('Frequencia'), [resumo, detalhe]);
};

App.exportarOcorrencias = function () {
  const list = this.ocorrenciasVisiveis();
  Xlsx.download(this.exportName('Ocorrencias'), [{
    name: 'Ocorrências',
    columns: ['Data', 'Aluno', 'Turma', 'Categoria', 'Descrição', 'Situação'].map(h => ({ header: h })),
    rows: list.map(o => { const s = this.studentById(o.studentId); return [o.date ? { date: o.date } : '', s ? s.name : '', s ? this.className(s.classId) : '', o.category, o.description, o.situation]; })
  }]);
};

App.exportarAno = function (yearId) {
  const y = this.yearById(yearId);
  const list = (DB.state.enrollments || []).filter(e => e.yearId === yearId).sort((a, b) => a.className.localeCompare(b.className) || a.studentName.localeCompare(b.studentName));
  Xlsx.download(('Historico ' + (y ? y.name : '') + ' ' + Util.todayISO()).replace(/[^\p{L}\p{N} _.-]/gu, '').replace(/\s+/g, '_') + '.xlsx', [{
    name: 'Histórico',
    columns: ['Aluno', 'Turma', 'Média', 'Frequência (%)', 'Resultado', 'Destino'].map(h => ({ header: h })),
    rows: list.map(e => [e.studentName, e.className, e.average === null ? '' : e.average, e.frequency === null ? '' : e.frequency, e.result, e.decision])
  }]);
};

App.exportarAuditoria = async function () {
  const res = await fetch(DB.API + 'audit.php?' + this.auditQuery({ export: 1 }), { credentials: 'include' });
  if (sessionLost(res)) return;
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || 'erro');
  const flat = det => det ? Object.keys(det).map(k => (AUDIT_FIELDS[k] || k) + ': ' + (Array.isArray(det[k]) ? this.auditValue(k, det[k][0]) + ' → ' + this.auditValue(k, det[k][1]) : this.auditValue(k, det[k]))).join('; ') : '';
  Xlsx.download(this.exportName('Auditoria'), [{
    name: 'Auditoria',
    columns: ['Quando', 'Quem', 'Papel', 'Ação', 'Onde', 'Registro', 'Detalhes', 'IP'].map(h => ({ header: h })),
    rows: d.rows.map(r => [this.auditDateTime(r.created_at), r.user_name || '', r.user_role ? Util.roleLabel(r.user_role) : '', AUDIT_ACTIONS[r.action] || r.action, AUDIT_ENTITIES[r.entity] || r.entity, r.label || '', flat(r.details), r.ip || ''])
  }]);
  if (d.total > d.rows.length) Toast.warning('Exportadas as ' + d.rows.length + ' linhas mais recentes de ' + d.total + '. Use os filtros para ver as outras.');
};

// Which screens get a button (the buttons that already sit in a header are joined by it).
App.comExportacao('alunos', function () { return this.exportarAlunos(); });
App.comExportacao('notas', function () { return this.exportarNotas(); });
App.comExportacao('frequencia', function () { return this.exportarFrequencia(); });
App.comExportacao('ocorrencias', function () { return this.exportarOcorrencias(); });
