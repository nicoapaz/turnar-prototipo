/* TurnAR · datos ficticios y utilidades. Todo lo que aparece acá es inventado. */
(function (w) {
  'use strict';
  const T = (w.T = {});
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- Fechas (el prototipo vive el lunes 10 de agosto de 2026) ---------- */
  T.TODAY = new Date(2026, 7, 10);
  T.NOW_MIN = 9 * 60 + 41;
  T.DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  T.MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  T.cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  T.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  T.iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  T.parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  T.diffDays = (iso) => Math.round((T.parse(iso) - T.TODAY) / 864e5);
  T.longDate = (iso) => { const d = T.parse(iso); return T.cap(T.DAYS[d.getDay()]) + ' ' + d.getDate() + ' de ' + T.MONTHS[d.getMonth()]; };
  T.dayWord = (iso) => { const d = T.parse(iso); return T.DAYS[d.getDay()]; };
  T.shortDate = (iso) => { const d = T.parse(iso); return T.cap(T.DAYS[d.getDay()]).slice(0, 3) + ' ' + d.getDate() + '/' + pad(d.getMonth() + 1); };
  T.whenWord = (iso) => { const n = T.diffDays(iso); return n === 0 ? 'hoy' : n === 1 ? 'mañana' : 'en ' + n + ' días'; };
  T.whenCap = (iso, t) => { const n = T.diffDays(iso); const w = n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : T.cap(T.dayWord(iso)) + ' ' + T.parse(iso).getDate() + '/' + pad(T.parse(iso).getMonth() + 1); return w + ', ' + t + ' hs'; };
  T.minutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  T.money = (n) => '$ ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  T.hash = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

  /* ---------- Especialidades y profesionales (inventados) ---------- */
  T.SPECS = [
    { id: 'cardio', name: 'Cardiología', ico: 'heart', docs: ['benitez', 'sosa', 'costa'] },
    { id: 'clinica', name: 'Clínica médica', ico: 'cross', docs: ['aguirre', 'roldan'] },
    { id: 'oftal', name: 'Oftalmología', ico: 'eye', docs: ['paz', 'ruiz'] },
    { id: 'img', name: 'Diagnóstico por imágenes', ico: 'scan', sub: 'Ecografía · Radiografía · Resonancia', docs: ['img'], order: true },
    { id: 'derma', name: 'Dermatología', ico: 'shield', docs: [] }
  ];
  T.DOCS = {
    benitez: { id: 'benitez', name: 'Dra. Laura Benítez', ini: 'LB', mp: '12.345', spec: 'Cardiología', room: 'Planta baja · Consultorio 4', days: [1, 3, 4] },
    sosa: { id: 'sosa', name: 'Dr. Ramiro Sosa', ini: 'RS', mp: '20.881', spec: 'Cardiología', room: 'Planta baja · Consultorio 2', days: [2, 4, 5] },
    costa: { id: 'costa', name: 'Dra. Mariela Costa', ini: 'MC', mp: '18.204', spec: 'Cardiología', room: 'Planta baja · Consultorio 3', days: [] },
    aguirre: { id: 'aguirre', name: 'Dr. Martín Aguirre', ini: 'MA', mp: '17.552', spec: 'Clínica médica', room: 'Primer piso · Consultorio 7', days: [1, 2, 3, 4, 5] },
    roldan: { id: 'roldan', name: 'Dra. Silvia Roldán', ini: 'SR', mp: '21.060', spec: 'Clínica médica', room: 'Primer piso · Consultorio 8', days: [2, 3] },
    paz: { id: 'paz', name: 'Dra. Carolina Paz', ini: 'CP', mp: '16.870', spec: 'Oftalmología', room: 'Primer piso · Consultorio 12', days: [1, 4] },
    ruiz: { id: 'ruiz', name: 'Dr. Esteban Ruiz', ini: 'ER', mp: '22.415', spec: 'Oftalmología', room: 'Primer piso · Consultorio 11', days: [3, 5] },
    img: { id: 'img', name: 'Equipo de imágenes', ini: 'DI', mp: '', spec: 'Diagnóstico por imágenes', room: 'Subsuelo · Diagnóstico por imágenes', days: [1, 2, 3, 4, 5, 6] }
  };
  T.IMG = {
    eco: { id: 'eco', name: 'Ecografía', sub: 'Hay turno', prep: 'Ayuno de 8 horas, sin comer ni tomar café. Podés tomar agua y tus medicamentos habituales. Traé el pedido original en papel el día del estudio.' },
    rx: { id: 'rx', name: 'Radiografía', sub: 'Sin preparación', prep: 'No necesitás preparación. Vení con ropa cómoda, sin cadenas ni objetos de metal. Traé el pedido original en papel.' },
    rmn: { id: 'rmn', name: 'Resonancia magnética', sub: 'Puede requerir autorización', prep: 'Avisanos si tenés marcapasos, prótesis o clips metálicos. Ayuno de 4 horas. El estudio dura entre 30 y 45 minutos. Traé el pedido original en papel.' }
  };

  /* ---------- Coberturas y precios ---------- */
  T.PART = { id: 'part', name: 'Particular', detail: 'Consulta $ 32.000 · pagás desde la app', copay: { cons: 32000, img: 48000 }, part: true };
  T.copayOf = (cov, kind) => (cov ? cov.copay[kind === 'img' ? 'img' : 'cons'] : 0);

  /* ---------- Disponibilidad (determinística: siempre da lo mismo) ---------- */
  T.AM = ['8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00'];
  T.PM = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];

  T.isBooked = (S, docId, iso, t, ignoreId) => {
    for (const pid in S.persons) for (const a of S.persons[pid].appts) {
      if (a.id !== ignoreId && a.docId === docId && a.date === iso && a.time === t) return true;
    }
    return false;
  };
  /* devuelve null si ese día no atiende, o la lista de horarios con 'free' */
  T.slotList = (S, docId, iso, ignoreId) => {
    const doc = T.DOCS[docId]; const n = T.diffDays(iso); const d = T.parse(iso);
    if (!doc || n < 0 || n > 62 || !doc.days.includes(d.getDay())) return null;
    const mk = (t, period) => {
      const past = n === 0 && T.minutes(t) < T.NOW_MIN + 20;
      const free = !past && T.hash(docId + iso + t) % 4 !== 0 && !T.isBooked(S, docId, iso, t, ignoreId);
      return { t, period, free };
    };
    const list = T.AM.map((t) => mk(t, 'am')).concat(T.PM.map((t) => mk(t, 'pm')));
    return list;
  };
  T.hasFree = (S, docId, iso, ignoreId) => { const l = T.slotList(S, docId, iso, ignoreId); return !!l && l.some((s) => s.free); };
  T.firstAvail = (S, docIds, ignoreId) => {
    for (let n = 0; n <= 62; n++) {
      const iso = T.iso(new Date(T.TODAY.getFullYear(), T.TODAY.getMonth(), T.TODAY.getDate() + n));
      for (const id of docIds) {
        const l = T.slotList(S, id, iso, ignoreId);
        const f = l && l.find((s) => s.free);
        if (f) return { docId: id, iso, t: f.t };
      }
    }
    return null;
  };

  /* ---------- Datos de demostración ---------- */
  T.seedDemo = () => ({
    maria: {
      id: 'maria', name: 'María González', ini: 'MG', rel: 'Vos', age: 52, dni: '30.112.845',
      covs: [{ id: 'osde', name: 'OSDE 210', detail: 'Afiliada 6120 4455 8899 01 · titular', copay: { cons: 4800, img: 7500 }, auth: true }],
      appts: [{ id: 'a1', docId: 'benitez', spec: 'Cardiología', date: '2026-08-12', time: '10:30', room: T.DOCS.benitez.room, covId: 'osde', copay: 4800, paid: false, confirmed: false }],
      studies: [
        { id: 'lab', name: 'Análisis de sangre', date: '5 de agosto', place: 'Laboratorio central', status: 'ready', fresh: true },
        { id: 'rx', name: 'Radiografía de tórax', date: '2 de agosto', place: 'Diagnóstico por imágenes', status: 'progress', fresh: true },
        { id: 'eco', name: 'Ecografía abdominal', date: 'Hecha el 8 de agosto', place: 'El informe llega en 48 hs', status: 'wait', fresh: false }
      ],
      pays: [], wait: []
    },
    hector: {
      id: 'hector', name: 'Héctor González', ini: 'HG', rel: 'Papá', age: 79, dni: '8.123.456',
      covs: [{ id: 'pami', name: 'PAMI', detail: 'Afiliado 1500 2233 4455 00', copay: { cons: 0, img: 0 }, auth: true }],
      appts: [{ id: 'a2', docId: 'sosa', spec: 'Cardiología', date: '2026-08-13', time: '8:00', room: T.DOCS.sosa.room, covId: 'pami', copay: 0, paid: true, confirmed: false }],
      studies: [], pays: [], wait: []
    },
    sofia: {
      id: 'sofia', name: 'Sofía González', ini: 'SG', rel: 'Hija', age: 11, dni: '55.987.654',
      covs: [{ id: 'osde', name: 'OSDE 210', detail: 'Afiliada adherente 6120 4455 8899 02', copay: { cons: 4800, img: 7500 }, auth: true }],
      appts: [], studies: [], pays: [], wait: []
    }
  });

  /* ---------- Íconos (trazos finos, 24×24) ---------- */
  const P = {
    back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>', chevl: '<path d="M15 5l-7 7 7 7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
    cross: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
    eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    scan: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 6.5v.01"/>',
    shield: '<path d="M12 3l8 3v6c0 4.6-3.2 8-8 9-4.8-1-8-4.4-8-9V6z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
    calplus: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18M12 14v5M9.5 16.5h5"/>',
    doc: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>',
    bell: '<path d="M6 9a6 6 0 0112 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 004 0"/>',
    chat: '<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1.1-4.5A8 8 0 1121 12z"/>',
    group: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><circle cx="17" cy="9" r="2.6"/><path d="M17 14.2a5.2 5.2 0 014.5 5.3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.700l1-1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    pin: '<path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    building: '<path d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 10h4a1 1 0 011 1v10M2 21h20M8 8h3M8 12h3M8 16h3"/>',
    share: '<path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5"/>',
    face: '<path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2M9 10v1.5M15 10v1.5M9.5 15c1.4 1.2 3.6 1.2 5 0"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 6.2A10 10 0 0112 6c6.4 0 10 6 10 6a17 17 0 01-3.2 3.7M6.5 7.7C3.7 9.5 2 12 2 12s3.6 6.500 10 6.500c1.600 0 3-.4 4.300-1M9.900 9.900a3 3 0 004.200 4.200"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
    text: '<path d="M4 20l5-14 5 14M6 15h6M16 9h5M18.500 9v11"/>'
  };
  T.ico = (n, s, sw) => '<svg width="' + (s || 22) + '" height="' + (s || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.7) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>';
})(window);
