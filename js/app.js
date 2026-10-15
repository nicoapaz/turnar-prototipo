/* TurnAR · prototipo interactivo. Estado real en memoria + localStorage. Datos ficticios. */
(function () {
  'use strict';
  const { esc, ico, money, longDate, shortDate, whenCap, whenWord, diffDays, cap } = T;
  const $ = (s) => document.querySelector(s);
  const KEY = 'turnar-proto-v2';
  const phone = $('#phone'), view = $('#view'), overlay = $('#overlay');
  let S, timers = [], lastScreen = null, cdLeft = 0, cdTimer = null;

  /* ====================== Estado ====================== */
  const fresh = () => ({
    v: 2, screen: 'welcome', stack: [], mode: 'new', cur: 'me', primary: 'me', persons: {}, ts: 1,
    reg: { phone: '', code: ['', '', '', '', '', ''], codeErr: '', name: '', dni: '', d: '', m: '', y: '', os: '', osnum: '', pass: '', pass2: '', show: false, login: false },
    bk: null, pay: null, notifs: [], set: { wa: true, push: true, email: false }, chat: [], study: null, appt: null,
    seq: 1, modal: null, toast: '', tab: 'home'
  });
  const demo = () => {
    S = fresh(); S.mode = 'demo'; S.cur = S.primary = 'maria'; S.persons = T.seedDemo(); S.screen = 'home';
    S.notifs = [
      { id: 1, t: 'Confirmá tu turno del miércoles', x: 'Cardiología con la Dra. Benítez, 10:30 hs. Confirmá tu asistencia para que no se libere.', n: true },
      { id: 2, t: 'Resultado listo: análisis de sangre', x: 'Ya podés ver tu informe en Mis estudios.', n: true },
      { id: 3, t: 'Tenés un coseguro pendiente', x: 'Pagalo desde la app y evitá la fila en recepción.', n: false }
    ];
    S.seq = 10;
  };
  const save = () => { try { const c = Object.assign({}, S, { modal: null, toast: '' }); localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} };
  const load = () => { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.v === 2 && SCREENS[j.screen]) return j; } catch (e) {} return null; };
  const wipe = () => { try { localStorage.removeItem(KEY); } catch (e) {} };
  const P = () => S.persons[S.cur];
  const me = () => S.persons[S.primary];
  const setPath = (path, val) => { const k = path.split('.'); let o = S; for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = val; };
  const notify = (t, x) => S.notifs.unshift({ id: ++S.seq, t, x, n: true });
  const uid = (p) => p + (++S.seq);
  const upcoming = (p) => p.appts.filter((a) => diffDays(a.date) >= 0).sort((a, b) => (a.date + a.time.padStart(5, '0')).localeCompare(b.date + b.time.padStart(5, '0')));
  const first = (n) => (n || '').trim().split(/\s+/)[0] || '';
  const initials = (n) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const docName = (a) => (T.DOCS[a.docId] ? T.DOCS[a.docId].name : '');
  const pending = (p) => p.appts.filter((a) => a.copay > 0 && !a.paid);

  /* ====================== Navegación ====================== */
  const go = (s, o) => { S.stack.push(S.screen); S.screen = s; if (o) Object.assign(S, o); render(); };
  const back = () => { S.screen = S.stack.pop() || 'home'; render(); };
  const root = (s) => { S.stack = []; S.screen = s; S.tab = s === 'appts' || s === 'studies' || s === 'profile' ? s.replace('appts', 'appts') : 'home'; render(); };
  const toast = (m) => { S.toast = m; showOverlay(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; showOverlay(); }, 2800); };
  const sheet = (m) => { S.modal = m; S.toast = ''; clearTimeout(toast.t); showOverlay(); };
  const closeSheet = () => { S.modal = null; showOverlay(); };

  /* ====================== Piezas ====================== */
  const hdr = (title, step, total) => '<div class="hdr"><button class="back" data-act="back" aria-label="Volver">' + ico('back', 24) + '</button><h2>' + esc(title) + '</h2>' + (step ? '<span class="step">' + step + ' de ' + total + '</span>' : '') + '</div>' + (step ? prog(step, total) : '');
  const prog = (n, t) => '<div class="prog">' + Array.from({ length: t }, (_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</div>';
  const btn = (label, act, v, cls, dis) => '<button class="btn ' + (cls || '') + '" data-act="' + act + '"' + (v != null ? ' data-v="' + esc(v) + '"' : '') + (dis ? ' disabled' : '') + '>' + label + '</button>';
  const field = (label, path, o) => { o = o || {}; const val = path.split('.').reduce((a, k) => a[k], S);
    return '<div class="field"><label class="lbl">' + label + '</label><input class="inp" id="f_' + path.replace('.', '_') + '" data-in="' + path + '" value="' + esc(val) + '"' + (o.type ? ' type="' + o.type + '"' : '') + (o.mode ? ' inputmode="' + o.mode + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.digits ? ' data-digits="1"' : '') + (o.auto ? ' autocomplete="' + o.auto + '"' : '') + '></div>'; };
  const tabs = (on) => '<nav class="tabs">' + [['home', 'Inicio', 'home'], ['appts', 'Turnos', 'cal'], ['studies', 'Estudios', 'doc'], ['profile', 'Perfil', 'user']].map((t) => '<button class="' + (on === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '">' + ico(t[2], 24) + t[1] + '</button>').join('') + '</nav>';
  const sum = (rows) => '<div class="card">' + rows.map((r) => '<div class="sumrow"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>').join('') + '</div>';
  const empty = (t) => '<div class="empty">' + t + '</div>';

  /* ====================== Validaciones ====================== */
  const digits = (s) => String(s).replace(/\D/g, '');
  const phoneOk = () => digits(S.reg.phone).length >= 10;
  const dniOk = () => { const n = digits(S.reg.dni).length; return n >= 7 && n <= 8; };
  const birth = () => { const { d, m, y } = S.reg; const D = +d, M = +m, Y = +y; if (!D || !M || String(y).length !== 4) return null; const dt = new Date(Y, M - 1, D); if (dt.getMonth() !== M - 1 || dt.getDate() !== D || dt > T.TODAY || Y < 1900) return null; let age = T.TODAY.getFullYear() - Y; if (T.TODAY < new Date(T.TODAY.getFullYear(), M - 1, D)) age--; return age; };
  const dataOk = () => S.reg.name.trim().split(/\s+/).length >= 2 && dniOk() && birth() !== null && !!S.reg.os && (S.reg.os === 'Particular' || digits(S.reg.osnum).length >= 6);
  const passScore = () => { const p = S.reg.pass; let s = 0; if (p.length >= 6) s++; if (p.length >= 9) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++; return Math.min(s, 4); };
  const passOk = () => S.reg.pass.length >= 6 && S.reg.pass === S.reg.pass2;
  const fmtDni = (s) => digits(s).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  /* ====================== Pantallas ====================== */
  const SCREENS = {};
  const NAMES = { welcome: 'Bienvenida', regContact: 'Registro · celular', regCode: 'Registro · código', regData: 'Registro · tus datos', regPass: 'Registro · contraseña', regFace: 'Registro · Face ID', regDone: 'Registro · listo', home: 'Inicio', appts: 'Mis turnos', bookSpec: 'Turno · especialidad', bookDoc: 'Turno · profesional', imgList: 'Turno · estudio', imgOrder: 'Turno · pedido médico', bookTime: 'Turno · día y horario', bookCoverage: 'Turno · cobertura', bookReview: 'Turno · revisión', bookDone: 'Turno confirmado', waitlist: 'Lista de espera', appt: 'Detalle del turno', studies: 'Mis estudios', study: 'Estudio', pays: 'Mis pagos', pay: 'Pagar coseguro', payDone: 'Pago realizado', profile: 'Perfil', notifs: 'Notificaciones', push: 'Recordatorio' };

  SCREENS.welcome = () => ({ dark: true, raw: '<div class="dk"><div class="mid"><img src="img/logo.png" alt=""><h1>Tu turno, sin llamar<br>ni hacer fila.</h1><p>Sacá turno, confirmá tu asistencia, mirá tus estudios y pagá el coseguro desde el celular.</p></div>' + btn('Empezar', 'welcomeStart') + btn('Ya tengo cuenta', 'welcomeLogin', null, 'line') + '</div>' });

  SCREENS.regContact = () => ({ html: 1, head: hdr(S.reg.login ? 'Ingresar' : 'Crear cuenta', 1, 5),
    body: '<p class="q">' + (S.reg.login ? 'Ingresá el celular con el que te registraste.' : 'Ingresá tu celular. Te mandamos un código por SMS para verificar que sos vos.') + '</p>' + field('Celular', 'reg.phone', { mode: 'tel', ph: '343 555 1234', max: 16, auto: 'tel' }) + '<div class="note">Con el código de prueba <b>123456</b> podés avanzar. No se envía ningún SMS.</div>',
    foot: btn('Enviarme el código', 'toCode', null, '', !phoneOk()) });

  SCREENS.regCode = () => ({ head: hdr('Verificá tu celular', 2, 5),
    body: '<p class="q">Escribí el código de 6 dígitos que mandamos al <b>' + esc(S.reg.phone) + '</b>.</p><div class="codebox ' + (S.reg.codeErr ? 'bad' : '') + '" id="cb">' + S.reg.code.map((c, i) => '<input inputmode="numeric" autocomplete="one-time-code" maxlength="1" data-code="' + i + '" value="' + esc(c) + '" aria-label="Dígito ' + (i + 1) + '">').join('') + '</div><div class="err" id="cerr">' + esc(S.reg.codeErr) + '</div><div class="note" id="cd"></div>',
    foot: btn('Verificar', 'verify', null, '', S.reg.code.join('').length < 6), after() { startCd(); const f = view.querySelector('[data-code="' + Math.min(S.reg.code.join('').length, 5) + '"]'); if (f) f.focus(); } });

  SCREENS.regData = () => { const age = birth(); const osList = ['OSDE 210', 'Swiss Medical', 'Galeno', 'PAMI', 'Particular'];
    return { head: hdr('Tus datos', 3, 5), body: field('Nombre y apellido', 'reg.name', { auto: 'name', ph: 'María González' }) + field('DNI', 'reg.dni', { mode: 'numeric', max: 10, ph: '30112845', digits: 1 }) +
      '<div class="field"><label class="lbl">Fecha de nacimiento</label><div class="trio"><input class="inp" data-in="reg.d" data-digits="1" inputmode="numeric" maxlength="2" placeholder="Día" value="' + esc(S.reg.d) + '"><input class="inp" data-in="reg.m" data-digits="1" inputmode="numeric" maxlength="2" placeholder="Mes" value="' + esc(S.reg.m) + '"><input class="inp" data-in="reg.y" data-digits="1" inputmode="numeric" maxlength="4" placeholder="Año" value="' + esc(S.reg.y) + '"></div></div>' +
      '<div class="card" style="padding:16px"><div class="lbl">¿Y la obra social?</div><div class="field"><select class="inp" data-in="reg.os" data-rerender="1"><option value="">Elegí una opción</option>' + osList.map((o) => '<option' + (S.reg.os === o ? ' selected' : '') + '>' + o + '</option>').join('') + '</select></div>' + (S.reg.os && S.reg.os !== 'Particular' ? field('N° de afiliado', 'reg.osnum', { mode: 'numeric', max: 20, ph: 'Solo números', digits: 1 }) : '<div class="note">' + (S.reg.os === 'Particular' ? 'Vas a pagar la consulta completa desde la app.' : 'Podés sacar turno como particular si no tenés.') + '</div>') + '</div>',
      foot: btn('Continuar', 'toPass', null, '', !dataOk()) }; };

  SCREENS.regPass = () => ({ head: hdr('Creá tu contraseña', 4, 5),
    body: '<p class="q">Mínimo 6 caracteres. Es solo para este prototipo: no uses una contraseña real tuya.</p><div class="field" style="position:relative"><label class="lbl">Contraseña</label><input class="inp" data-in="reg.pass" type="' + (S.reg.show ? 'text' : 'password') + '" value="' + esc(S.reg.pass) + '" autocomplete="new-password" style="padding-right:56px"><button class="eye" data-act="toggleEye" aria-label="Mostrar u ocultar">' + ico(S.reg.show ? 'eyeoff' : 'eye', 22) + '</button><div class="strength" id="strength">' + strengthBar() + '</div></div>' + field('Repetí la contraseña', 'reg.pass2', { type: S.reg.show ? 'text' : 'password', auto: 'new-password' }) + '<div class="err" id="perr">' + passMsg() + '</div>',
    foot: btn('Continuar', 'toFace', null, '', !passOk()), live: { strength: strengthBar(), perr: passMsg() } });
  const strengthBar = () => { const s = passScore(); const c = ['#E4E4E2', '#B23A2C', '#C9A24A', '#7BA37F', '#2F6B3D'][s]; return [0, 1, 2, 3].map((i) => '<i style="background:' + (i < s ? c : '#ECECEA') + '"></i>').join(''); };
  const passMsg = () => (S.reg.pass2 && S.reg.pass !== S.reg.pass2 ? 'Las contraseñas no coinciden.' : S.reg.pass && S.reg.pass.length < 6 ? 'Faltan ' + (6 - S.reg.pass.length) + ' caracteres.' : '');

  SCREENS.regFace = () => ({ head: hdr('Ingreso rápido', 5, 5), body: '<div class="center" style="padding-top:20px"><div class="scan">' + ico('face', 58, 1.4) + '</div><h3>Entrá con la cara</h3><p class="q">La próxima vez abrís la app sin escribir la contraseña. Es una simulación: no usa la cámara.</p></div>',
    foot: btn('Activar', 'faceOn') + '<button class="link" data-act="faceOff">Ahora no</button>' });

  SCREENS.regDone = () => ({ raw: '<div class="body center" style="display:flex;flex-direction:column;justify-content:center"><div class="big-ok">' + ico('check', 38, 2) + '</div><h3>Listo, ' + esc(first(S.reg.name)) + '.</h3><p class="q">Tu cuenta está creada. Ya podés sacar tu primer turno.</p></div><div class="foot">' + btn('Ir al inicio', 'finishReg') + '</div>' });

  /* ---------- Inicio ---------- */
  SCREENS.home = () => { const p = P(), nx = upcoming(p)[0], cov = p.covs[0], multi = Object.keys(S.persons).length > 1, unread = S.notifs.some((n) => n.n), pend = pending(p).length, fresh2 = p.studies.filter((s) => s.fresh).length;
    let body = '';
    if (S.cur !== S.primary) body += '<div class="manage"><div>' + '<small>Estás gestionando a</small><b>' + esc(p.name) + ' · ' + esc(p.rel) + '</b></div><button data-act="leaveManage">Salir</button></div>';
    body += '<div class="cover">' + ico('shield', 20) + '<span>' + (cov ? 'Atendiéndote con <b>' + esc(cov.name) + '</b>' : 'Atendiéndote como <b>Particular</b>') + '</span></div>';
    if (nx) body += '<div class="card next"><div class="hd"><span>Próximo turno</span><span>' + esc(whenCap(nx.date, nx.time)) + '</span></div><div class="bd"><h3>' + esc(nx.title || nx.spec) + '</h3><div class="ln">' + ico('user', 19) + '<span>' + esc(docName(nx)) + '</span></div><div class="ln">' + ico('pin', 19) + '<span>' + esc(nx.room) + '</span></div><div class="ln">' + ico('card', 19) + '<span>' + (nx.copay > 0 ? (nx.paid ? 'Coseguro ' + money(nx.copay) + ' · pagado' : 'Coseguro ' + money(nx.copay) + ' · pendiente') : 'Sin coseguro') + '</span></div>' +
      '<div class="st ' + (nx.confirmed ? 'ok' : 'warn') + '">' + ico(nx.confirmed ? 'check' : 'info', 17) + '<span>' + (nx.confirmed ? 'Asistencia confirmada' : 'Falta confirmar tu asistencia') + '</span></div>' +
      '<div style="margin-top:12px">' + (nx.confirmed ? '' : btn('Confirmo que asisto', 'confirmAsk', nx.id, 'sm')) + '<div class="row2" style="margin-top:' + (nx.confirmed ? 0 : 10) + 'px">' + btn('Reprogramar', 'resched', nx.id, 'ghost sm') + btn('No voy a poder ir', 'cancelAsk', nx.id, 'danger sm') + '</div></div><button class="link" data-act="openAppt" data-v="' + nx.id + '">Ver detalle</button></div></div>';
    else body += '<div class="card" style="margin-top:14px;padding:22px 18px;text-align:center"><div style="color:var(--gold-d)">' + ico('cal', 34) + '</div><b style="display:block;margin:8px 0 4px;font-size:1.1em">No tenés turnos próximos</b><div class="note" style="margin-bottom:14px">Sacá uno en menos de un minuto.</div>' + btn('Sacá tu turno', 'newBook', null, 'sm') + '</div>';
    body += '<div class="section"><div class="lbl">¿Qué necesitás?</div></div><div class="tiles"><button class="tile" data-act="newBook"><span style="color:var(--gold-d)">' + ico('calplus', 28) + '</span><b>Sacá tu turno</b><small>Consultas y estudios</small></button><button class="tile" data-act="tab" data-v="studies">' + (fresh2 ? '<span class="bdg">' + fresh2 + ' nuevo' + (fresh2 > 1 ? 's' : '') + '</span>' : '') + '<span style="color:var(--gold-d)">' + ico('doc', 28) + '</span><b>Mis estudios</b><small>Resultados e informes</small></button><button class="tile" data-act="go" data-v="pays">' + (pend ? '<span class="bdg">' + pend + '</span>' : '') + '<span style="color:var(--gold-d)">' + ico('card', 28) + '</span><b>Mis pagos</b><small>' + (pend ? pend + ' coseguro' + (pend > 1 ? 's' : '') + ' pendiente' + (pend > 1 ? 's' : '') : 'Todo al día') + '</small></button><button class="tile" data-act="chat"><span style="color:var(--gold-d)">' + ico('chat', 28) + '</span><b>Escribinos</b><small>Consultas a recepción</small></button></div>' +
      '<button class="tile" data-act="switcher" style="width:100%;margin-top:10px;display:flex;align-items:center;gap:14px;min-height:0"><span style="color:var(--gold-d)">' + ico('group', 28) + '</span><span><b style="margin:0">Grupo familiar</b><small>' + (multi ? Object.keys(S.persons).length + ' personas · cambiá de perfil' : 'Agregá a quien cuidás') + '</small></span><span style="margin-left:auto">' + ico('chev', 20) + '</span></button>';
    return { head: '<div class="top"><img src="img/logo.png" alt="TurnAR"><span class="sp"></span><button class="ibtn" data-act="go" data-v="notifs" aria-label="Notificaciones">' + ico('bell', 22) + (unread ? '<i class="dot"></i>' : '') + '</button><button class="ibtn mg" data-act="' + (multi ? 'switcher' : 'tab') + '" data-v="profile" aria-label="Perfil">' + esc(p.ini) + '</button></div>', body, tabs: tabs('home') }; };

  /* ---------- Mis turnos ---------- */
  SCREENS.appts = () => { const p = P(), up = upcoming(p), past = p.appts.filter((a) => diffDays(a.date) < 0);
    const row = (a) => '<button class="item" data-act="openAppt" data-v="' + a.id + '"><span class="ico-box">' + ico('cal', 22) + '</span><span class="t"><b>' + esc(a.title || a.spec) + '</b><small>' + esc(shortDate(a.date)) + ' · ' + a.time + ' hs · ' + esc(docName(a)) + '</small></span>' + (a.confirmed ? '<span class="pill ok">Confirmado</span>' : '') + ico('chev', 18) + '</button>';
    return { head: '<div class="hdr"><h2>Mis turnos</h2></div>', body: '<div class="lbl">Próximos</div>' + (up.length ? '<div class="card list">' + up.map(row).join('') + '</div>' : empty('No tenés turnos próximos.')) + (past.length ? '<div class="section"><div class="lbl">Anteriores</div></div><div class="card list">' + past.map(row).join('') + '</div>' : '') + '<div style="margin-top:18px">' + btn('Sacar un turno', 'newBook') + '</div>', tabs: tabs('appts') }; };

  /* ---------- Reserva ---------- */
  const bk = () => S.bk;
  const stepsFor = () => (bk().kind === 'img' ? 5 : 5);
  SCREENS.bookSpec = () => { const q = (bk().q || '').toLowerCase(); const list = T.SPECS.filter((s) => s.name.toLowerCase().includes(q));
    return { head: hdr('¿Qué especialidad?', 1, 5), body: '<div class="field"><div style="position:relative"><span style="position:absolute;left:16px;top:17px;color:var(--mute)">' + ico('search', 22) + '</span><input class="inp" id="specq" data-in="bk.q" placeholder="Buscá una especialidad" value="' + esc(bk().q || '') + '" style="padding-left:48px" data-live-list="1"></div></div><div class="card list" id="speclist">' + specRows(list) + '</div>', foot: '' };
  };
  const specRows = (list) => (list.length ? list.map((s) => { const none = !s.docs.length; return '<button class="item" ' + (none ? 'disabled style="opacity:.55"' : 'data-act="pickSpec" data-v="' + s.id + '"') + '><span class="ico-box">' + ico(s.ico, 24) + '</span><span class="t"><b>' + s.name + '</b><small>' + (none ? 'Sin turnos este mes' : s.order ? 'Pide pedido médico' : s.docs.length > 1 ? s.docs.length + ' profesionales' : 'Hay turnos') + '</small></span>' + (none ? '' : ico('chev', 18)) + '</button>'; }).join('') : empty('No encontramos esa especialidad.<br>Probá con otra palabra.'));

  const specDocs = () => T.SPECS.find((s) => s.id === bk().spec).docs;
  const withDays = () => specDocs().filter((id) => T.DOCS[id].days.length);
  SCREENS.bookDoc = () => { const b = bk(), has = withDays();
    const nextTxt = (id) => { const f = T.firstAvail(S, [id], b.resched); return f ? 'Próximo turno: ' + shortDate(f.iso) + ' · ' + f.t + ' hs' : 'Sin turnos disponibles'; };
    const any = T.firstAvail(S, has, b.resched);
    return { head: hdr('¿Con quién?', 2, 5), body: '<button class="opt first ' + (b.docId === 'any' ? 'sel' : '') + '" data-act="pickDoc" data-v="any"><span class="rd"></span><span><b>El primero disponible</b><small>' + (any ? esc(T.DOCS[any.docId].name) + ' · ' + shortDate(any.iso) + ' · ' + any.t + ' hs' : 'Sin turnos') + '</small></span></button>' +
      specDocs().map((id) => { const d = T.DOCS[id], none = !d.days.length; return '<button class="opt ' + (b.docId === id ? 'sel' : '') + '" data-act="' + (none ? 'waitOpen' : 'pickDoc') + '" data-v="' + id + '"><span class="rd"></span><span style="flex:1"><b>' + esc(d.name) + '</b><small>M.P. ' + d.mp + ' · ' + esc(nextTxt(id)) + '</small>' + (none ? '<small class="warn">Tocá para sumarte a la lista de espera</small>' : '') + '</span></button>'; }).join(''),
      foot: btn('Continuar', 'docNext', null, '', !b.docId) };
  };
  SCREENS.imgList = () => { const b = bk(); return { head: hdr('¿Qué estudio?', 1, 5), body: '<p class="q">Elegí el estudio que figura en tu pedido médico.</p>' + Object.values(T.IMG).map((i) => '<button class="opt ' + (b.img === i.id ? 'sel' : '') + '" data-act="pickImg" data-v="' + i.id + '"><span class="rd"></span><span><b>' + i.name + '</b><small>' + i.sub + '</small></span></button>').join(''), foot: btn('Continuar', 'imgNext', null, '', !b.img) }; };
  SCREENS.imgOrder = () => { const b = bk(), im = T.IMG[b.img];
    return { head: hdr('Tu pedido médico', 2, 5), body: '<p class="q">Subí una foto o el PDF del pedido. Lo necesitamos para validar el estudio con tu cobertura.</p>' +
      (b.file ? '<div class="file">' + ico('doc', 26) + '<span class="t"><b>' + esc(b.file.name) + '</b><small>' + esc(b.file.size) + ' · listo</small></span><button class="ibtn" style="width:38px;height:38px" data-act="rmFile" aria-label="Quitar archivo">' + ico('x', 18) + '</button></div>' :
      '<div class="upl"><button class="a" data-act="pickFile" data-v="cam"><span class="ico-box">' + ico('camera', 22) + '</span><b style="font-weight:500">Sacar una foto</b></button><button class="a" data-act="pickFile" data-v="gal"><span class="ico-box">' + ico('image', 22) + '</span><b style="font-weight:500">Elegir de la galería</b></button><button class="a" data-act="pickFile" data-v="pdf"><span class="ico-box">' + ico('upload', 22) + '</span><b style="font-weight:500">Subir un PDF</b></button></div>') +
      '<input type="file" id="file" accept="image/*,application/pdf" class="hide"><div class="section"><div class="lbl">Aclaración para el equipo (opcional)</div></div><textarea class="inp" data-in="bk.note" placeholder="Ej.: me cuesta subir escaleras">' + esc(b.note || '') + '</textarea>' +
      '<div class="banner" style="margin-top:16px">' + ico('info', 20) + '<span><b>Cómo prepararte</b><br>' + esc(im.prep) + '</span></div><div class="note">El prototipo no guarda el archivo: solo recuerda su nombre.</div>', foot: btn('Continuar', 'orderNext', null, '', !b.file) }; };

  /* merge de turnos de uno o varios profesionales */
  const docsForTime = () => (bk().kind === 'img' ? ['img'] : bk().docId === 'any' ? withDays() : [bk().docId]);
  const merged = (iso) => { const ids = docsForTime(), ig = bk().resched; const lists = ids.map((id) => ({ id, l: T.slotList(S, id, iso, ig) })).filter((x) => x.l); if (!lists.length) return null;
    return lists[0].l.map((s, i) => { const f = lists.find((x) => x.l[i].free); return { t: s.t, period: s.period, free: !!f, doc: f ? f.id : lists[0].id }; }); };
  const dayAvail = (iso) => { const m = merged(iso); return !!m && m.some((s) => s.free); };
  SCREENS.bookTime = () => { const b = bk(), vm = b.vm, y = vm.y, mo = vm.m, first1 = new Date(y, mo, 1), off = (first1.getDay() + 6) % 7, nd = new Date(y, mo + 1, 0).getDate();
    const minM = T.TODAY.getMonth(), canPrev = y * 12 + mo > T.TODAY.getFullYear() * 12 + minM, canNext = y * 12 + mo < T.TODAY.getFullYear() * 12 + minM + 2;
    let cells = ''; for (let i = 0; i < off; i++) cells += '<span></span>'; for (let d = 1; d <= nd; d++) { const iso = T.iso(new Date(y, mo, d)), av = dayAvail(iso); cells += '<button class="day ' + (av ? 'av ' : '') + (b.date === iso ? 'sel' : '') + '" ' + (av ? 'data-act="pickDay" data-v="' + iso + '"' : 'disabled') + '>' + d + '</button>'; }
    const sl = b.date ? merged(b.date) : null; const slotBtns = (per) => sl.filter((s) => s.period === per).map((s) => '<button class="slot ' + (b.time === s.t ? 'sel' : '') + '" ' + (s.free ? 'data-act="pickTime" data-v="' + s.t + '"' : 'disabled') + '>' + s.t + '</button>').join('');
    const chosenDoc = b.date && b.time ? (sl.find((s) => s.t === b.time) || {}).doc : null;
    return { head: hdr(b.resched ? 'Reprogramar turno' : 'Elegí día y horario', b.resched ? 0 : 3, 5), body: '<div class="card cal"><div class="mh"><button data-act="month" data-v="-1" ' + (canPrev ? '' : 'disabled') + ' aria-label="Mes anterior">' + ico('chevl', 20) + '</button><span>' + cap(T.MONTHS[mo]) + ' ' + y + '</span><button data-act="month" data-v="1" ' + (canNext ? '' : 'disabled') + ' aria-label="Mes siguiente">' + ico('chev', 20) + '</button></div><div class="grid7">' + ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x) => '<span class="dn">' + x + '</span>').join('') + cells + '</div></div>' +
      (b.date ? '<div class="section"><div class="lbl">' + esc(longDate(b.date)) + ' · Mañana</div></div><div class="slots">' + slotBtns('am') + '</div>' + (sl.some((s) => s.period === 'pm') ? '<div class="section"><div class="lbl">Tarde</div></div><div class="slots">' + slotBtns('pm') + '</div>' : '') : empty('Los días con punto dorado tienen turnos.<br>Tocá uno para ver los horarios.')),
      foot: '<div class="meta"><span>' + (b.date && b.time ? esc(longDate(b.date)) + ' · ' + b.time + ' hs' : 'Elegí un horario') + '</span><span>Dura ' + (b.kind === 'img' ? '20' : '30') + ' min</span></div>' + btn(b.resched ? 'Confirmar nuevo horario' : 'Continuar', 'timeNext', chosenDoc, '', !(b.date && b.time)) }; };
  SCREENS.bookCoverage = () => { const b = bk(), p = P(), opts = p.covs.concat([T.PART]);
    return { head: hdr('¿Con qué cobertura?', 4, 5), body: '<p class="q">Elegí cómo se va a atender <b>' + esc(first(p.name)) + '</b>.</p>' + opts.map((c) => '<button class="opt ' + (b.covId === c.id ? 'sel' : '') + '" data-act="pickCov" data-v="' + c.id + '"><span class="rd"></span><span><b>' + esc(c.name) + '</b><small>' + esc(c.detail) + '</small><small class="warn">' + (c.copay.cons || T.copayOf(c, b.kind) ? 'Coseguro ' + money(T.copayOf(c, b.kind)) : 'Sin coseguro') + '</small></span></button>').join('') + '<button class="opt dash" data-act="covAdd"><span class="ico-box" style="width:38px;height:38px">' + ico('plus', 20) + '</span><b style="font-weight:500">Vincular otra obra social</b></button>', foot: btn('Continuar', 'covNext', null, '', !b.covId) }; };
  const covOf = (p, id) => p.covs.find((c) => c.id === id) || T.PART;
  SCREENS.bookReview = () => { const b = bk(), p = P(), cov = covOf(p, b.covId), d = T.DOCS[b.docResolved], copay = T.copayOf(cov, b.kind);
    return { head: hdr('Revisá y confirmá', 5, 5), body: sum([['Turno', esc(b.kind === 'img' ? T.IMG[b.img].name : T.SPECS.find((s) => s.id === b.spec).name)], ['Profesional', esc(d.name)], ['Fecha', esc(longDate(b.date))], ['Horario', b.time + ' hs'], ['Lugar', esc(d.room)], ['Paciente', esc(p.name)], ['Cobertura', esc(cov.name)], ['Coseguro', copay ? money(copay) : 'Sin coseguro']]) +
      '<div class="banner" style="margin-top:16px">' + ico('bell', 20) + '<span>Te vamos a recordar por WhatsApp <b>48 y 3 hs antes</b>. Podés cancelar sin cargo hasta 4 hs antes.</span></div>' + (copay ? '<div class="note">Podés pagar el coseguro después, desde la app o en recepción.</div>' : ''), foot: btn('Confirmar turno', 'confirmBook') }; };
  SCREENS.bookDone = () => { const b = S.done || {}; return { raw: '<div class="body center" style="display:flex;flex-direction:column;justify-content:center"><div class="big-ok">' + ico('check', 38, 2) + '</div><h3>' + (b.resched ? 'Turno reprogramado' : '¡Turno confirmado!') + '</h3><p class="q">' + esc(b.title) + ' · ' + esc(longDate(b.date)) + ', ' + b.time + ' hs<br>' + esc(b.doc) + '</p></div><div class="foot">' + btn(ico('download', 20) + ' Agregar a mi calendario', 'ics', b.id, 'ghost') + '<div style="height:10px"></div>' + btn('Volver al inicio', 'homeRoot') + '</div>' }; };
  SCREENS.waitlist = () => { const d = T.DOCS[bk().wait]; const on = P().wait.includes(d.id);
    return { head: hdr('Lista de espera', 0, 0), body: '<div class="center" style="padding-top:20px"><div class="big-ok" style="background:var(--gold-l);color:var(--gold-dd)">' + ico('clock', 36) + '</div><h3>' + esc(d.name) + ' no tiene turnos por ahora</h3><p class="q">' + (on ? 'Ya estás en la lista. Te avisamos por notificación apenas se libere un turno.' : 'Sumate a la lista de espera y te avisamos apenas se libere un turno.') + '</p></div>', foot: on ? btn('Volver', 'back', null, 'ghost') : btn('Sumarme a la lista', 'joinWait', d.id) + '<button class="link" data-act="back">Elegir otro profesional</button>' }; };

  /* ---------- Detalle de turno ---------- */
  const findAppt = (id) => { for (const k in S.persons) { const a = S.persons[k].appts.find((x) => x.id === id); if (a) return { a, p: S.persons[k] }; } return null; };
  SCREENS.appt = () => { const f = findAppt(S.appt); if (!f) return { raw: '<div class="body">' + empty('Ese turno ya no existe.') + '</div><div class="foot">' + btn('Volver', 'homeRoot') + '</div>' }; const a = f.a, cov = covOf(f.p, a.covId);
    return { head: hdr('Detalle del turno'), body: '<div class="card next"><div class="hd"><span>' + esc(a.title || a.spec) + '</span><span>' + esc(whenCap(a.date, a.time)) + '</span></div>' + sum([['Fecha', esc(longDate(a.date))], ['Horario', a.time + ' hs'], ['Profesional', esc(docName(a))], ['Paciente', esc(f.p.name)], ['Cobertura', esc(cov.name)], ['Coseguro', a.copay ? money(a.copay) + (a.paid ? ' · pagado' : ' · pendiente') : 'Sin coseguro'], ['Asistencia', a.confirmed ? '<span class="ok">Confirmada</span>' : '<span class="warn">Sin confirmar</span>']]) + '</div>' +
      '<div class="map">' + ico('pin', 24) + '<span style="margin-left:8px">' + esc(a.room) + '<br>Sede Centro · mapa de ejemplo</span></div>' + btn('Cómo llegar', 'how', null, 'ghost sm'),
      foot: (a.copay > 0 && !a.paid ? btn('Pagar ahora desde la app', 'payFor', a.id) + '<div style="height:10px"></div>' : '') + (a.confirmed ? '' : btn('Confirmo que asisto', 'confirmAsk', a.id, 'dark sm') + '<div style="height:10px"></div>') + '<div class="row2">' + btn('Reprogramar', 'resched', a.id, 'ghost sm') + btn('Cancelar el turno', 'cancelAsk', a.id, 'danger sm') + '</div>' }; };

  /* ---------- Estudios ---------- */
  SCREENS.studies = () => { const p = P(); const st = { ready: '<span class="pill">Listo</span>', progress: '<span class="pill" style="background:#EFF0EC;color:#555">En proceso</span>', wait: '<span class="pill" style="background:#EFF0EC;color:#555">Pendiente</span>' };
    return { head: '<div class="hdr"><h2>Mis estudios</h2></div>', body: (p.studies.length ? '<div class="card list">' + p.studies.map((s) => '<button class="item" data-act="openStudy" data-v="' + s.id + '"><span class="ico-box">' + ico('doc', 22) + '</span><span class="t"><b>' + esc(s.name) + '</b><small>' + esc(s.date) + (s.status === 'wait' ? '' : ' · ' + esc(s.place)) + '</small></span>' + st[s.status] + ico('chev', 18) + '</button>').join('') + '</div>' : empty('Todavía no tenés estudios.<br>Cuando te hagas uno, el resultado aparece acá.')), tabs: tabs('studies') }; };
  SCREENS.study = () => { const p = P(), s = p.studies.find((x) => x.id === S.study); if (!s) return { raw: '<div class="body">' + empty('No encontramos el estudio.') + '</div><div class="foot">' + btn('Volver', 'back') + '</div>' };
    let body = '<div class="lbl">' + esc(s.date) + ' · ' + esc(s.place) + '</div>';
    if (s.status === 'ready') body += '<div class="card" style="padding:4px 16px"><table class="tbl"><tr><th>Análisis</th><th>Valor</th><th>Referencia</th></tr><tr><td>Glucemia</td><td class="v">92 mg/dl</td><td>70–110</td></tr><tr><td>Hemoglobina</td><td class="v">13,8 g/dl</td><td>12–16</td></tr><tr><td>Glóbulos blancos</td><td class="v">6.400 /mm³</td><td>4.000–10.000</td></tr><tr class="out"><td>Colesterol total<br><span class="flag">Fuera de rango</span></td><td class="v">218 mg/dl</td><td>&lt; 200</td></tr></table></div><div class="note" style="margin:12px 0">Valores de ejemplo inventados. Un valor fuera de rango no es un diagnóstico: conviene que lo vea tu médico.</div>';
    else if (s.status === 'progress') body += '<div class="banner">' + ico('clock', 20) + '<span>Tu estudio se está procesando. Cuando esté listo te avisamos por notificación.</span></div>';
    else body += '<div class="banner">' + ico('clock', 20) + '<span>El informe de la ecografía llega en <b>48 hs</b>. Te avisamos apenas esté.</span></div>';
    return { head: hdr(s.name), body, foot: s.status === 'ready' ? btn('Ver informe completo', 'report') + '<div style="height:10px"></div>' + btn('Compartir con mi médico', 'shareAsk', null, 'ghost sm') + '<div style="height:10px"></div>' + btn('Sacar turno con la Dra. Benítez', 'bookBeni', null, 'ghost sm') : btn('Volver', 'back', null, 'ghost') }; };

  /* ---------- Pagos ---------- */
  SCREENS.pays = () => { const p = P(), pen = pending(p), done = p.pays;
    return { head: hdr('Mis pagos'), body: '<div class="lbl">Pendientes</div>' + (pen.length ? '<div class="card list">' + pen.map((a) => '<button class="item" data-act="payFor" data-v="' + a.id + '"><span class="ico-box">' + ico('card', 22) + '</span><span class="t"><b>Coseguro · ' + esc(a.title || a.spec) + '</b><small>' + esc(shortDate(a.date)) + ' · ' + a.time + ' hs</small></span><b>' + money(a.copay) + '</b>' + ico('chev', 18) + '</button>').join('') + '</div>' : empty('No tenés pagos pendientes.')) + '<div class="section"><div class="lbl">Historial</div></div>' + (done.length ? '<div class="card list">' + done.map((x) => '<div class="item"><span class="ico-box" style="background:var(--ok-l);color:var(--ok)">' + ico('check', 22) + '</span><span class="t"><b>' + esc(x.what) + '</b><small>Comprobante N° ' + x.no + ' · ' + esc(x.how) + '</small></span><b>' + money(x.amount) + '</b></div>').join('') + '</div>' : empty('Todavía no hiciste pagos desde la app.')) };
  };
  SCREENS.pay = () => { const f = findAppt(S.pay.apptId); if (!f) return { raw: '<div class="body">' + empty('No hay nada para pagar.') + '</div><div class="foot">' + btn('Volver', 'homeRoot') + '</div>' }; const a = f.a, m = S.pay.method;
    const o = (id, t, s) => '<button class="opt ' + (m === id ? 'sel' : '') + '" data-act="payMethod" data-v="' + id + '"><span class="rd"></span><span><b>' + t + '</b><small>' + s + '</small></span></button>';
    return { head: hdr('Pagar coseguro'), body: '<div class="card" style="padding:16px;margin-bottom:16px"><div class="lbl">' + esc(a.title || a.spec) + ' · ' + esc(shortDate(a.date)) + '</div><div style="font:600 2.3em \'Barlow Condensed\'">' + money(a.copay) + '</div></div><div class="lbl">Medio de pago</div>' + o('visa', 'Visa terminada en 4417', 'Tarjeta de ejemplo guardada') + o('other', 'Otra tarjeta', 'En el prototipo no se cargan tarjetas') + o('desk', 'Pagar en recepción', 'Lo abonás el día del turno') + '<div class="note">Nada de esto procesa pagos reales.</div>',
      foot: m === 'desk' ? btn('Pagaré en recepción', 'payGo') : btn('Pagar ' + money(a.copay), 'payGo', null, '', !m || m === 'other') }; };
  SCREENS.payDone = () => { const x = S.payDone || {}; return { raw: '<div class="body center" style="display:flex;flex-direction:column;justify-content:center"><div class="big-ok">' + ico('check', 38, 2) + '</div><h3>' + (x.desk ? 'Quedó para recepción' : 'Pago realizado') + '</h3><p class="q">' + (x.desk ? 'Abonás ' + money(x.amount) + ' el día del turno.' : money(x.amount) + ' · comprobante N° ' + x.no) + '</p></div><div class="foot">' + btn('Volver al inicio', 'homeRoot') + '</div>' }; };

  /* ---------- Perfil y avisos ---------- */
  SCREENS.profile = () => { const p = P(), pm = S.persons[S.primary], multi = Object.keys(S.persons).length > 1;
    return { head: '<div class="hdr"><h2>Perfil</h2></div>', body: '<div class="card" style="padding:16px;display:flex;gap:14px;align-items:center"><span class="avatar gold">' + esc(p.ini) + '</span><span><b style="font-size:1.15em">' + esc(p.name) + '</b><div class="note">DNI ' + esc(p.dni) + ' · ' + p.age + ' años</div></span></div>' +
      '<div class="section"><div class="lbl">Coberturas</div></div><div class="card list">' + (p.covs.length ? p.covs.map((c) => '<div class="item"><span class="ico-box">' + ico('shield', 22) + '</span><span class="t"><b>' + esc(c.name) + '</b><small>' + esc(c.detail) + '</small></span></div>').join('') : '<div class="item"><span class="t"><b>Particular</b><small>Sin obra social</small></span></div>') + '<button class="item" data-act="covAdd"><span class="ico-box">' + ico('plus', 22) + '</span><span class="t"><b>Vincular otra obra social</b></span></button></div>' +
      '<div class="section"><div class="lbl">Grupo familiar</div></div><div class="card list">' + Object.values(S.persons).map((x) => '<button class="item" data-act="switchTo" data-v="' + x.id + '"><span class="avatar ' + (x.id === S.cur ? 'gold' : '') + '">' + esc(x.ini) + '</span><span class="t"><b>' + esc(x.name) + '</b><small>' + esc(x.rel) + (x.id === S.cur ? ' · perfil activo' : '') + '</small></span>' + ico('chev', 18) + '</button>').join('') + '<button class="item" data-act="famAdd"><span class="ico-box">' + ico('plus', 22) + '</span><span class="t"><b>Agregar a alguien</b></span></button></div>' +
      '<div class="section"><div class="lbl">Ajustes</div></div><div class="card list"><button class="setrow" data-act="go" data-v="notifs">' + ico('bell', 22) + '<span class="t"><b>Notificaciones</b><small>Recordatorios y avisos</small></span>' + ico('chev', 18) + '</button><div class="setrow">' + ico('text', 22) + '<span class="t"><b>Tamaño del texto</b></span><span class="row2" style="gap:6px">' + [['A', 1], ['A', 1.15], ['A', 1.3]].map((o, i) => '<button class="ibtn" style="width:40px;height:40px;font-size:' + (14 + i * 3) + 'px;' + (S.ts === o[1] ? 'background:var(--ink);color:#fff' : '') + '" data-act="ts" data-v="' + o[1] + '" aria-label="Texto ' + ['normal', 'grande', 'muy grande'][i] + '">A</button>').join('') + '</span></div></div>' +
      '<button class="link" data-act="logout">Cerrar sesión</button>', tabs: tabs('profile') }; };
  SCREENS.notifs = () => { const row = (k, t, s) => '<div class="setrow"><span class="t"><b>' + t + '</b><small>' + s + '</small></span><button class="switch ' + (S.set[k] ? 'on' : '') + '" data-act="toggle" data-v="' + k + '" role="switch" aria-checked="' + !!S.set[k] + '" aria-label="' + t + '"></button></div>';
    return { head: hdr('Notificaciones'), body: '<div class="lbl">Avisos</div>' + (S.notifs.length ? '<div class="card list">' + S.notifs.map((n) => '<div class="item ' + (n.n ? 'hl' : '') + '"><span class="t"><b>' + esc(n.t) + '</b><small style="white-space:normal">' + esc(n.x) + '</small></span></div>').join('') + '</div>' : empty('No tenés avisos.')) + '<div class="section"><div class="lbl">Cómo querés que te avisemos</div></div><div class="card list">' + row('wa', 'Recordatorio por WhatsApp', '48 y 3 horas antes del turno') + row('push', 'Notificaciones en el celular', 'Turnos, resultados y pagos') + row('email', 'Resumen por correo', 'Una vez por semana') + '</div>' + (!S.set.wa && !S.set.push ? '<div class="banner" style="margin-top:14px;background:var(--red-l)">' + ico('info', 20) + '<span>Con los recordatorios apagados podés olvidarte del turno y se libera el horario.</span></div>' : '') }; };
  SCREENS.push = () => { const nx = upcoming(S.persons[S.primary])[0]; const when = nx ? T.dayWord(nx.date) + ' ' + nx.time + ' hs' : 'mañana';
    return { dark: true, raw: '<div class="lock"><div class="d">Lunes 10 de agosto</div><div class="c">9:41</div></div><div class="push"><div class="h"><img src="img/logo.png" alt=""><span>TURNAR</span><span>ahora</span></div><b>Tenés turno el ' + esc(when) + '</b><p>' + (nx ? esc(nx.title || nx.spec) + ' con ' + esc(docName(nx)) + '. ¿Vas a poder ir?' : '¿Vas a poder ir?') + '</p><div class="row2">' + btn('Sí, voy a ir', 'pushYes', null, 'sm') + btn('No voy a poder', 'pushNo', null, 'line sm') + '</div></div>' }; };

  /* ====================== Hojas y aviso ====================== */
  const sh = (inner) => '<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + inner + '</div></div>';
  const modalHtml = () => { const m = S.modal; if (!m) return ''; const f = m.id && findAppt(m.id);
    if (m.t === 'confirm' && f) return sh('<h3>¿Confirmás que vas a asistir?</h3><p class="q">' + esc(f.a.title || f.a.spec) + ' · ' + esc(whenCap(f.a.date, f.a.time)) + '</p>' + btn('Sí, confirmo', 'doConfirm', m.id) + '<button class="link" data-act="closeSheet">Todavía no</button>');
    if (m.t === 'cancel' && f) { const mins = diffDays(f.a.date) * 1440 + T.minutes(f.a.time) - T.NOW_MIN; if (mins < 240) return sh('<h3>Ya no se puede cancelar online</h3><p class="q">Faltan menos de 4 horas. Llamá a recepción para avisar.</p>' + btn('Entendido', 'closeSheet', null, 'ghost')); return sh('<h3>¿Cancelamos el turno?</h3><p class="q">' + esc(f.a.title || f.a.spec) + ' · ' + esc(whenCap(f.a.date, f.a.time)) + '<br>Liberamos el horario para otra persona.</p>' + btn('Sí, cancelar el turno', 'doCancel', m.id, 'danger') + '<div style="height:10px"></div>' + btn('Mantener el turno', 'closeSheet', null, 'dark')); }
    if (m.t === 'switch') return sh('<h3>¿A quién gestionás?</h3><p class="q">Cambiá de perfil para sacar turnos o ver estudios de tu familia.</p>' + Object.values(S.persons).map((x) => '<button class="opt ' + (x.id === S.cur ? 'sel' : '') + '" data-act="switchTo" data-v="' + x.id + '"><span class="avatar ' + (x.id === S.cur ? 'gold' : '') + '">' + esc(x.ini) + '</span><span><b>' + esc(x.name) + '</b><small>' + esc(x.rel) + '</small></span></button>').join('') + '<button class="opt dash" data-act="famAdd"><span class="ico-box" style="width:38px;height:38px">' + ico('plus', 20) + '</span><b style="font-weight:500">Agregar a alguien</b></button>');
    if (m.t === 'chat') return sh('<h3>Escribinos</h3><div style="margin:12px 0;min-height:120px;max-height:260px;overflow:auto" id="chatlog">' + chatHtml() + '</div><div class="row2"><input class="inp" id="chatin" placeholder="Escribí tu consulta" style="height:50px"><button class="btn sm" style="flex:none;width:96px" data-act="chatSend">Enviar</button></div>');
    if (m.t === 'share') return sh('<h3>Compartir con mi médico</h3><p class="q">Ingresá el correo de tu médico.</p><input class="inp" id="shmail" type="email" placeholder="medico@ejemplo.com"><div class="err" id="merr"></div>' + btn('Enviar informe', 'doShare') + '<div class="note" style="margin-top:8px">Simulación: no se envía nada.</div>');
    if (m.t === 'fam') return sh('<h3>Agregar a alguien</h3><p class="q">Una persona a tu cargo (hijo/a, padre, madre).</p><input class="inp" id="fn" placeholder="Nombre y apellido" style="margin-bottom:10px"><input class="inp" id="fr" placeholder="Vínculo (ej.: Hijo)" style="margin-bottom:10px"><input class="inp" id="fa" inputmode="numeric" maxlength="3" placeholder="Edad"><div class="err" id="merr"></div>' + btn('Agregar', 'doFam'));
    if (m.t === 'cov') return sh('<h3>Vincular obra social</h3><input class="inp" id="cn" placeholder="Nombre (ej.: Swiss Medical)" style="margin-bottom:10px"><input class="inp" id="cnum" inputmode="numeric" placeholder="N° de afiliado"><div class="err" id="merr"></div>' + btn('Vincular', 'doCov'));
    return ''; };
  const chatHtml = () => '<div class="bubble cl">Hola, soy el chat de ejemplo de TurnAR. No hay nadie al otro lado: tus mensajes quedan acá en pantalla.</div>' + S.chat.map((c) => '<div class="bubble ' + c.w + '">' + esc(c.x) + '</div>').join('');
  const showOverlay = () => { overlay.innerHTML = modalHtml() + (S.toast ? '<div class="toast" role="status">' + esc(S.toast) + '</div>' : ''); const c = $('#chatin'); if (c && !c.dataset.f) { c.dataset.f = 1; c.focus(); } const l = $('#chatlog'); if (l) l.scrollTop = 1e6; };

  /* ====================== Render ====================== */
  const render = () => {
    timers.forEach(clearTimeout); timers = []; clearInterval(cdTimer);
    const sc = SCREENS[S.screen](); phone.classList.toggle('dark', !!sc.dark); phone.style.setProperty('--ts', S.ts);
    view.innerHTML = sc.raw || ((sc.head || '') + '<div class="body" id="body">' + (sc.body || '') + '</div>' + (sc.foot ? '<div class="foot" id="foot">' + sc.foot + '</div>' : '') + (sc.tabs || ''));
    if (lastScreen !== S.screen) { const b = $('#body'); if (b) b.scrollTop = 0; }
    lastScreen = S.screen; $('#curName').textContent = NAMES[S.screen] || S.screen; showOverlay(); save(); if (sc.after) sc.after();
  };
  const refresh = () => { const sc = SCREENS[S.screen](); const f = $('#foot'); if (f && sc.foot != null) f.innerHTML = sc.foot; if (sc.live) for (const k in sc.live) { const e = document.getElementById(k); if (e) e.innerHTML = sc.live[k]; } save(); };
  const startCd = () => { cdLeft = 38; const el = () => $('#cd'); const tick = () => { const e = el(); if (!e) return; e.innerHTML = cdLeft > 0 ? 'Reenviar código en 0:' + String(cdLeft).padStart(2, '0') : '<button class="link" style="margin:0;padding:0;display:inline" data-act="resend">Reenviar código</button>'; }; tick(); cdTimer = setInterval(() => { if (cdLeft > 0) cdLeft--; tick(); if (cdLeft <= 0) clearInterval(cdTimer); }, 1000); };

  /* ====================== Acciones ====================== */
  const ACT = {
    back, closeSheet, scrim() {}, go: (v) => go(v),
    welcomeStart() { S.reg.login = false; go('regContact'); },
    welcomeLogin() { S.reg.login = true; go('regContact'); },
    toCode() { S.reg.code = ['', '', '', '', '', '']; S.reg.codeErr = ''; go('regCode'); },
    resend() { toast('Código reenviado (de prueba: 123456)'); startCd(); },
    verify() { if (S.reg.code.join('') !== '123456') { S.reg.codeErr = 'El código no coincide. Para este prototipo usá 123456.'; $('#cerr').textContent = S.reg.codeErr; $('#cb').classList.add('bad'); return; } S.reg.codeErr = ''; if (S.reg.login) { const ph = S.reg.phone; demo(); S.reg.phone = ph; S.stack = []; render(); toast('Ingresaste con la cuenta de ejemplo de María.'); } else go('regData'); },
    toPass() { go('regPass'); }, toFace() { go('regFace'); },
    toggleEye() { S.reg.show = !S.reg.show; render(); },
    faceOn() { const sc = view.querySelector('.scan'); sc.style.opacity = '1'; setTimeout(() => go('regDone'), 1300); toast('Face ID activado (simulado)'); },
    faceOff() { go('regDone'); },
    finishReg() { const r = S.reg, age = birth(); const p = { id: 'me', name: r.name.trim(), ini: initials(r.name), rel: 'Vos', age, dni: fmtDni(r.dni), covs: r.os === 'Particular' ? [] : [{ id: 'os', name: r.os, detail: 'Afiliado/a ' + digits(r.osnum), copay: { cons: r.os === 'PAMI' ? 0 : 4800, img: r.os === 'PAMI' ? 0 : 7500 } }], appts: [], studies: [], pays: [], wait: [] };
      S.persons = { me: p }; S.cur = S.primary = 'me'; S.notifs = [{ id: ++S.seq, t: '¡Bienvenido/a a TurnAR!', x: 'Ya podés sacar tu primer turno.', n: true }]; S.stack = []; S.screen = 'home'; render(); },
    tab(v) { root(v); }, homeRoot() { root('home'); },
    leaveManage() { S.cur = S.primary; render(); },
    switcher() { sheet({ t: 'switch' }); },
    switchTo(v) { S.cur = v; S.modal = null; S.stack = []; S.screen = 'home'; S.tab = 'home'; render(); toast('Ahora gestionás a ' + P().name); },
    famAdd() { sheet({ t: 'fam' }); },
    doFam() { const n = $('#fn').value.trim(), r = $('#fr').value.trim(), a = +$('#fa').value; if (n.split(/\s+/).length < 2 || !r || !(a > 0 && a < 120)) { $('#merr').textContent = 'Completá nombre y apellido, vínculo y edad.'; return; } const id = uid('f'); S.persons[id] = { id, name: n, ini: initials(n), rel: r, age: a, dni: '—', covs: [], appts: [], studies: [], pays: [], wait: [] }; S.cur = id; S.modal = null; S.stack = []; S.screen = 'home'; render(); toast('Agregaste a ' + n); },
    covAdd() { sheet({ t: 'cov' }); },
    doCov() { const n = $('#cn').value.trim(), num = digits($('#cnum').value); if (n.length < 3 || num.length < 6) { $('#merr').textContent = 'Poné el nombre y un número de afiliado de 6 dígitos o más.'; return; } const id = uid('c'); P().covs.push({ id, name: n, detail: 'Afiliado/a ' + num, copay: { cons: 4800, img: 7500 } }); if (S.bk) S.bk.covId = id; S.modal = null; render(); toast('Vinculaste ' + n); },
    ts(v) { S.ts = +v; render(); },
    toggle(v) { S.set[v] = !S.set[v]; render(); },
    logout() { S.stack = []; S.screen = 'welcome'; render(); },
    chat() { sheet({ t: 'chat' }); },
    chatSend() { const i = $('#chatin'), x = i.value.trim(); if (!x) return; S.chat.push({ w: 'me', x }); i.value = ''; showOverlay(); setTimeout(() => { S.chat.push({ w: 'cl', x: 'Recibimos tu mensaje (simulado). En la versión real te contesta recepción en el horario de atención.' }); if (S.modal && S.modal.t === 'chat') { const l = $('#chatlog'); if (l) { l.innerHTML = chatHtml(); l.scrollTop = 1e6; } } save(); }, 900); save(); },

    /* turnos */
    confirmAsk(v) { sheet({ t: 'confirm', id: v }); },
    doConfirm(v) { const f = findAppt(v); if (f) { f.a.confirmed = true; notify('Asistencia confirmada', (f.a.title || f.a.spec) + ' · ' + whenCap(f.a.date, f.a.time)); } S.modal = null; render(); toast('¡Gracias! Confirmaste tu asistencia.'); },
    cancelAsk(v) { sheet({ t: 'cancel', id: v }); },
    doCancel(v) { const f = findAppt(v); if (f) { f.p.appts = f.p.appts.filter((a) => a.id !== v); notify('Turno cancelado', (f.a.title || f.a.spec) + ' · ' + longDate(f.a.date)); } S.modal = null; if (S.screen === 'appt') { S.stack = []; S.screen = 'home'; } render(); toast('Cancelaste el turno. El horario quedó libre.'); },
    openAppt(v) { S.appt = v; go('appt'); },
    how() { toast('En el prototipo el mapa es de ejemplo.'); },
    resched(v) { const f = findAppt(v); if (!f) return; const dkind = f.a.docId === 'img' ? 'img' : 'consult'; const d0 = T.firstAvail(S, [f.a.docId], v); const dt = d0 ? T.parse(d0.iso) : T.TODAY; S.bk = { kind: dkind, spec: (T.SPECS.find((s) => s.docs.includes(f.a.docId)) || {}).id, docId: f.a.docId, resched: v, vm: { y: dt.getFullYear(), m: dt.getMonth() }, date: null, time: null, img: f.a.img }; if (f.p.id !== S.cur) S.cur = f.p.id; go('bookTime'); },
    newBook() { S.bk = { kind: 'consult', q: '', vm: { y: 2026, m: 7 } }; go('bookSpec'); },
    pickSpec(v) { const s = T.SPECS.find((x) => x.id === v); S.bk.spec = v; S.bk.kind = s.order ? 'img' : 'consult'; S.bk.docId = s.order ? 'img' : null; go(s.order ? 'imgList' : 'bookDoc'); },
    pickDoc(v) { S.bk.docId = v; render(); },
    waitOpen(v) { S.bk.wait = v; go('waitlist'); },
    joinWait(v) { if (!P().wait.includes(v)) P().wait.push(v); notify('Estás en la lista de espera', T.DOCS[v].name + ' · te avisamos cuando haya un turno.'); render(); toast('Te sumaste a la lista de espera.'); },
    docNext() { gotoTime(); },
    pickImg(v) { S.bk.img = v; render(); }, imgNext() { go('imgOrder'); },
    pickFile(v) { const f = $('#file'); if (v === 'cam') f.setAttribute('capture', 'environment'); else f.removeAttribute('capture'); f.accept = v === 'pdf' ? 'application/pdf' : 'image/*,application/pdf'; f.click(); },
    rmFile() { S.bk.file = null; render(); }, orderNext() { gotoTime(); },
    month(v) { const b = S.bk; let m = b.vm.m + +v, y = b.vm.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } b.vm = { y, m }; render(); },
    pickDay(v) { S.bk.date = v; S.bk.time = null; render(); },
    pickTime(v) { S.bk.time = v; render(); },
    timeNext(v) { const b = S.bk; b.docResolved = v || docsForTime()[0];
      if (b.resched) { const f = findAppt(b.resched); f.a.date = b.date; f.a.time = b.time; f.a.docId = b.docResolved; f.a.room = T.DOCS[b.docResolved].room; f.a.confirmed = false; notify('Turno reprogramado', (f.a.title || f.a.spec) + ' · ' + whenCap(b.date, b.time)); S.done = { resched: true, id: f.a.id, title: f.a.title || f.a.spec, date: b.date, time: b.time, doc: docName(f.a) }; S.bk = null; S.stack = []; S.screen = 'bookDone'; render(); return; }
      if (!b.covId) b.covId = (P().covs[0] || T.PART).id; go('bookCoverage'); },
    pickCov(v) { S.bk.covId = v; render(); }, covNext() { go('bookReview'); },
    confirmBook() { const b = S.bk, p = P(), cov = covOf(p, b.covId), copay = T.copayOf(cov, b.kind), d = T.DOCS[b.docResolved]; const title = b.kind === 'img' ? T.IMG[b.img].name : T.SPECS.find((s) => s.id === b.spec).name;
      const a = { id: uid('a'), docId: d.id, spec: title, title, date: b.date, time: b.time, room: d.room, covId: b.covId, copay, paid: copay === 0, confirmed: false, img: b.img }; p.appts.push(a); if (b.kind === 'img') a.spec = 'Diagnóstico por imágenes';
      notify('Turno confirmado', title + ' · ' + longDate(a.date) + ', ' + a.time + ' hs'); S.done = { id: a.id, title, date: a.date, time: a.time, doc: d.name }; S.bk = null; S.stack = []; S.screen = 'bookDone'; render(); },
    ics(v) { const f = findAppt(v); if (!f) return; const a = f.a, z = (n) => String(n).padStart(2, '0'), d = T.parse(a.date), [h, m] = a.time.split(':').map(Number), st = '' + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + 'T' + z(h) + z(m) + '00', en = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m + 30), es = '' + en.getFullYear() + z(en.getMonth() + 1) + z(en.getDate()) + 'T' + z(en.getHours()) + z(en.getMinutes()) + '00';
      const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TurnAR prototipo//ES', 'BEGIN:VEVENT', 'UID:' + a.id + '@turnar-prototipo', 'DTSTAMP:20260810T094100', 'DTSTART:' + st, 'DTEND:' + es, 'SUMMARY:' + (a.title || a.spec) + ' (TurnAR)', 'LOCATION:' + a.room, 'DESCRIPTION:' + docName(a) + ' - turno de ejemplo del prototipo', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      try { const u = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); const l = document.createElement('a'); l.href = u; l.download = 'turno-turnar.ics'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); toast('Se descargó el evento para tu calendario.'); } catch (e) { toast('No se pudo generar el archivo.'); } },

    /* estudios */
    openStudy(v) { S.study = v; const s = P().studies.find((x) => x.id === v); if (s) s.fresh = false; go('study'); },
    report() { toast('Informe de ejemplo: en la app real se abre el PDF.'); },
    shareAsk() { sheet({ t: 'share' }); },
    doShare() { const m = $('#shmail').value.trim(); if (!/^\S+@\S+\.\S+$/.test(m)) { $('#merr').textContent = 'Revisá el correo: falta algo.'; return; } S.modal = null; showOverlay(); toast('Simulado: no se envió nada a ' + m); },
    bookBeni() { S.bk = { kind: 'consult', spec: 'cardio', docId: 'benitez', vm: { y: 2026, m: 7 } }; S.stack.push(S.screen); gotoTime(true); },

    /* pagos */
    payFor(v) { S.pay = { apptId: v, method: 'visa' }; go('pay'); },
    payMethod(v) { if (v === 'other') toast('En el prototipo no se cargan tarjetas.'); S.pay.method = v; render(); },
    payGo() { const f = findAppt(S.pay.apptId), a = f.a, desk = S.pay.method === 'desk'; const no = '8842-' + (11907 + S.seq++); if (!desk) { a.paid = true; f.p.pays.unshift({ what: 'Coseguro · ' + (a.title || a.spec), amount: a.copay, no, how: 'Visa 4417' }); notify('Pago realizado', money(a.copay) + ' · comprobante N° ' + no); } S.payDone = { amount: a.copay, no, desk }; S.stack = []; S.screen = 'payDone'; render(); },

    /* arranque desde el panel y push */
    startRegister() { wipe(); S = fresh(); render(); },
    startHome() { wipe(); demo(); render(); },
    startPush() { wipe(); demo(); S.screen = 'push'; render(); },
    reset() { wipe(); S = fresh(); render(); },
    pushYes() { const nx = upcoming(S.persons[S.primary])[0]; if (nx) { nx.confirmed = true; notify('Asistencia confirmada', (nx.title || nx.spec) + ' · ' + whenCap(nx.date, nx.time)); } S.screen = 'home'; S.stack = []; render(); toast('¡Gracias! Confirmaste tu asistencia.'); },
    pushNo() { const nx = upcoming(S.persons[S.primary])[0]; S.screen = 'home'; S.stack = []; render(); if (nx) sheet({ t: 'cancel', id: nx.id }); }
  };
  function gotoTime(skipPush) { const b = S.bk, ids = docsForTime(), f = T.firstAvail(S, ids, b.resched); if (f) { const d = T.parse(f.iso); b.vm = { y: d.getFullYear(), m: d.getMonth() }; b.date = f.iso; } b.time = null; if (skipPush) { S.screen = 'bookTime'; render(); } else go('bookTime'); }

  /* ====================== Eventos ====================== */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    if (t.dataset.act === 'scrim') { if (e.target === t) closeSheet(); return; }
    const fn = ACT[t.dataset.act]; if (fn && !t.disabled) fn(t.dataset.v);
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.code != null) { const i = +t.dataset.code, v = t.value.replace(/\D/g, '').slice(-1); t.value = v; S.reg.code[i] = v; S.reg.codeErr = ''; $('#cerr').textContent = ''; $('#cb').classList.remove('bad'); if (v && i < 5) view.querySelector('[data-code="' + (i + 1) + '"]').focus(); refresh(); return; }
    if (t.dataset.in) { let v = t.value; if (t.dataset.digits) { v = v.replace(/\D/g, ''); if (t.value !== v) t.value = v; } if (t.dataset.in === 'reg.dni') { } setPath(t.dataset.in, v);
      if (t.dataset.liveList) { const l = $('#speclist'); const q = v.toLowerCase(); l.innerHTML = specRows(T.SPECS.filter((s) => s.name.toLowerCase().includes(q))); save(); return; }
      if (t.dataset.rerender) { render(); return; } refresh(); }
  });
  document.addEventListener('keydown', (e) => { const t = e.target; if (t.dataset && t.dataset.code != null && e.key === 'Backspace' && !t.value && +t.dataset.code > 0) { const p = view.querySelector('[data-code="' + (+t.dataset.code - 1) + '"]'); p.value = ''; S.reg.code[+t.dataset.code - 1] = ''; p.focus(); e.preventDefault(); refresh(); } if (e.key === 'Enter' && t.id === 'chatin') ACT.chatSend(); if (e.key === 'Escape' && S.modal) closeSheet(); });
  document.addEventListener('paste', (e) => { const t = e.target; if (t.dataset && t.dataset.code != null) { const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (!d) return; e.preventDefault(); for (let i = 0; i < 6; i++) { S.reg.code[i] = d[i] || ''; const el = view.querySelector('[data-code="' + i + '"]'); if (el) el.value = d[i] || ''; } refresh(); } });
  document.addEventListener('change', (e) => { const t = e.target; if (t.id === 'file' && t.files && t.files[0]) { const f = t.files[0]; if (f.size > 15 * 1048576) { toast('El archivo pesa más de 15 MB.'); return; } S.bk.file = { name: f.name, size: f.size > 1048576 ? (f.size / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB' }; render(); } });

  /* ====================== Arranque ====================== */
  S = load() || fresh();
  render();
})();
