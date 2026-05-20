// ============================================================
// CONFIGURACIÓN
// ============================================================
const SECTION_CONFIG = {
  herbicidas:    { icon:'fa-solid fa-spray-can-sparkles', color:'bg-lime-500/30',   text:'text-lime-200',   hdr:'from-lime-700 to-lime-600'     },
  insecticidas:  { icon:'fa-solid fa-bug',               color:'bg-orange-500/30', text:'text-orange-200', hdr:'from-orange-700 to-orange-600' },
  acaricidas:    { icon:'fa-solid fa-spider',            color:'bg-red-500/30',    text:'text-red-200',    hdr:'from-red-700 to-red-600'       },
  fungicidas:    { icon:'fa-solid fa-bacterium',         color:'bg-purple-500/30', text:'text-purple-200', hdr:'from-purple-700 to-purple-600' },
  molusquicidas: { icon:'fa-solid fa-shrimp',            color:'bg-cyan-500/30',   text:'text-cyan-200',   hdr:'from-cyan-700 to-cyan-600'     },
  fertilizantes: { icon:'fa-solid fa-flask',             color:'bg-yellow-500/30', text:'text-yellow-200', hdr:'from-yellow-700 to-yellow-600' },
  desechos:      { icon:'fa-solid fa-trash-can',         color:'bg-rose-500/30',   text:'text-rose-200',   hdr:'from-rose-800 to-rose-700'     },
  salidas:       { icon:'fa-solid fa-arrow-right-from-bracket', color:'bg-indigo-500/30', text:'text-indigo-200', hdr:'from-indigo-700 to-indigo-600' },
  reetiquetados: { icon:'fa-solid fa-tag', color:'bg-teal-500/30', text:'text-teal-200', hdr:'from-teal-700 to-teal-600' },
};

// Secciones excluidas de la Tabla General
const EXCLUDED_FROM_GENERAL = new Set(['desechos', 'salidas', 'reetiquetados']);

const ROWS_PER_PAGE = 30;

const AUTH_KEY = 'agroInventarioAuth_v1';
const AUTH_USER = '75165226';
const AUTH_PASS = '123';
const SESSION_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutos

function getAuthInfo() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { localStorage.removeItem(AUTH_KEY); return null; }
}

function saveAuthInfo(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function clearAuthInfo() {
  localStorage.removeItem(AUTH_KEY);
}

function isAuthenticated() {
  const auth = getAuthInfo();
  return !!(auth && auth.user === AUTH_USER && auth.loggedIn && typeof auth.lastActivity === 'number' && (Date.now() - auth.lastActivity) < SESSION_TIMEOUT_MS);
}

function updateAuthUi() {
  const btn = document.getElementById('logoutBtn');
  if (btn) btn.style.display = isAuthenticated() ? 'inline-flex' : 'none';
}

function updateActivity() {
  const auth = getAuthInfo();
  if (!auth || !auth.loggedIn) return;
  auth.lastActivity = Date.now();
  saveAuthInfo(auth);
}

function checkInactivity() {
  const auth = getAuthInfo();
  if (!auth || !auth.loggedIn) return;
  if (Date.now() - auth.lastActivity >= SESSION_TIMEOUT_MS) {
    logout(true);
  }
}

function showLogin(message = 'Ingresa tus credenciales para continuar.') {
  const overlay = document.getElementById('loginOverlay');
  const errorEl = document.getElementById('loginError');
  const form = document.getElementById('loginForm');
  if (overlay) overlay.classList.add('open');
  if (errorEl) { errorEl.textContent = ''; }
  if (form) form.reset();
  document.getElementById('loginMessage').textContent = message;
  hidePageLoader(0);
  document.body.classList.add('app-locked');
  updateAuthUi();
  const userInput = document.getElementById('loginUser');
  if (userInput) userInput.focus();
}

function hideLogin() {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.classList.remove('app-locked');
  hidePageLoader(0);
  updateAuthUi();
}

function loginUser(username, password) {
  if (username === AUTH_USER && password === AUTH_PASS) {
    saveAuthInfo({ user: AUTH_USER, loggedIn: true, lastActivity: Date.now() });
    hideLogin();
    renderAll();
    return true;
  }
  const errorEl = document.getElementById('loginError');
  if (errorEl) errorEl.textContent = 'Usuario o contraseña incorrectos.';
  return false;
}

function logout(expired = false) {
  clearAuthInfo();
  updateAuthUi();
  showLogin(expired ? 'Tu sesión expiró por inactividad. Vuelve a ingresar.' : 'Sesión cerrada. Ingresa de nuevo.');
  if (!expired) showToast('Sesión cerrada', 'error');
}

function setupSessionWatchers() {
  const events = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
  events.forEach(evt => document.addEventListener(evt, updateActivity, { passive: true }));
  setInterval(checkInactivity, 30 * 1000);
}

// ============================================================
// BADGES
// ============================================================
function presentacionBadge(val) {
  const v = (val||'').toLowerCase().trim();
  if (v.includes('frasco'))
    return `<span class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-300"><i class="fa-solid fa-bottle-droplet text-[10px]"></i> ${val}</span>`;
  if (v.includes('vid')||v.includes('galon')||v.includes('balde'))
    return `<span class="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-300"><i class="fa-solid fa-jug-detergent text-[10px]"></i> ${val}</span>`;
  if (v.includes('bolsa')||v.includes('sobre'))
    return `<span class="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-300"><i class="fa-solid fa-bag-shopping text-[10px]"></i> ${val}</span>`;
  return `<span class="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-300"><i class="fa-solid fa-box text-[10px]"></i> ${val}</span>`;
}

function condicionBadge(val) {
  const v = (val||'').toLowerCase();
  if (v==='buen estado')
    return `<span class="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200"><i class="fa-solid fa-circle-check text-green-500 text-[10px]"></i> ${val}</span>`;
  if (v.includes('vacío')||v.includes('vacio')||v.includes('derramado')||v.includes('mal estado')||v.includes('dañado'))
    return `<span class="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-200"><i class="fa-solid fa-triangle-exclamation text-red-500 text-[10px]"></i> MAL ESTADO</span>`;
  if (v.includes('poco')||v.includes('etiqueta')||v.includes('empaque')||v.includes('contenido'))
    return `<span class="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-yellow-200"><i class="fa-solid fa-circle-exclamation text-yellow-500 text-[10px]"></i> ${val}</span>`;
  return `<span class="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-gray-200"><i class="fa-solid fa-circle-info text-gray-400 text-[10px]"></i> ${val}</span>`;
}

// ============================================================
// PAGINACIÓN BÁSICA (30 por página)
// ============================================================
function buildPagination(currentPage, totalPages, viewKey) {
  if (totalPages <= 1) return '';
  const prev = currentPage > 1 ? `<button onclick="goPage('${viewKey}',${currentPage-1})" class="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition"><i class="fa-solid fa-chevron-left text-xs"></i> Anterior</button>` : `<button disabled class="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-400 text-sm font-semibold cursor-not-allowed"><i class="fa-solid fa-chevron-left text-xs"></i> Anterior</button>`;
  const next = currentPage < totalPages ? `<button onclick="goPage('${viewKey}',${currentPage+1})" class="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition">Siguiente <i class="fa-solid fa-chevron-right text-xs"></i></button>` : `<button disabled class="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-400 text-sm font-semibold cursor-not-allowed">Siguiente <i class="fa-solid fa-chevron-right text-xs"></i></button>`;
  let pages = '';
  for (let i = 1; i <= totalPages; i++) {
    pages += `<button onclick="goPage('${viewKey}',${i})" class="w-8 h-8 rounded-lg text-sm font-bold transition ${i===currentPage ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}">${i}</button>`;
  }
  return `<div class="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-gray-50">
    <span class="text-xs text-gray-500">Página <strong>${currentPage}</strong> de <strong>${totalPages}</strong></span>
    <div class="flex items-center gap-1">${prev} ${pages} ${next}</div>
  </div>`;
}

function goPage(viewKey, page) {
  const vs = getVS(viewKey);
  vs.page = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderView();
}

// ============================================================
// ESTADO DE VISTAS (búsqueda + página)
// ============================================================
const viewState = {};
function getVS(key) {
  if (!viewState[key]) viewState[key] = { page: 1, search: '', catFilter: 'all' };
  return viewState[key];
}

// ============================================================
// BASE DE DATOS
// ============================================================
const DB_KEY = 'agroInventarioDB_v5';
const DB_META_KEY = 'agroInventarioDB_v5_meta';

function getLocalDBMeta() {
  const raw = localStorage.getItem(DB_META_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { localStorage.removeItem(DB_META_KEY); return null; }
}

function getLocalDBUpdatedAt() {
  const meta = getLocalDBMeta();
  return meta && typeof meta.updatedAt === 'number' ? meta.updatedAt : 0;
}

function saveLocalDBMeta(updatedAt) {
  localStorage.setItem(DB_META_KEY, JSON.stringify({ updatedAt }));
}

function getProductTotal(p) {
  return Number(p.cantidad || 0) * Number(p.precio || 0);
}

function normalizeInventoryData(data) {
  if (!data || !Array.isArray(data.sections)) return data;
  let changed = false;
  data.sections.forEach(sec => {
    if (sec.id === 'salidas' || !Array.isArray(sec.products)) return;
    sec.products.forEach(p => {
      const esperado = getProductTotal(p);
      if (Number(p.total || 0) !== esperado) {
        p.total = esperado;
        changed = true;
      }
    });
  });
  if (changed) saveDB(data);
  return data;
}

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      return normalizeInventoryData(JSON.parse(raw));
    } catch (err) {
      console.warn('DB corrupto, regenerando inventario:', err);
      localStorage.removeItem(DB_KEY);
    }
  }
  const initial = { sections: [
    { id:'herbicidas', name:'HERBICIDAS', products:[
      {producto:'RAPIBROT 50SL',          cantidad:5,   precio:26,  total:130,  presentacion:'Frasco',vencimiento:'09/2026',    estado:'BUEN ESTADO',             observacion:'',activo:true},
      {producto:'AXIMASS X 1LT',          cantidad:1,   precio:26,  total:26,   presentacion:'Frasco',vencimiento:'01/06/2025', estado:'BUEN ESTADO',             observacion:'',activo:true},
      {producto:'VIDACROP 240SL X 1LT',   cantidad:1,   precio:45,  total:45,   presentacion:'Frasco',vencimiento:'SIN FECHA',  estado:'BUEN ESTADO',             observacion:'',activo:true},
      {producto:'RAPIBROT X 4LT',         cantidad:20,  precio:86,  total:1720, presentacion:'Vidón', vencimiento:'04/2026',    estado:'BUEN ESTADO',             observacion:'',activo:true},
      {producto:'DUPLEX X 250ML',         cantidad:1,   precio:1,   total:1,    presentacion:'Frasco',vencimiento:'08/2019',    estado:'UN POCO DAÑADO ETIQUETA', observacion:'Etiqueta despegada',activo:true},
      {producto:'AFALON 500SC X 250CC',   cantidad:140, precio:20,  total:2800, presentacion:'Frasco',vencimiento:'09/2025',    estado:'BUEN ESTADO',             observacion:'',activo:true},
      {producto:'TRUENO GALONERA X 4 LT', cantidad:1,   precio:80,  total:80,   presentacion:'Frasco',vencimiento:'2025',       estado:'BUEN ESTADO',             observacion:'',activo:true},
    ]},
    { id:'insecticidas', name:'INSECTICIDAS', products:[
      {producto:'INDOXACROP 150SC X 250ML',       cantidad:4,  precio:54,  total:216, presentacion:'Frasco',vencimiento:'03/2026',      estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'ARMADOR X 200ML',                cantidad:9,  precio:60,  total:540, presentacion:'Frasco',vencimiento:'12/0204',       estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'LAMBFAST X 250ML',               cantidad:6,  precio:25,  total:150, presentacion:'Frasco',vencimiento:'01/2024',       estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'LARVIN PLUS X 1LT',              cantidad:1,  precio:158, total:158, presentacion:'Frasco',vencimiento:'09/2025',       estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'ABAMEX 1.8 EC X LT',             cantidad:1,  precio:49,  total:49,  presentacion:'Frasco',vencimiento:'09/2028',       estado:'MAL ESTADO (VACÍO)',          observacion:'Frasco vacío',activo:true},
      {producto:'SIL-ODIN X 100GR',               cantidad:10, precio:33,  total:330, presentacion:'Bolsa', vencimiento:'25/11/2023',    estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'VESPA X 1KG',                    cantidad:4,  precio:40,  total:160, presentacion:'Bolsa', vencimiento:'12/2025',       estado:'UN POCO DAÑADO EL EMPAQUE',  observacion:'Rotura en esquina',activo:true},
      {producto:'BUPROFEN 250WP X 250GR',         cantidad:3,  precio:15,  total:45,  presentacion:'Bolsa', vencimiento:'11/03/2026',    estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'BALANTA X 250GR',                cantidad:3,  precio:30,  total:90,  presentacion:'Bolsa', vencimiento:'11/03/2026',    estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'REMATA X 100GR',                 cantidad:1,  precio:18,  total:18,  presentacion:'Bolsa', vencimiento:'10/1015',       estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'BIDRIN X 250ML',                 cantidad:1,  precio:58,  total:58,  presentacion:'Frasco',vencimiento:'SIN FECHA',     estado:'ETIQUETA DAÑADA',            observacion:'Etiqueta ilegible',activo:true},
      {producto:'PIRATE X 250ML',                 cantidad:3,  precio:1,   total:3,   presentacion:'Frasco',vencimiento:'SIN FECHA',     estado:'PRODUCTO DAÑADO - DERRAMADO',observacion:'Frasco con residuos',activo:true},
      {producto:'ARTILLERO 250L',                 cantidad:1,  precio:28,  total:28,  presentacion:'Frasco',vencimiento:'31/12/2024',    estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'EMACTIN 5%SG X 100GR',           cantidad:1,  precio:12,  total:12,  presentacion:'Frasco',vencimiento:'02/2026',       estado:'POCO CONTENIDO',             observacion:'20% restante',activo:true},
      {producto:'IMIDAMIN 350 SC BOTTLE X 250CC', cantidad:1,  precio:16,  total:16,  presentacion:'Frasco',vencimiento:'SIN FECHA',     estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'DARESYS 250EC X 250ML',          cantidad:4,  precio:70,  total:280, presentacion:'Frasco',vencimiento:'SIN FECHA',     estado:'MAL ESTADO',                 observacion:'Deterioro visible',activo:true},
      {producto:'NOSTOC 40 OD X 1 LT',            cantidad:3,  precio:32,  total:96,  presentacion:'Frasco',vencimiento:'noviembre 2025',estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'PIRATE X 1LT',                   cantidad:1,  precio:60,  total:60,  presentacion:'Frasco',vencimiento:'SIN FECHA',     estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'MARSHAL X 1LT',                  cantidad:1,  precio:1,   total:1,   presentacion:'Frasco',vencimiento:'2025',          estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'SOLVIGO X LT',                   cantidad:1,  precio:292, total:292, presentacion:'Frasco',vencimiento:'SIN FECHA',     estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'GUSADRIN X1KG',                  cantidad:17, precio:1,   total:17,  presentacion:'Bolsa', vencimiento:'05/2020',       estado:'BUEN ESTADO',                observacion:'',activo:true},
      {producto:'AVENGER 20SP X 100GR',           cantidad:8,  precio:12,  total:96,  presentacion:'Bolsa', vencimiento:'01/2026',       estado:'BUEN ESTADO',                observacion:'',activo:true},
    ]},
    { id:'acaricidas', name:'ACARICIDAS', products:[
      {producto:'CLOFEDYN X 1LT',      cantidad:30,precio:170,total:5100,presentacion:'Frasco',vencimiento:'12/2025',  estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'OCAREN X 1LT',        cantidad:3, precio:94, total:282, presentacion:'Frasco',vencimiento:'04/2021',  estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'SANAMITE X KG',       cantidad:2, precio:1,  total:2,   presentacion:'Bolsa', vencimiento:'11/2025',  estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'LUXATRIN X 250ML',    cantidad:3, precio:63, total:189, presentacion:'Frasco',vencimiento:'SIN FECHA',estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'INVENTO X 250ML',     cantidad:1, precio:250,total:250, presentacion:'Frasco',vencimiento:'10/2025',  estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'DOMINEX X 250ML',     cantidad:1, precio:25, total:25,  presentacion:'Frasco',vencimiento:'01/2026',  estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'ARAGON X LT',         cantidad:2, precio:512,total:1024,presentacion:'Frasco',vencimiento:'SIN FECHA',estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'BENPROX 250SC X 1LT', cantidad:5, precio:65, total:325, presentacion:'Frasco',vencimiento:'SIN FECHA',estado:'BUEN ESTADO',observacion:'',activo:true},
    ]},
    { id:'fungicidas', name:'FUNGICIDAS', products:[
      {producto:'VIVANDO SC X 1LT',           cantidad:3,  precio:690, total:2070, presentacion:'Frasco',vencimiento:'03/2026',                  estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'ESPIGOLD X 1LT',             cantidad:19, precio:40,  total:760,  presentacion:'Frasco',vencimiento:'8/2026',                   estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'FLOWER X 1LT',               cantidad:24, precio:90,  total:2160, presentacion:'Frasco',vencimiento:'5 AÑOS DE SU FORMULACIÓN', estado:'EXCELENTE ESTADO',               observacion:'',activo:true},
      {producto:'SAETA 75 WP X 100GR',        cantidad:58, precio:22,  total:1276, presentacion:'Bolsa', vencimiento:'01/10/0205',               estado:'EXCELENTE ESTADO',               observacion:'',activo:true},
      {producto:'LUNA TRANQUILITY',           cantidad:2,  precio:355, total:710,  presentacion:'Frasco',vencimiento:'04/2026',                  estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'TRIBUNAL 500WG X 100GR',     cantidad:23, precio:35,  total:805,  presentacion:'Bolsa', vencimiento:'03/2026',                  estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'POSEIDON 62.5WG X 100GR',    cantidad:2,  precio:40,  total:80,   presentacion:'Bolsa', vencimiento:'10/2025',                  estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'EPICO 750WG X 100GR',        cantidad:1,  precio:24,  total:24,   presentacion:'Bolsa', vencimiento:'03/02/25',                 estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'SCREEN 625WG X 100GR',       cantidad:2,  precio:1,   total:2,    presentacion:'Bolsa', vencimiento:'02/06/21',                 estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'ROYALTY 75WG X 100GR',       cantidad:1,  precio:46,  total:46,   presentacion:'Bolsa', vencimiento:'08/2024',                  estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'RANTES 480WG X 500GR',       cantidad:32, precio:42,  total:1344, presentacion:'Bolsa', vencimiento:'03/2026',                  estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'LUNA TRANQUILITY X 250ML',   cantidad:1,  precio:85,  total:85,   presentacion:'Frasco',vencimiento:'SIN FECHA',               estado:'SEMI BUENO - DAÑADO ETIQUETA',   observacion:'',activo:true},
      {producto:'OPERA 250ML',                cantidad:1,  precio:70,  total:70,   presentacion:'Frasco',vencimiento:'SIN FECHA',               estado:'ESTADO NORMAL',                  observacion:'',activo:true},
      {producto:'CRUCIAL X 250ML',            cantidad:1,  precio:36,  total:36,   presentacion:'Frasco',vencimiento:'10/2023',                  estado:'ESTADO NORMAL',                  observacion:'',activo:true},
      {producto:'SUNFIRE X 250ML',            cantidad:1,  precio:0,   total:0,    presentacion:'Frasco',vencimiento:'05/2023',                  estado:'POCO DERRAMADO',                 observacion:'',activo:true},
      {producto:'FUNDAMENTAL 73WP X 1KG',     cantidad:12, precio:40,  total:480,  presentacion:'Bolsa', vencimiento:'04/2025',                  estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'ROMERIA X LT',               cantidad:10, precio:125, total:1250, presentacion:'Frasco',vencimiento:'AÑO 2026',                 estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'ALMAGOR X 250ML',            cantidad:1,  precio:1,   total:1,    presentacion:'Frasco',vencimiento:'SIN FECHA',               estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'PERDIGON X LT',              cantidad:5,  precio:125, total:625,  presentacion:'Frasco',vencimiento:'2025',                     estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'AMISTAR TOP X 1LT',          cantidad:3,  precio:247, total:741,  presentacion:'Frasco',vencimiento:'08/2024',                  estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'TOPAS X LT',                 cantidad:3,  precio:270, total:810,  presentacion:'Frasco',vencimiento:'2026',                     estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'ENDURA FRASCO X 1LT',        cantidad:1,  precio:210, total:210,  presentacion:'Frasco',vencimiento:'2024',                     estado:'BUEN ESTADO',                    observacion:'',activo:true},

      {producto:'MICROTHIOL X 1KG',           cantidad:1,  precio:15,  total:15,   presentacion:'Bolsa', vencimiento:'2022',                     estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'TEBUZIN X LT',               cantidad:1,  precio:75,  total:75,   presentacion:'Frasco',vencimiento:'02/2027',                  estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'PREZA X LT',                 cantidad:25, precio:750, total:18750,presentacion:'Frasco',vencimiento:'SIN FECHA',               estado:'BUEN ESTADO',                    observacion:'',activo:true},
      {producto:'MASTERCOP X 1LT',            cantidad:3,  precio:1,   total:3,    presentacion:'Frasco',vencimiento:'10/2022',                  estado:'BUEN ESTADO',                    observacion:'',activo:true},
    ]},
    { id:'molusquicidas', name:'MOLUSQUICIDAS', products:[
      {producto:'TIEZO 300WG X 100GR', cantidad:108,precio:42, total:4536, presentacion:'Bolsa',    vencimiento:'09/2025',    estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'SUSTENTO 80 X 1KG',   cantidad:4,  precio:74, total:296,  presentacion:'Bolsa',    vencimiento:'7/2026',     estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'RUDO X KG',           cantidad:6,  precio:50, total:300,  presentacion:'Bolsa',    vencimiento:'04/2026',    estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'MAZON X 100GR',       cantidad:2,  precio:33, total:66,   presentacion:'Bolsa',    vencimiento:'SIN FECHA',  estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'MADUREX X 2KG',       cantidad:14, precio:175,total:2450, presentacion:'Bolsa',    vencimiento:'01/2025',    estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'POUNTRIL',            cantidad:23, precio:5,  total:115,  presentacion:'Pastillas',vencimiento:'20/08/2025', estado:'BUEN ESTADO',observacion:'',activo:true},
    ]},
    { id:'fertilizantes', name:'FERTILIZANTES', products:[
      {producto:'SUPRAZIME X 1LT',              cantidad:114,precio:70, total:7980, presentacion:'Frasco',   vencimiento:'03/2026',           estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'ULTRAFERRO X 5KG',             cantidad:2,  precio:435,total:870,  presentacion:'Bolsa',    vencimiento:'3/2026',            estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'VIBREL X 1LT',                 cantidad:8,  precio:110,total:880,  presentacion:'Frasco',   vencimiento:'03/2026',           estado:'4 NORMALES',   observacion:'',activo:true},
      {producto:'ENZICROP X 1LT',               cantidad:7,  precio:80, total:560,  presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'SIN ETIQUETA', observacion:'',activo:true},
      {producto:'RIZOFARM X 1LT',               cantidad:7,  precio:85, total:595,  presentacion:'Frasco',   vencimiento:'5 AÑOS DE SU FORMULACIÓN',estado:'BUEN ESTADO',observacion:'',activo:true},
      {producto:'CITOONE 1,4% X 1LT',           cantidad:1,  precio:1,  total:1,    presentacion:'Frasco',   vencimiento:'01/2025',           estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'ENZI MAX X 1LT',               cantidad:3,  precio:80, total:240,  presentacion:'Bolsa',    vencimiento:'05/07/2026',        estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'VIGAFIT FOSFITO POTASIO X 1LT',cantidad:2,  precio:50, total:100,  presentacion:'Bolsa',    vencimiento:'2024',              estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'VIGAFIT MAGNESIO X 1LT',       cantidad:3,  precio:25, total:75,   presentacion:'Bolsa',    vencimiento:'2025',              estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'THERRA WATAY X 1LT',           cantidad:11, precio:1,  total:11,   presentacion:'Frasco',   vencimiento:'2026',              estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'EN VIVO X 500ML',              cantidad:1,  precio:135,total:135,  presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'SIN ETIQUETA', observacion:'',activo:true},
      {producto:'SUPRAZIME X 250ML',            cantidad:2,  precio:30, total:60,   presentacion:'Frasco',   vencimiento:'04/2026',           estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'BIOZYME TF X 250ML',           cantidad:1,  precio:0,  total:0,    presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'MIXHOR-PLUS X 250ML',          cantidad:1,  precio:1,  total:1,    presentacion:'Frasco',   vencimiento:'6/2022',            estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'CARBO-FOR',                    cantidad:1,  precio:0,  total:0,    presentacion:'Frasco',   vencimiento:'20/08/2022',        estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'GIBER TAB 125 X PASTILLA',     cantidad:10, precio:6,  total:60,   presentacion:'Pastillas',vencimiento:'01/09/2028',        estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'URKAN',                        cantidad:65, precio:77, total:5005, presentacion:'Frasco',   vencimiento:'junio 2025',        estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'AMINOQUELANT- CA',             cantidad:24, precio:30, total:720,  presentacion:'Frasco',   vencimiento:'junio 2025',        estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'KOYLLOR X 1LT',               cantidad:2,  precio:95, total:190,  presentacion:'Frasco',   vencimiento:'2027',              estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'CODIGO GOLD X LT',             cantidad:2,  precio:1,  total:2,    presentacion:'Frasco',   vencimiento:'2026',              estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'INCENTIVE X 1LT',              cantidad:3,  precio:98, total:294,  presentacion:'Frasco',   vencimiento:'2024',              estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'CAL 40 X 1LT',                cantidad:1,  precio:32, total:32,   presentacion:'Frasco',   vencimiento:'2024',              estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'CAYON X 1LT',                 cantidad:2,  precio:100,total:200,  presentacion:'Frasco',   vencimiento:'09/05/2024',        estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'RYZOGEN X 1LT',               cantidad:4,  precio:35, total:140,  presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'MEGA CROP X 1LT',             cantidad:3,  precio:1,  total:3,    presentacion:'Frasco',   vencimiento:'08/2020',           estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'GEMSTAR X 1LT',               cantidad:1,  precio:1,  total:1,    presentacion:'Frasco',   vencimiento:'2026',              estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'KELTEX BORO X 1LT',           cantidad:3,  precio:25, total:75,   presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'HACHE UNO SUPER X 1LT',       cantidad:4,  precio:180,total:720,  presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'IRONMAN X LT',                cantidad:2,  precio:115,total:230,  presentacion:'Frasco',   vencimiento:'09/2025',           estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'PACZOL X LT',                 cantidad:2,  precio:118,total:236,  presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'CITOGIB X 1LT',               cantidad:3,  precio:515,total:1545, presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'FROTHER X 1LT',               cantidad:4,  precio:22, total:88,   presentacion:'Frasco',   vencimiento:'2026',              estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'WUXAL POTASIO X LT',          cantidad:1,  precio:62, total:62,   presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'BIO KORRECTOR NPK FOSFORO X LT',cantidad:1,precio:1,  total:1,    presentacion:'Frasco',   vencimiento:'8/2025',            estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'PANTERA HUMIMAX X LT',        cantidad:1,  precio:15, total:15,   presentacion:'Frasco',   vencimiento:'31/01/2025',        estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'NUTRIDOR CA-B-ZN',            cantidad:1,  precio:25, total:25,   presentacion:'Frasco',   vencimiento:'09/10/2022',        estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'MULTI-FRUT X 1 KILO',         cantidad:3,  precio:16, total:48,   presentacion:'Bolsa',    vencimiento:'2025',              estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'OLIGOMIX - CO X 100GR',       cantidad:1,  precio:25, total:25,   presentacion:'Bolsa',    vencimiento:'04/2024',           estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'NANO FER X 1KG',              cantidad:1,  precio:1,  total:1,    presentacion:'Bolsa',    vencimiento:'julio 2022',        estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'COASTRAL MIX X 1KG',          cantidad:1,  precio:1,  total:1,    presentacion:'Bolsa',    vencimiento:'SIN FECHA',         estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'KILLER X 1LT',                cantidad:3,  precio:45, total:135,  presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'TRUENO x 1LT',                cantidad:5,  precio:20, total:100,  presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'BUEN ESTADO',  observacion:'',activo:true},
      {producto:'SELLADOR X LT',               cantidad:2,  precio:37, total:74,   presentacion:'Frasco',   vencimiento:'SIN FECHA',         estado:'BUEN ESTADO',  observacion:'',activo:true},
    ]},
    { id:'desechos', name:'DESECHOS', products:[
      {producto:'CARIAL FLEX',                          cantidad:4, precio:35,  total:140, presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Fungicida',                    observacion:'',activo:true},
      {producto:'EN VIVO X 500ML',                      cantidad:1, precio:135, total:135, presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Bioestimulante / Foliar',       observacion:'',activo:true},
      {producto:'CICLON X 1LT',                         cantidad:1, precio:46,  total:46,  presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Insecticida',                   observacion:'',activo:true},
      {producto:'THERON 75WG X 100GR',                  cantidad:1, precio:45,  total:45,  presentacion:'Bolsa',    vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Fungicida',                    observacion:'',activo:true},
      {producto:'IMIDAMIN 350 SC BOTTLE X 250CC',       cantidad:1, precio:16,  total:16,  presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Insecticida',                   observacion:'',activo:true},
      {producto:'BOROFIT X 1LT',                        cantidad:1, precio:25,  total:25,  presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Fertilizante foliar',           observacion:'',activo:true},
      {producto:'PIRATE X 250ML',                       cantidad:1, precio:1,   total:1,   presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Insecticida',                   observacion:'',activo:true},
      {producto:'ACID PH5 x 1 L',                      cantidad:1, precio:25,  total:25,  presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Corrector de pH / Coadyuvante', observacion:'',activo:true},
      {producto:'OCAREN X 1LT',                         cantidad:2, precio:94,  total:188, presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Acaricida',                    observacion:'',activo:true},
      {producto:'BIDRIN X 250ML',                       cantidad:1, precio:58,  total:58,  presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Insecticida',                   observacion:'',activo:true},
      {producto:'ZARIVA SC SAS PROFEPERU COEX 1 LT',   cantidad:2, precio:480, total:960, presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Fungicida',                    observacion:'',activo:true},
      {producto:'GOLDEN X 1LT',                         cantidad:2, precio:60,  total:120, presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Fertilizante foliar',           observacion:'',activo:true},
      {producto:'FURONIL X LT',                         cantidad:1, precio:50,  total:50,  presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Fungicida',                    observacion:'',activo:true},
      {producto:'BULL FIRE X LT',                       cantidad:1, precio:165, total:165, presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Herbicida',                    observacion:'',activo:true},
      {producto:'SUMMUS X LT',                          cantidad:1, precio:54,  total:54,  presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Fertilizante foliar',           observacion:'',activo:true},
      {producto:'QUIMIFOL PP 430 X 1LT',               cantidad:1, precio:35,  total:35,  presentacion:'Frasco',   vencimiento:'SIN FECHA',estado:'BUEN ESTADO',rubro:'Fertilizante foliar',           observacion:'',activo:true},
    ]},
    { id:'salidas', name:'SALIDAS', salidas:[
      {producto:'RAPIBROT X 4LT',  cantidad:5, stock:15, receptor:'ENRIQUE INGA', codigo:'1135',  precio:30,  total:150, observacion:'',          fecha:'13/05/2026'},
      {producto:'TRUENO x 1LT',    cantidad:4, stock:1,  receptor:'ENRIQUE INGA', codigo:'1139',  precio:18,  total:72,  observacion:'DEVOLVIO 1LT', fecha:'13/05/2026'},
      {producto:'TRUENO x 4LT',    cantidad:1, stock:0,  receptor:'ENRIQUE INGA', codigo:'1139',  precio:72,  total:72,  observacion:'',          fecha:'13/05/2026'},
      {producto:'GUSADRIN X1KG',   cantidad:2, stock:15, receptor:'COMPRADOR',    codigo:'14474', precio:10,  total:20,  observacion:'SE HIZO EL PAGO A OLENKA', fecha:'13/05/2026'},
    ]},
    { id:'reetiquetados', name:'REETIQUETADOS', products:[
      {producto:'SUPRAZIME X 1LT',        cantidad:114, reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'ARMADOR X 200ML',        cantidad:9,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'LAMBFAST X 250ML',       cantidad:6,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'VIBREL X 1LT',           cantidad:8,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'CLOFEDYN X 1LT',         cantidad:30,  reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'LUNA TRANQUILITY',       cantidad:2,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'LUNA TRANQUILITY X 250ML',cantidad:1,  reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'OPERA 250ML',            cantidad:1,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'INVENTO X 250ML',        cantidad:1,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'AFALON 500SC X 250CC',   cantidad:140, reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'ROMERIA X LT',           cantidad:10,  reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'DARESYS 250EC X 250ML',  cantidad:3,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'URKAN',                  cantidad:65,  reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'NOSTOC 40 OD X 1 LT',   cantidad:3,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'ARAGON X LT',            cantidad:2,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'KOYLLOR X 1LT',          cantidad:2,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'PERDIGON X LT',          cantidad:5,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'CODIGO GOLD X LT',       cantidad:2,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'INCENTIVE X 1LT',        cantidad:3,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'CAYON X 1LT',            cantidad:2,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'HACHE UNO SUPER X 1LT',  cantidad:4,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'BENPROX 250SC X 1LT',    cantidad:5,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'AMISTAR TOP X 1LT',      cantidad:3,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'IRONMAN X LT',           cantidad:2,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'PACZOL X LT',            cantidad:2,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'TOPAS X LT',             cantidad:3,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'ENDURA FRASCO X 1LT',    cantidad:1,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'SOLVIGO X LT',           cantidad:1,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'CITOGIB X 1LT',          cantidad:3,   reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
      {producto:'PREZA X LT',             cantidad:12,  reetiquetado:false, entregadoA:'', fecha:'', estado:'PENDIENTE', activo:true},
    ]},
  ]};
  saveDB(initial);
  return initial;
}
function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  const now = Date.now();
  saveLocalDBMeta(now);
  window._lastLocalSave = now;
  // Guardar en Firestore si está disponible
  if (window._firestoreSave) {
    window._firestoreSave(db);
    if (window._showSyncIndicator) window._showSyncIndicator('↑ Guardando...');
  }
}

// ============================================================
// ESTADO GLOBAL
// ============================================================
let db = loadDB();
window._lastLocalSave = getLocalDBUpdatedAt();
let pendingDelete = null;
let currentView = 'general';

// ============================================================
// NAVEGACIÓN
// ============================================================
function showPageLoader(message = 'Cargando sección...') {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;
  loader.querySelector('.loader-text').textContent = message;
  loader.classList.remove('hidden');
}

function hidePageLoader(delay = 1000) {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;
  setTimeout(() => loader.classList.add('hidden'), delay);
}

function navigateTo(viewId) {
  if (currentView === viewId) return;
  currentView = viewId;
  document.querySelectorAll('.sidebar-link').forEach(el =>
    el.classList.toggle('active', el.dataset.view === viewId)
  );
  closeMobileSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showPageLoader('Cargando tabla...');
  setTimeout(() => {
    renderView();
    hidePageLoader(1000);
  }, 220);
}

function renderView() {
  const main = document.getElementById('mainContent');
  main.innerHTML = '';
  if (currentView === 'general') {
    updateTopbar('fa-solid fa-table-list', 'Tabla General', 'Todos los productos activos');
    main.appendChild(buildGeneralCard());
  } else if (currentView === 'salidas') {
    updateTopbar('fa-solid fa-arrow-right-from-bracket', 'Salidas', 'Registro de movimientos');
    main.appendChild(buildSalidasCard());
  } else if (currentView === 'reetiquetados') {
    updateTopbar('fa-solid fa-tag', 'Reetiquetados', 'Registro de reetiquetado');
    main.appendChild(buildReetiquetadosCard());
  } else if (currentView.startsWith('inactivos:')) {
    const secId = currentView.replace('inactivos:', '');
    const sec = db.sections.find(s => s.id === secId);
    if (!sec) return;
    const n = sec.products.filter(p => !p.activo).length;
    updateTopbar('fa-solid fa-circle-xmark', `${sec.name} — Inactivos`, `${n} producto${n!==1?'s':''} inactivo${n!==1?'s':''}`);
    main.appendChild(buildInactivosCard(sec));
  } else {
    const sec = db.sections.find(s => s.id === currentView);
    if (!sec) return;
    const cfg = SECTION_CONFIG[sec.id] || { icon: 'fa-solid fa-box' };
    const n = sec.products.filter(p => p.activo).length;
    updateTopbar(cfg.icon, sec.name, `${n} producto${n!==1?'s':''} activo${n!==1?'s':''}`);
    main.appendChild(buildSectionCard(sec));
  }
}

function updateTopbar(icon, title, sub) {
  document.getElementById('topbarIcon').className = `${icon} text-green-600 text-lg`;
  document.getElementById('topbarTitle').textContent = title;
  document.getElementById('topbarSub').textContent = sub;
}

function renderSidebarNav() {
  const container = document.getElementById('sidebarSectionLinks');
  container.innerHTML = '';

  // Secciones normales (excluye salidas y desechos que van aparte)
  const normalSecs = db.sections.filter(s => s.id !== 'salidas' && s.id !== 'desechos' && s.id !== 'reetiquetados');
  normalSecs.forEach(sec => {
    const cfg = SECTION_CONFIG[sec.id] || { icon:'fa-solid fa-box', color:'bg-gray-500/30', text:'text-gray-200' };
    const activos = sec.products.filter(p => p.activo).length;
    const btn = document.createElement('button');
    btn.className = 'sidebar-link w-full text-left';
    btn.dataset.view = sec.id;
    btn.onclick = () => navigateTo(sec.id);
    btn.innerHTML = `
      <span class="icon-wrap ${cfg.color}"><i class="${cfg.icon} ${cfg.text}"></i></span>
      <span class="flex-1">${sec.name}</span>
      ${activos > 0 ? `<span class="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-bold">${activos}</span>` : ''}`;
    container.appendChild(btn);
  });

  // Separador + secciones especiales
  const specialDiv = document.createElement('div');
  specialDiv.innerHTML = `<div class="px-4 mt-4 mb-1"><span class="text-green-400/70 text-[10px] font-bold uppercase tracking-widest">Especiales</span></div>`;
  container.appendChild(specialDiv);

  ['desechos','salidas','reetiquetados'].forEach(id => {
    const sec = db.sections.find(s => s.id === id);
    if (!sec) return;
    const cfg = SECTION_CONFIG[id] || { icon:'fa-solid fa-box', color:'bg-gray-500/30', text:'text-gray-200' };
    const count = id === 'salidas'
      ? (sec.salidas||[]).length
      : sec.products.filter(p => p.activo).length;
    const btn = document.createElement('button');
    btn.className = 'sidebar-link w-full text-left';
    btn.dataset.view = id;
    btn.onclick = () => navigateTo(id);
    btn.innerHTML = `
      <span class="icon-wrap ${cfg.color}"><i class="${cfg.icon} ${cfg.text}"></i></span>
      <span class="flex-1">${sec.name}</span>
      ${count > 0 ? `<span class="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-bold">${count}</span>` : ''}`;
    container.appendChild(btn);
  });
}

function renderAll() { renderSidebarNav(); renderView(); }

// ============================================================
// STATS BOXES
// ============================================================
function statsBoxes(total, activos, inactivos, monto, salidas) {
  const montoFinal = salidas !== undefined ? Number(monto) - Number(salidas) : Number(monto);
  const salidaBox = salidas !== undefined ? `
    <div class="flex flex-col items-center bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 min-w-[130px]">
      <span class="text-xs text-indigo-500 font-semibold uppercase">Salidas</span>
      <span class="text-2xl font-bold text-indigo-700">S/ ${Number(salidas).toFixed(2)}</span>
    </div>` : '';
  return `
    <div class="flex flex-col items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 min-w-[80px]">
      <span class="text-xs text-blue-500 font-semibold uppercase">Total</span>
      <span class="text-2xl font-bold text-blue-700">${total}</span>
    </div>
    <div class="flex flex-col items-center bg-green-50 border border-green-200 rounded-xl px-4 py-2 min-w-[80px]">
      <span class="text-xs text-green-600 font-semibold uppercase">Activos</span>
      <span class="text-2xl font-bold text-green-700">${activos}</span>
    </div>
    <div class="flex flex-col items-center bg-red-50 border border-red-200 rounded-xl px-4 py-2 min-w-[80px]">
      <span class="text-xs text-red-500 font-semibold uppercase">Inactivos</span>
      <span class="text-2xl font-bold text-red-600">${inactivos}</span>
    </div>
    <div class="flex flex-col items-center bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 min-w-[130px]">
      <span class="text-xs text-yellow-600 font-semibold uppercase">Monto Total</span>
      <span class="text-2xl font-bold text-yellow-700">S/ ${montoFinal.toFixed(2)}</span>
    </div>
    ${salidaBox}`;
}

// ============================================================
// TABLA GENERAL — buscador + filtro categoría + paginado 30
// Solo activos. Única acción: Ver Detalles.
// ============================================================
function buildGeneralCard() {
  const vs = getVS('general');

  // Recopilar todos los activos (excluye desechos y salidas)
  const allActive = [];
  db.sections.forEach(sec => {
    if (EXCLUDED_FROM_GENERAL.has(sec.id)) return;
    sec.products.forEach((p, i) => {
      if (p.activo) allActive.push({ ...p, secId: sec.id, secName: sec.name, idx: i });
    });
  });

  // Stats globales (excluye desechos y salidas)
  const mainSections = db.sections.filter(s => !EXCLUDED_FROM_GENERAL.has(s.id));
  const totalAll    = mainSections.reduce((s, sec) => s + sec.products.length, 0);
  const totalActivo = allActive.length;
  const totalInact  = mainSections.reduce((s, sec) => s + sec.products.filter(p => !p.activo).length, 0);
  const monto       = mainSections.reduce((s, sec) => s + sec.products.filter(p => p.activo).reduce((ss, p) => ss + getProductTotal(p), 0), 0);

  // Total de salidas
  const salidaSec   = db.sections.find(s => s.id === 'salidas');
  const totalSalidas = salidaSec ? (salidaSec.salidas||[]).reduce((s, r) => s + Number(r.total), 0) : 0;

  // Filtros
  const search = (vs.search || '').toLowerCase().trim();
  const cat    = vs.catFilter || 'all';
  const filtered = allActive.filter(p => {
    const ms = !search || p.producto.toLowerCase().includes(search) ||
      p.estado.toLowerCase().includes(search) ||
      p.presentacion.toLowerCase().includes(search) ||
      p.vencimiento.toLowerCase().includes(search);
    const mc = cat === 'all' || p.secId === cat;
    return ms && mc;
  });

  // Paginado
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  if (vs.page > totalPages) vs.page = totalPages;
  const pageData = filtered.slice((vs.page - 1) * ROWS_PER_PAGE, vs.page * ROWS_PER_PAGE);

  // Opciones categoría (excluye desechos y salidas)
  const catOpts = db.sections.filter(s => !EXCLUDED_FROM_GENERAL.has(s.id)).map(sec =>
    `<option value="${sec.id}" ${cat === sec.id ? 'selected' : ''}>${sec.name}</option>`
  ).join('');

  // Filas
  const rows = pageData.length ? pageData.map(p => {
    const cfg = SECTION_CONFIG[p.secId] || { icon: 'fa-solid fa-box' };
    return `<tr class="border-b border-gray-100 hover:bg-slate-50 transition">
      <td class="px-3 py-2">
        <button onclick="navigateTo('${p.secId}')" class="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full transition">
          <i class="${cfg.icon} text-[10px]"></i> ${p.secName}
        </button>
      </td>
      <td class="px-3 py-2 font-medium text-gray-800">${p.producto}</td>
      <td class="px-3 py-2 text-center">${p.cantidad}</td>
      <td class="px-3 py-2 text-right">S/ ${Number(p.precio).toFixed(2)}</td>
      <td class="px-3 py-2 text-right font-semibold">S/ ${getProductTotal(p).toFixed(2)}</td>
      <td class="px-3 py-2">${presentacionBadge(p.presentacion)}</td>
      <td class="px-3 py-2 text-gray-600">${p.vencimiento}</td>
      <td class="px-3 py-2">${condicionBadge(p.estado)}</td>
      <td class="px-3 py-2 text-center">
        <button onclick="openDetailModal('${p.secId}',${p.idx})" title="Ver detalles"
          class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
          <i class="fa-solid fa-eye text-xs"></i>
        </button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="9" class="text-center py-10 text-gray-400">Sin resultados.</td></tr>`;

  const card = document.createElement('div');
  card.className = 'section-card bg-white rounded-2xl shadow-md overflow-hidden';
  card.innerHTML = `
    <div class="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-5 flex flex-wrap items-center gap-3">
      <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <i class="fa-solid fa-table-list text-white text-lg"></i>
      </div>
      <div>
        <h2 class="text-white font-bold text-xl tracking-wide">TABLA GENERAL</h2>
        <p class="text-slate-300 text-xs">${filtered.length} resultado${filtered.length!==1?'s':''} · solo activos</p>
      </div>
      <div class="flex-1"></div>
      <button onclick="recalcularTotales()" title="Recalcular todos los totales (cantidad × precio)"
        class="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition border border-white/20">
        <i class="fa-solid fa-rotate"></i> Recalcular totales
      </button>
      <button onclick="mostrarDiagnostico()" title="Ver totales por sección"
        class="flex items-center gap-2 bg-yellow-400/80 hover:bg-yellow-400 text-gray-900 font-bold px-3 py-1.5 rounded-xl text-xs transition">
        <i class="fa-solid fa-bug"></i> Diagnóstico
      </button>
    </div>
    <div class="px-6 py-4 flex flex-wrap gap-3 border-b border-gray-100">
      ${statsBoxes(totalAll, totalActivo, totalInact, monto, totalSalidas)}
    </div>
    <!-- Buscador + Filtro -->
    <div class="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3 items-center">
      <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[200px] shadow-sm">
        <i class="fa-solid fa-magnifying-glass text-gray-400 text-sm"></i>
        <input type="text" id="generalSearch" placeholder="Buscar por nombre, condición, presentación..."
          value="${vs.search || ''}"
          oninput="onGeneralSearch(this.value)"
          class="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"/>
        ${vs.search ? `<button onclick="onGeneralSearch('')" class="text-gray-400 hover:text-red-400"><i class="fa-solid fa-xmark text-xs"></i></button>` : ''}
      </div>
      <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
        <i class="fa-solid fa-filter text-green-500 text-sm"></i>
        <select onchange="onGeneralCat(this.value)" class="text-sm outline-none bg-transparent text-gray-700 cursor-pointer">
          <option value="all" ${cat==='all'?'selected':''}>Todas las categorías</option>
          ${catOpts}
        </select>
      </div>
      <span class="text-xs text-gray-400">${filtered.length} de ${totalActivo} productos</span>
    </div>
    <div class="table-wrap px-2 py-2">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-slate-50 text-slate-700 text-xs uppercase">
            <th class="px-3 py-2 text-left font-semibold">Categoría</th>
            <th class="px-3 py-2 text-left font-semibold">Producto</th>
            <th class="px-3 py-2 text-center font-semibold">Cant.</th>
            <th class="px-3 py-2 text-right font-semibold">Precio</th>
            <th class="px-3 py-2 text-right font-semibold">Total</th>
            <th class="px-3 py-2 text-left font-semibold">Presentación</th>
            <th class="px-3 py-2 text-left font-semibold">Vencimiento</th>
            <th class="px-3 py-2 text-left font-semibold">Condición</th>
            <th class="px-3 py-2 text-center font-semibold">Detalle</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${buildPagination(vs.page, totalPages, 'general')}`;
  return card;
}

let _searchTimer = null;
function onGeneralSearch(val) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => {
    const vs = getVS('general'); vs.search = val; vs.page = 1;
    document.getElementById('mainContent').innerHTML = '';
    document.getElementById('mainContent').appendChild(buildGeneralCard());
    // Restaurar foco y cursor al final del input
    const inp = document.getElementById('generalSearch');
    if (inp) { inp.focus(); const len = inp.value.length; inp.setSelectionRange(len, len); }
  }, 300);
}
function onGeneralCat(val) {
  const vs = getVS('general'); vs.catFilter = val; vs.page = 1;
  document.getElementById('mainContent').innerHTML = '';
  document.getElementById('mainContent').appendChild(buildGeneralCard());
}

// ============================================================
// SECCIÓN — solo activos + buscador + paginado 30
// ============================================================
function buildSectionCard(sec) {
  const vs = getVS(sec.id);
  const activosList   = sec.products.filter(p => p.activo);
  const inactivosList = sec.products.filter(p => !p.activo);
  // Monto total: suma TODOS los productos de la sección (activos + inactivos)
  const total = sec.products.reduce((s, p) => s + Number(p.total), 0);
  const cfg   = SECTION_CONFIG[sec.id] || { icon:'fa-solid fa-box', hdr:'from-green-700 to-green-600' };

  const search = (vs.search || '').toLowerCase().trim();
  const filtered = activosList.filter(p =>
    !search ||
    p.producto.toLowerCase().includes(search) ||
    p.estado.toLowerCase().includes(search) ||
    p.presentacion.toLowerCase().includes(search) ||
    p.vencimiento.toLowerCase().includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  if (vs.page > totalPages) vs.page = totalPages;
  const pageData = filtered.slice((vs.page - 1) * ROWS_PER_PAGE, vs.page * ROWS_PER_PAGE);

  const rows = pageData.length
    ? pageData.map(p => buildRow(sec.id, p, sec.products.indexOf(p))).join('')
    : `<tr><td colspan="9" class="text-center py-14 text-gray-400 text-sm">
        <i class="fa-solid fa-box-open text-4xl mb-3 block text-gray-300"></i>
        Sin productos activos.
       </td></tr>`;

  const card = document.createElement('div');
  card.className = 'section-card bg-white rounded-2xl shadow-md overflow-hidden';
  card.innerHTML = `
    <div class="bg-gradient-to-r ${cfg.hdr} px-6 py-5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
          <i class="${cfg.icon} text-white text-lg"></i>
        </div>
        <div>
          <h2 class="text-white font-bold text-xl tracking-wide">${sec.name}</h2>
          <p class="text-white/70 text-xs">${activosList.length} activo${activosList.length!==1?'s':''}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button onclick="navigateTo('inactivos:${sec.id}')"
          class="relative flex items-center gap-2 bg-red-500/80 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition border border-red-400/50">
          <i class="fa-solid fa-circle-xmark"></i> Ver Inactivos
          ${inactivosList.length > 0 ? `<span class="absolute -top-2 -right-2 bg-white text-red-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">${inactivosList.length}</span>` : ''}
        </button>
        <button onclick="openAddProduct('${sec.id}')"
          class="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-sm transition border border-white/30">
          <i class="fa-solid fa-plus"></i> Agregar
        </button>
      </div>
    </div>
    <div class="px-6 py-4 flex flex-wrap gap-3 border-b border-gray-100">
      ${statsBoxes(sec.products.length, activosList.length, inactivosList.length, total)}
    </div>
    <!-- Buscador -->
    <div class="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3 items-center">
      <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[200px] shadow-sm">
        <i class="fa-solid fa-magnifying-glass text-gray-400 text-sm"></i>
        <input type="text" placeholder="Buscar producto..."
          value="${vs.search || ''}"
          oninput="onSecSearch('${sec.id}',this.value)"
          class="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"/>
        ${vs.search ? `<button onclick="onSecSearch('${sec.id}','')" class="text-gray-400 hover:text-red-400"><i class="fa-solid fa-xmark text-xs"></i></button>` : ''}
      </div>
      <span class="text-xs text-gray-400">${filtered.length} de ${activosList.length} productos</span>
    </div>
    <div class="table-wrap px-2 py-2">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-green-50 text-green-800 text-xs uppercase">
            <th class="px-3 py-2 text-left font-semibold">Estado</th>
            <th class="px-3 py-2 text-left font-semibold">Producto</th>
            <th class="px-3 py-2 text-center font-semibold">Cant.</th>
            <th class="px-3 py-2 text-right font-semibold">Precio</th>
            <th class="px-3 py-2 text-right font-semibold">Total</th>
            <th class="px-3 py-2 text-left font-semibold">Presentación</th>
            <th class="px-3 py-2 text-left font-semibold">Vencimiento</th>
            <th class="px-3 py-2 text-left font-semibold">Condición</th>
            <th class="px-3 py-2 text-center font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${buildPagination(vs.page, totalPages, sec.id)}`;
  return card;
}

let _secSearchTimer = null;
function onSecSearch(secId, val) {
  clearTimeout(_secSearchTimer);
  _secSearchTimer = setTimeout(() => {
    const vs = getVS(secId); vs.search = val; vs.page = 1;
    const sec = db.sections.find(s => s.id === secId);
    document.getElementById('mainContent').innerHTML = '';
    document.getElementById('mainContent').appendChild(buildSectionCard(sec));
    // Restaurar foco al input de búsqueda
    const inputs = document.querySelectorAll('#mainContent input[type="text"]');
    if (inputs.length) { const inp = inputs[0]; inp.focus(); const len = inp.value.length; inp.setSelectionRange(len, len); }
  }, 300);
}

// ============================================================
// VISTA INACTIVOS POR SECCIÓN
// ============================================================
function buildInactivosCard(sec) {
  const viewKey = `inactivos:${sec.id}`;
  const vs = getVS(viewKey);
  const inactivosList = sec.products.filter(p => !p.activo);
  const cfg = SECTION_CONFIG[sec.id] || { icon:'fa-solid fa-box' };

  const totalPages = Math.max(1, Math.ceil(inactivosList.length / ROWS_PER_PAGE));
  if (vs.page > totalPages) vs.page = totalPages;
  const pageData = inactivosList.slice((vs.page - 1) * ROWS_PER_PAGE, vs.page * ROWS_PER_PAGE);

  const rows = pageData.length
    ? pageData.map(p => {
        const ri = sec.products.indexOf(p);
        return `<tr class="border-b border-gray-100 hover:bg-red-50/40 transition">
          <td class="px-3 py-2 font-medium text-gray-500">${p.producto}</td>
          <td class="px-3 py-2 text-center text-gray-500">${p.cantidad}</td>
          <td class="px-3 py-2 text-right text-gray-500">S/ ${Number(p.precio).toFixed(2)}</td>
          <td class="px-3 py-2 text-right font-semibold text-gray-500">S/ ${Number(p.total).toFixed(2)}</td>
          <td class="px-3 py-2">${presentacionBadge(p.presentacion)}</td>
          <td class="px-3 py-2 text-gray-400">${p.vencimiento}</td>
          <td class="px-3 py-2">${condicionBadge(p.estado)}</td>
          <td class="px-3 py-2 text-gray-400 text-xs max-w-[160px] truncate" title="${p.observacion||''}">${p.observacion||'—'}</td>
          <td class="px-3 py-2">
            <div class="flex items-center justify-center gap-1">
              <button onclick="openDetailModal('${sec.id}',${ri})" title="Ver detalles"
                class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
                <i class="fa-solid fa-eye text-xs"></i>
              </button>
              <button onclick="restoreProduct('${sec.id}',${ri})"
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-xs transition">
                <i class="fa-solid fa-rotate-left"></i> Restaurar
              </button>
              <button onclick="askPermanentDelete('${sec.id}',${ri})" title="Eliminar permanentemente"
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xs transition">
                <i class="fa-solid fa-trash-can"></i> Borrar
              </button>
            </div>
          </td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="9" class="text-center py-16 text-gray-400 text-sm">
        <i class="fa-solid fa-circle-check text-5xl mb-3 block text-green-300"></i>
        <p class="font-semibold text-gray-500">¡Sin productos inactivos!</p>
       </td></tr>`;

  const card = document.createElement('div');
  card.className = 'section-card bg-white rounded-2xl shadow-md overflow-hidden';
  card.innerHTML = `
    <div class="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-red-500/30 rounded-xl flex items-center justify-center">
          <i class="fa-solid fa-circle-xmark text-red-300 text-lg"></i>
        </div>
        <div>
          <h2 class="text-white font-bold text-xl tracking-wide">INACTIVOS — ${sec.name}</h2>
          <p class="text-gray-300 text-xs">${inactivosList.length} producto${inactivosList.length!==1?'s':''} eliminado${inactivosList.length!==1?'s':''}</p>
        </div>
      </div>
      <button onclick="navigateTo('${sec.id}')"
        class="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-2 rounded-xl text-sm transition border border-white/20">
        <i class="fa-solid fa-arrow-left"></i> Volver a ${sec.name}
      </button>
    </div>
    <div class="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center gap-3">
      <i class="fa-solid fa-circle-info text-red-400 flex-shrink-0"></i>
      <p class="text-xs text-red-600 font-medium">Productos eliminados. Puedes restaurarlos para que vuelvan a estar activos.</p>
    </div>
    <div class="table-wrap px-2 py-3">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-red-50 text-red-700 text-xs uppercase">
            <th class="px-3 py-2 text-left font-semibold">Producto</th>
            <th class="px-3 py-2 text-center font-semibold">Cant.</th>
            <th class="px-3 py-2 text-right font-semibold">Precio</th>
            <th class="px-3 py-2 text-right font-semibold">Total</th>
            <th class="px-3 py-2 text-left font-semibold">Presentación</th>
            <th class="px-3 py-2 text-left font-semibold">Vencimiento</th>
            <th class="px-3 py-2 text-left font-semibold">Condición</th>
            <th class="px-3 py-2 text-left font-semibold">Observación</th>
            <th class="px-3 py-2 text-center font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${buildPagination(vs.page, totalPages, viewKey)}`;
  return card;
}

// ============================================================
// FILA DE TABLA (sección activos)
// ============================================================
function buildRow(secId, p, i) {
  return `<tr class="border-b border-gray-100 hover:bg-gray-50 transition">
    <td class="px-3 py-2">
      <span class="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-300">
        <i class="fa-solid fa-circle text-green-500 text-[8px]"></i> Activo
      </span>
    </td>
    <td class="px-3 py-2 font-medium text-gray-800">${p.producto}</td>
    <td class="px-3 py-2 text-center">${p.cantidad}</td>
    <td class="px-3 py-2 text-right">S/ ${Number(p.precio).toFixed(2)}</td>
    <td class="px-3 py-2 text-right font-semibold">S/ ${Number(p.total).toFixed(2)}</td>
    <td class="px-3 py-2">${presentacionBadge(p.presentacion)}</td>
    <td class="px-3 py-2 text-gray-600">${p.vencimiento}</td>
    <td class="px-3 py-2">${condicionBadge(p.estado)}</td>
    <td class="px-3 py-2">
      <div class="flex items-center justify-center gap-1">
        <button onclick="openDetailModal('${secId}',${i})" title="Ver detalles"
          class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
          <i class="fa-solid fa-eye text-xs"></i>
        </button>
        <button onclick="openEditProduct('${secId}',${i})" title="Editar"
          class="p-1.5 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-600 transition">
          <i class="fa-solid fa-pen text-xs"></i>
        </button>
        <button onclick="askDelete('${secId}',${i})" title="Eliminar"
          class="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-500 transition">
          <i class="fa-solid fa-trash text-xs"></i>
        </button>
      </div>
    </td>
  </tr>`;
}

// ============================================================
// MODAL VER DETALLES
// ============================================================
function openDetailModal(secId, idx) {
  const sec = db.sections.find(s => s.id === secId);
  const p   = sec.products[idx];
  const cfg = SECTION_CONFIG[secId] || { icon:'fa-solid fa-box', hdr:'from-green-700 to-green-600' };
  const activoBadge = p.activo
    ? `<span class="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-300"><i class="fa-solid fa-circle text-green-500 text-[8px]"></i> Activo</span>`
    : `<span class="inline-flex items-center gap-1.5 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full border border-red-300"><i class="fa-solid fa-circle text-red-400 text-[8px]"></i> Inactivo</span>`;

  document.getElementById('detailContent').innerHTML = `
    <!-- Cabecera -->
    <div class="bg-gradient-to-r ${cfg.hdr} -mx-6 -mt-6 px-6 py-5 mb-5 rounded-t-2xl">
      <div class="flex items-start gap-3">
        <div class="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <i class="${cfg.icon} text-white text-xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-white font-bold text-lg leading-tight">${p.producto}</h3>
          <p class="text-white/60 text-xs mt-0.5">${sec.name}</p>
        </div>
        <div class="flex-shrink-0">${activoBadge}</div>
      </div>
    </div>

    <!-- Fila de métricas principales -->
    <div class="grid grid-cols-3 gap-2 mb-4">
      <div class="flex flex-col items-center bg-blue-50 border border-blue-100 rounded-xl py-3 px-2">
        <i class="fa-solid fa-cubes text-blue-400 text-base mb-1"></i>
        <span class="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">Cantidad</span>
        <span class="text-xl font-black text-blue-700 mt-0.5">${p.cantidad}</span>
      </div>
      <div class="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-xl py-3 px-2">
        <i class="fa-solid fa-coins text-yellow-400 text-base mb-1"></i>
        <span class="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Precio</span>
        <span class="text-xl font-black text-gray-700 mt-0.5">S/${Number(p.precio).toFixed(2)}</span>
      </div>
      <div class="flex flex-col items-center bg-yellow-50 border border-yellow-200 rounded-xl py-3 px-2">
        <i class="fa-solid fa-calculator text-yellow-500 text-base mb-1"></i>
        <span class="text-[10px] text-yellow-600 font-semibold uppercase tracking-wide">Total</span>
        <span class="text-xl font-black text-yellow-700 mt-0.5">S/${Number(p.total).toFixed(2)}</span>
      </div>
    </div>

    <!-- Detalles secundarios -->
    <div class="grid grid-cols-2 gap-2 mb-2">
      <div class="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
        <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5">
          <i class="fa-solid fa-bottle-droplet text-blue-400"></i> Presentación
        </p>
        ${presentacionBadge(p.presentacion)}
      </div>
      <div class="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
        <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5">
          <i class="fa-solid fa-calendar-xmark text-red-400"></i> Vencimiento
        </p>
        <span class="text-sm font-semibold text-gray-700">${p.vencimiento}</span>
      </div>
    </div>

    <div class="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-2">
      <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5">
        <i class="fa-solid fa-circle-info text-orange-400"></i> Condición
      </p>
      ${condicionBadge(p.estado)}
    </div>

    ${p.rubro ? `
    <div class="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 mb-2">
      <p class="text-[10px] text-rose-500 font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5">
        <i class="fa-solid fa-tag text-rose-400"></i> Rubro
      </p>
      <span class="inline-flex items-center gap-1 bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full border border-rose-300">${p.rubro}</span>
    </div>` : ''}

    <div class="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
      <p class="text-[10px] text-blue-500 font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5">
        <i class="fa-solid fa-note-sticky text-blue-400"></i> Observación
      </p>
      <p class="text-sm text-gray-700 leading-relaxed">${p.observacion || '<span class="text-gray-400 italic">Sin observaciones</span>'}</p>
    </div>

    <!-- Botón cerrar -->
    <button onclick="closeDetailModal()"
      class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm">
      <i class="fa-solid fa-xmark"></i> Cerrar
    </button>`;
  document.getElementById('detailOverlay').classList.add('open');
}
function closeDetailModal() { document.getElementById('detailOverlay').classList.remove('open'); }

// ============================================================
// MODAL AGREGAR / EDITAR
// ============================================================
const PRESENTACION_OPTS = ['Frasco','Vidón','Bolsa','Sobre','Balde','Galonera','Otro'];

function setupPresentacionField(val) {
  document.getElementById('fPresentacionWrap').innerHTML = `
    <label class="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
      <i class="fa-solid fa-bottle-droplet text-blue-400"></i> Presentación
    </label>
    <select id="fPresentacion" class="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" required>
      ${PRESENTACION_OPTS.map(o => `<option value="${o}" ${o===val?'selected':''}>${o}</option>`).join('')}
    </select>`;
}

function openAddProduct(secId) {
  document.getElementById('modalTitle').textContent = 'Agregar Producto';
  document.getElementById('editSection').value = secId;
  document.getElementById('editIndex').value   = '';
  ['fProducto','fCantidad','fPrecio','fTotal','fVencimiento','fEstado','fRubro','fObservacion'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fActivo').checked = true;
  setupPresentacionField('Frasco');
  document.getElementById('modalOverlay').classList.add('open');
}

function openEditProduct(secId, idx) {
  const sec = db.sections.find(s => s.id === secId);
  const p   = sec.products[idx];
  document.getElementById('modalTitle').textContent = 'Editar Producto';
  document.getElementById('editSection').value  = secId;
  document.getElementById('editIndex').value    = idx;
  document.getElementById('fProducto').value    = p.producto;
  document.getElementById('fCantidad').value    = p.cantidad;
  document.getElementById('fPrecio').value      = p.precio;
  document.getElementById('fTotal').value       = p.total;
  document.getElementById('fVencimiento').value = p.vencimiento;
  document.getElementById('fEstado').value      = p.estado;
  document.getElementById('fRubro').value       = p.rubro || '';
  document.getElementById('fObservacion').value = p.observacion || '';
  document.getElementById('fActivo').checked    = p.activo;
  setupPresentacionField(p.presentacion);
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

// Cálculo automático: cantidad × precio = total
function calcTotal() {
  const cant  = parseFloat(document.getElementById('fCantidad').value) || 0;
  const precio = parseFloat(document.getElementById('fPrecio').value)  || 0;
  document.getElementById('fTotal').value = (cant * precio).toFixed(2);
}

document.getElementById('productForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const secId = document.getElementById('editSection').value;
  const idx   = document.getElementById('editIndex').value;
  const sec   = db.sections.find(s => s.id === secId);
  const prod  = {
    producto:     document.getElementById('fProducto').value.trim(),
    cantidad:     Number(document.getElementById('fCantidad').value),
    precio:       Number(document.getElementById('fPrecio').value),
    total:        Number(document.getElementById('fTotal').value),
    presentacion: document.getElementById('fPresentacion').value,
    vencimiento:  document.getElementById('fVencimiento').value.trim(),
    estado:       document.getElementById('fEstado').value.trim(),
    rubro:        document.getElementById('fRubro').value.trim(),
    observacion:  document.getElementById('fObservacion').value.trim(),
    activo:       document.getElementById('fActivo').checked,
  };
  if (idx === '') { sec.products.push(prod); showToast('Producto agregado', 'success'); }
  else            { sec.products[Number(idx)] = prod; showToast('Producto actualizado', 'info'); }
  saveDB(db);
  closeModal();
  renderAll();
});

// ============================================================
// ELIMINAR — al confirmar va a inactivos de esa categoría
// ============================================================
function askDelete(secId, idx) {
  pendingDelete = { secId, idx };
  document.getElementById('deleteOverlay').classList.add('open');
}
function closeDeleteModal() {
  pendingDelete = null;
  document.getElementById('deleteOverlay').classList.remove('open');
}
document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
  if (_pendingReetDelete !== null) {
    const sec = getReetSec();
    sec.products[_pendingReetDelete].activo = false;
    saveDB(db);
    const idx = _pendingReetDelete;
    _pendingReetDelete = null;
    closeDeleteModal();
    showToast('Registro eliminado', 'error');
    renderAll();
    return;
  }
  if (!pendingDelete) return;
  const { secId, idx } = pendingDelete;
  db.sections.find(s => s.id === secId).products[idx].activo = false;
  saveDB(db);
  closeDeleteModal();
  showToast('Producto eliminado', 'error');
  navigateTo(`inactivos:${secId}`);
});

function restoreProduct(secId, idx) {
  db.sections.find(s => s.id === secId).products[idx].activo = true;
  saveDB(db);
  renderAll();
  showToast('Producto restaurado', 'success');
}

// ============================================================
// ELIMINAR PERMANENTEMENTE
// ============================================================
let pendingPermDelete = null;
function askPermanentDelete(secId, idx) {
  pendingPermDelete = { secId, idx };
  document.getElementById('permDeleteOverlay').classList.add('open');
}
function closePermDeleteModal() {
  pendingPermDelete = null;
  document.getElementById('permDeleteOverlay').classList.remove('open');
}
document.getElementById('confirmPermDeleteBtn').addEventListener('click', function() {
  if (!pendingPermDelete) return;
  const { secId, idx } = pendingPermDelete;
  const sec = db.sections.find(s => s.id === secId);
  sec.products.splice(idx, 1);
  saveDB(db);
  closePermDeleteModal();
  showToast('Producto eliminado permanentemente', 'error');
  navigateTo(`inactivos:${secId}`);
});

// ============================================================
// NUEVA SECCIÓN
// ============================================================
function openAddSectionModal() {
  document.getElementById('fSectionName').value = '';
  document.getElementById('sectionOverlay').classList.add('open');
}
function closeAddSectionModal() { document.getElementById('sectionOverlay').classList.remove('open'); }

document.getElementById('sectionForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('fSectionName').value.trim().toUpperCase();
  if (!name) return;
  const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
  db.sections.push({ id, name, products: [] });
  saveDB(db);
  closeAddSectionModal();
  renderAll();
  showToast(`Sección "${name}" creada`, 'success');
});

// ============================================================
// SIDEBAR TOGGLE
// ============================================================
document.getElementById('sidebarToggle').addEventListener('click', function() {
  const sidebar = document.getElementById('sidebar');
  const wrapper = document.getElementById('main-wrapper');
  const overlay = document.getElementById('sidebarOverlay');
  if (window.innerWidth < 768) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  } else {
    sidebar.classList.toggle('collapsed');
    wrapper.classList.toggle('expanded');
  }
});

function closeMobileSidebar() {
  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  }
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 2800);
}

// ============================================================
// RECALCULAR TODOS LOS TOTALES (cantidad × precio)
// ============================================================
function recalcularTotales() {
  let count = 0;
  db.sections.forEach(sec => {
    if (sec.id === 'salidas') return;
    (sec.products || []).forEach(p => {
      const correcto = p.cantidad * p.precio;
      if (p.total !== correcto) { p.total = correcto; count++; }
    });
  });
  saveDB(db);
  renderAll();
  showToast(count > 0 ? `${count} totales corregidos` : 'Todos los totales ya eran correctos', 'info');
}

function mostrarDiagnostico() {
  const excluir = ['desechos','salidas','reetiquetados'];
  let html = '<div style="font-family:monospace;font-size:12px;line-height:1.7">';
  let grand = 0;
  db.sections.forEach(sec => {
    if (excluir.includes(sec.id)) return;
    const t = (sec.products||[]).filter(p => p.activo).reduce((a,p)=>a+Number(p.total || 0),0);
    grand += t;
    html += `<div style="margin-top:8px;font-size:13px"><b>${sec.name}: S/ ${t}</b></div>`;
    (sec.products||[]).filter(p => p.activo).forEach((p,i) => {
      html += `<div style="padding-left:12px;color:#555">[${i}] ${p.producto} — cant:${p.cantidad} × precio:${p.precio} = <b>${p.total}</b></div>`;
    });
  });
  const salSec = db.sections.find(s=>s.id==='salidas');
  const salidas = salSec ? (salSec.salidas||[]).reduce((a,r)=>a+Number(r.total),0) : 0;
  html += `<hr style="margin:8px 0">`;
  html += `<div><b>BRUTO: S/ ${grand}</b> | Tu lista: S/ 76441 | Extra: <span style="color:red">S/ ${grand-76441}</span></div>`;
  html += `<div><b>SALIDAS: S/ ${salidas}</b></div>`;
  html += `<div style="font-size:14px;font-weight:bold;color:${grand-salidas===76127?'green':'red'}">NETO: S/ ${grand-salidas} — Esperado: S/ 76127 — DIFERENCIA: ${grand-salidas-76127}</div>`;
  html += '</div>';
  document.getElementById('diagOverlay').innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <b style="font-size:16px">Diagnóstico — Lista completa</b>
        <button onclick="document.getElementById('diagOverlay').style.display='none'" style="background:#fee2e2;border:none;border-radius:8px;padding:4px 10px;cursor:pointer;font-weight:bold;color:#dc2626">✕</button>
      </div>
      ${html}
    </div>`;
  document.getElementById('diagOverlay').style.display = 'flex';
}
// ============================================================
function getSalidasSec() {
  return db.sections.find(s => s.id === 'salidas');
}

function buildSalidasCard() {
  const vs = getVS('salidas');
  const sec = getSalidasSec();
  const salidas = sec ? (sec.salidas || []) : [];
  const totalMonto = salidas.reduce((s, r) => s + Number(r.total), 0);
  const totalPages = Math.max(1, Math.ceil(salidas.length / ROWS_PER_PAGE));
  if (vs.page > totalPages) vs.page = totalPages;
  const pageData = [...salidas].reverse().slice((vs.page - 1) * ROWS_PER_PAGE, vs.page * ROWS_PER_PAGE);

  const rows = pageData.length ? pageData.map((r, ri) => {
    const realIdx = salidas.length - 1 - ((vs.page - 1) * ROWS_PER_PAGE + ri);
    return `<tr class="border-b border-gray-100 hover:bg-indigo-50/30 transition">
      <td class="px-3 py-2 font-medium text-gray-800">${r.producto}</td>
      <td class="px-3 py-2 text-center font-bold text-indigo-700">${r.cantidad}</td>
      <td class="px-3 py-2 text-center text-gray-500">${r.stock !== undefined ? r.stock : '—'}</td>
      <td class="px-3 py-2 text-gray-700">${r.receptor || '—'}</td>
      <td class="px-3 py-2 text-gray-500 font-mono text-xs">${r.codigo || '—'}</td>
      <td class="px-3 py-2 text-right">S/ ${Number(r.precio).toFixed(2)}</td>
      <td class="px-3 py-2 text-right font-bold text-indigo-700">S/ ${Number(r.total).toFixed(2)}</td>
      <td class="px-3 py-2 text-xs text-gray-500 max-w-[160px] truncate" title="${r.observacion||''}">${r.observacion||'—'}</td>
      <td class="px-3 py-2 text-xs text-gray-400">${r.fecha||'—'}</td>
      <td class="px-3 py-2 text-center">
        <div class="flex items-center justify-center gap-1">
          <button onclick="openEditSalidaModal(${realIdx})" title="Editar"
            class="p-1.5 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-600 transition">
            <i class="fa-solid fa-pen text-xs"></i>
          </button>
          <button onclick="askPermDeleteSalida(${realIdx})" title="Eliminar"
            class="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-500 transition">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="10" class="text-center py-14 text-gray-400 text-sm">
    <i class="fa-solid fa-inbox text-4xl mb-3 block text-gray-300"></i>Sin registros de salidas.
  </td></tr>`;

  const card = document.createElement('div');
  card.className = 'section-card bg-white rounded-2xl shadow-md overflow-hidden';
  card.innerHTML = `
    <div class="bg-gradient-to-r from-indigo-700 to-indigo-600 px-6 py-5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
          <i class="fa-solid fa-arrow-right-from-bracket text-white text-lg"></i>
        </div>
        <div>
          <h2 class="text-white font-bold text-xl tracking-wide">SALIDAS</h2>
          <p class="text-white/70 text-xs">${salidas.length} registro${salidas.length!==1?'s':''}</p>
        </div>
      </div>
      <button onclick="openSalidaModal()"
        class="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-sm transition border border-white/30">
        <i class="fa-solid fa-arrow-up-from-bracket"></i> Registrar Salida
      </button>
      <button onclick="openEntradaModal()"
        class="flex items-center gap-2 bg-green-500/80 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition border border-green-400/50">
        <i class="fa-solid fa-arrow-down-to-bracket"></i> Entrada de Stock
      </button>
    </div>
    <div class="px-6 py-4 flex flex-wrap gap-3 border-b border-gray-100">
      <div class="flex flex-col items-center bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 min-w-[100px]">
        <span class="text-xs text-indigo-500 font-semibold uppercase">Registros</span>
        <span class="text-2xl font-bold text-indigo-700">${salidas.length}</span>
      </div>
      <div class="flex flex-col items-center bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 min-w-[140px]">
        <span class="text-xs text-yellow-600 font-semibold uppercase">Total Salidas</span>
        <span class="text-2xl font-bold text-yellow-700">S/ ${totalMonto.toFixed(2)}</span>
      </div>
    </div>
    <div class="table-wrap px-2 py-2">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-indigo-50 text-indigo-800 text-xs uppercase">
            <th class="px-3 py-2 text-left font-semibold">Producto</th>
            <th class="px-3 py-2 text-center font-semibold">Cant.</th>
            <th class="px-3 py-2 text-center font-semibold">Stock</th>
            <th class="px-3 py-2 text-left font-semibold">Receptor</th>
            <th class="px-3 py-2 text-left font-semibold">Código</th>
            <th class="px-3 py-2 text-right font-semibold">Precio</th>
            <th class="px-3 py-2 text-right font-semibold">Total</th>
            <th class="px-3 py-2 text-left font-semibold">Observación</th>
            <th class="px-3 py-2 text-left font-semibold">Fecha</th>
            <th class="px-3 py-2 text-center font-semibold">Acción</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${buildPagination(vs.page, totalPages, 'salidas')}`;
  return card;
}

// ---- Modal Salida ----
let _salidaSearchTimer = null;
let _salidaSelectedProduct = null; // { secId, idx, producto, cantidad }

function openSalidaModal() {
  _salidaSelectedProduct = null;
  document.getElementById('salidaProductoDisplay').textContent = 'Ninguno seleccionado';
  document.getElementById('salidaProductoSearch').value = '';
  document.getElementById('salidaSearchResults').innerHTML = '';
  ['salidaCantidad','salidaStock','salidaReceptor','salidaCodigo','salidaPrecio','salidaTotal','salidaObservacion'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('salidaOverlay').classList.add('open');
}
function closeSalidaModal() {
  document.getElementById('salidaOverlay').classList.remove('open');
}

function onSalidaSearch(val) {
  clearTimeout(_salidaSearchTimer);
  _salidaSearchTimer = setTimeout(() => {
    const q = val.toLowerCase().trim();
    const res = document.getElementById('salidaSearchResults');
    if (!q) { res.innerHTML = ''; return; }
    const matches = [];
    db.sections.forEach(sec => {
      if (sec.id === 'salidas') return;
      (sec.products || []).forEach((p, i) => {
        if (p.activo && p.producto.toLowerCase().includes(q)) {
          matches.push({ secId: sec.id, secName: sec.name, idx: i, producto: p.producto, cantidad: p.cantidad, precio: p.precio });
        }
      });
    });
    if (!matches.length) {
      res.innerHTML = `<div class="px-3 py-2 text-xs text-gray-400">Sin resultados</div>`;
      return;
    }
    res.innerHTML = matches.slice(0,10).map((m,i) =>
      `<button type="button" onclick="selectSalidaProduct(${i})" data-idx="${i}"
        class="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm border-b border-gray-100 flex items-center justify-between gap-2">
        <span class="font-medium text-gray-800">${m.producto}</span>
        <span class="text-xs text-gray-400">${m.secName} · Stock: ${m.cantidad}</span>
      </button>`
    ).join('');
    // store matches on window for access
    window._salidaMatches = matches;
  }, 200);
}

function selectSalidaProduct(i) {
  const m = window._salidaMatches[i];
  _salidaSelectedProduct = m;
  document.getElementById('salidaProductoDisplay').textContent = m.producto;
  document.getElementById('salidaProductoSearch').value = m.producto;
  document.getElementById('salidaSearchResults').innerHTML = '';
  document.getElementById('salidaStock').value = m.cantidad;
  document.getElementById('salidaPrecio').value = m.precio;
  calcSalidaTotal();
}

function calcSalidaTotal() {
  const cant  = parseFloat(document.getElementById('salidaCantidad').value) || 0;
  const precio = parseFloat(document.getElementById('salidaPrecio').value)  || 0;
  document.getElementById('salidaTotal').value = (cant * precio).toFixed(2);
}

document.getElementById('salidaForm').addEventListener('submit', function(e) {
  e.preventDefault();
  if (!_salidaSelectedProduct) { showToast('Selecciona un producto', 'error'); return; }
  const cantidad = Number(document.getElementById('salidaCantidad').value);
  if (cantidad <= 0) { showToast('Cantidad inválida', 'error'); return; }

  // Registrar salida
  const sec = getSalidasSec();
  if (!sec.salidas) sec.salidas = [];
  const now = new Date();
  const fecha = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`;
  sec.salidas.push({
    producto:    _salidaSelectedProduct.producto,
    secId:       _salidaSelectedProduct.secId,
    prodIdx:     _salidaSelectedProduct.idx,
    cantidad,
    stock:       Number(document.getElementById('salidaStock').value),
    receptor:    document.getElementById('salidaReceptor').value.trim(),
    codigo:      document.getElementById('salidaCodigo').value.trim(),
    precio:      Number(document.getElementById('salidaPrecio').value),
    total:       Number(document.getElementById('salidaTotal').value),
    observacion: document.getElementById('salidaObservacion').value.trim(),
    fecha,
  });

  // Descontar cantidad del producto origen
  const srcSec = db.sections.find(s => s.id === _salidaSelectedProduct.secId);
  if (srcSec) {
    const p = srcSec.products[_salidaSelectedProduct.idx];
    if (p) {
      p.cantidad = Math.max(0, p.cantidad - cantidad);
      p.total    = p.cantidad * p.precio;
    }
  }

  saveDB(db);
  closeSalidaModal();
  showToast('Salida registrada', 'success');
  renderAll();
});

// ---- Modal Entrada de Stock ----
let _entradaSearchTimer = null;
let _entradaSelectedProduct = null;

function openEntradaModal() {
  _entradaSelectedProduct = null;
  document.getElementById('entradaProductoDisplay').textContent = 'Ninguno seleccionado';
  document.getElementById('entradaProductoSearch').value = '';
  document.getElementById('entradaSearchResults').innerHTML = '';
  document.getElementById('entradaStockActual').value = '';
  document.getElementById('entradaCantidad').value = '';
  document.getElementById('entradaObservacion').value = '';
  document.getElementById('entradaOverlay').classList.add('open');
}
function closeEntradaModal() {
  document.getElementById('entradaOverlay').classList.remove('open');
}

function onEntradaSearch(val) {
  clearTimeout(_entradaSearchTimer);
  _entradaSearchTimer = setTimeout(() => {
    const q = val.toLowerCase().trim();
    const res = document.getElementById('entradaSearchResults');
    if (!q) { res.innerHTML = ''; return; }
    const matches = [];
    db.sections.forEach(sec => {
      if (sec.id === 'salidas' || sec.id === 'desechos') return;
      (sec.products || []).forEach((p, i) => {
        if (p.activo && p.producto.toLowerCase().includes(q)) {
          matches.push({ secId: sec.id, secName: sec.name, idx: i, producto: p.producto, cantidad: p.cantidad });
        }
      });
    });
    if (!matches.length) { res.innerHTML = `<div class="px-3 py-2 text-xs text-gray-400">Sin resultados</div>`; return; }
    res.innerHTML = matches.slice(0,10).map((m,i) =>
      `<button type="button" onclick="selectEntradaProduct(${i})"
        class="w-full text-left px-3 py-2 hover:bg-green-50 text-sm border-b border-gray-100 flex items-center justify-between gap-2">
        <span class="font-medium text-gray-800">${m.producto}</span>
        <span class="text-xs text-gray-400">${m.secName} · Stock: ${m.cantidad}</span>
      </button>`
    ).join('');
    window._entradaMatches = matches;
  }, 200);
}

function selectEntradaProduct(i) {
  const m = window._entradaMatches[i];
  _entradaSelectedProduct = m;
  document.getElementById('entradaProductoDisplay').textContent = m.producto;
  document.getElementById('entradaProductoSearch').value = m.producto;
  document.getElementById('entradaSearchResults').innerHTML = '';
  document.getElementById('entradaStockActual').value = m.cantidad;
}

document.getElementById('entradaForm').addEventListener('submit', function(e) {
  e.preventDefault();
  if (!_entradaSelectedProduct) { showToast('Selecciona un producto', 'error'); return; }
  const cantidad = Number(document.getElementById('entradaCantidad').value);
  if (cantidad <= 0) { showToast('Cantidad inválida', 'error'); return; }

  // Sumar al producto origen
  const srcSec = db.sections.find(s => s.id === _entradaSelectedProduct.secId);
  if (srcSec) {
    const p = srcSec.products[_entradaSelectedProduct.idx];
    if (p) {
      p.cantidad = p.cantidad + cantidad;
      p.total    = p.cantidad * p.precio;
    }
  }

  saveDB(db);
  closeEntradaModal();
  showToast(`+${cantidad} unidades agregadas a ${_entradaSelectedProduct.producto}`, 'success');
  renderAll();
});

// ---- Editar Salida ----
let _editSalidaIdx = null;

function openEditSalidaModal(idx) {
  _editSalidaIdx = idx;
  const sec = getSalidasSec();
  const r = sec.salidas[idx];
  document.getElementById('editSalidaProducto').value    = r.producto;
  document.getElementById('editSalidaCantidad').value    = r.cantidad;
  document.getElementById('editSalidaStock').value       = r.stock !== undefined ? r.stock : '';
  document.getElementById('editSalidaReceptor').value    = r.receptor || '';
  document.getElementById('editSalidaCodigo').value      = r.codigo || '';
  document.getElementById('editSalidaPrecio').value      = r.precio;
  document.getElementById('editSalidaTotal').value       = r.total;
  document.getElementById('editSalidaFecha').value       = r.fecha || '';
  document.getElementById('editSalidaObservacion').value = r.observacion || '';
  document.getElementById('editSalidaOverlay').classList.add('open');
}
function closeEditSalidaModal() {
  document.getElementById('editSalidaOverlay').classList.remove('open');
}
function calcEditSalidaTotal() {
  const cant  = parseFloat(document.getElementById('editSalidaCantidad').value) || 0;
  const precio = parseFloat(document.getElementById('editSalidaPrecio').value)  || 0;
  document.getElementById('editSalidaTotal').value = (cant * precio).toFixed(2);
}

document.getElementById('editSalidaForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const sec = getSalidasSec();
  const r = sec.salidas[_editSalidaIdx];
  r.producto    = document.getElementById('editSalidaProducto').value.trim();
  r.cantidad    = Number(document.getElementById('editSalidaCantidad').value);
  r.stock       = Number(document.getElementById('editSalidaStock').value);
  r.receptor    = document.getElementById('editSalidaReceptor').value.trim();
  r.codigo      = document.getElementById('editSalidaCodigo').value.trim();
  r.precio      = Number(document.getElementById('editSalidaPrecio').value);
  r.total       = Number(document.getElementById('editSalidaTotal').value);
  r.fecha       = document.getElementById('editSalidaFecha').value.trim();
  r.observacion = document.getElementById('editSalidaObservacion').value.trim();
  saveDB(db);
  closeEditSalidaModal();
  showToast('Salida actualizada', 'info');
  renderAll();
});

// Eliminar salida permanentemente
let _pendingSalidaDelete = null;
function askPermDeleteSalida(idx) {
  _pendingSalidaDelete = idx;
  document.getElementById('permDeleteSalidaOverlay').classList.add('open');
}
function closePermDeleteSalidaModal() {
  _pendingSalidaDelete = null;
  document.getElementById('permDeleteSalidaOverlay').classList.remove('open');
}
document.getElementById('confirmPermDeleteSalidaBtn').addEventListener('click', function() {
  if (_pendingSalidaDelete === null) return;
  const salidaSec = getSalidasSec();
  const registro = salidaSec.salidas[_pendingSalidaDelete];

  // Devolver cantidad al producto origen si existe referencia
  if (registro && registro.secId !== undefined && registro.prodIdx !== undefined) {
    const srcSec = db.sections.find(s => s.id === registro.secId);
    if (srcSec) {
      const p = srcSec.products[registro.prodIdx];
      // Verificar que el producto sigue siendo el mismo (por nombre)
      if (p && p.producto === registro.producto) {
        p.cantidad = p.cantidad + registro.cantidad;
        p.total    = p.cantidad * p.precio;
      }
    }
  }

  salidaSec.salidas.splice(_pendingSalidaDelete, 1);
  saveDB(db);
  closePermDeleteSalidaModal();
  showToast('Registro eliminado — stock restaurado', 'info');
  renderAll();
});

// ============================================================
// REETIQUETADOS
// ============================================================
function getReetSec() {
  return db.sections.find(s => s.id === 'reetiquetados');
}

function reetEstadoBadge(estado) {
  if (estado === 'PENDIENTE')
    return `<span class="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-300"><i class="fa-solid fa-clock text-[10px]"></i> PENDIENTE</span>`;
  if (estado === 'ENTREGADO')
    return `<span class="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-300"><i class="fa-solid fa-circle-check text-[10px]"></i> ENTREGADO</span>`;
  if (estado === 'EN PROCESO')
    return `<span class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-300"><i class="fa-solid fa-spinner text-[10px]"></i> EN PROCESO</span>`;
  return `<span class="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-300">${estado}</span>`;
}

function buildReetiquetadosCard() {
  const viewKey = 'reetiquetados';
  const vs = getVS(viewKey);
  const sec = getReetSec();
  const products = sec ? (sec.products || []) : [];
  const activos   = products.filter(p => p.activo);
  const inactivos = products.filter(p => !p.activo);
  const totalReet = activos.filter(p => p.reetiquetado).length;
  const pendientes = activos.filter(p => p.estado === 'PENDIENTE').length;

  const buildReetRow = (p, idx, isActive) => {
    const activoBadge = p.activo
      ? `<span class="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-300"><i class="fa-solid fa-circle text-green-500 text-[8px]"></i> Activo</span>`
      : `<span class="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full border border-red-300"><i class="fa-solid fa-circle text-red-400 text-[8px]"></i> Inactivo</span>`;
    const reetBadge = p.reetiquetado
      ? `<span class="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-300"><i class="fa-solid fa-check text-[10px]"></i> Sí</span>`
      : `<span class="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-300"><i class="fa-solid fa-xmark text-[10px]"></i> No</span>`;
    const rowClass = isActive ? 'border-b border-gray-100 hover:bg-teal-50/30 transition' : 'border-b border-gray-100 hover:bg-red-50/30 transition';
    const actions = isActive
      ? `<div class="flex items-center justify-center gap-1">
          <button onclick="openReetiquetadoDetailModal(${idx})" title="Ver detalles"
            class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
            <i class="fa-solid fa-eye text-xs"></i>
          </button>
          <button onclick="openReetiquetadoModal(${idx})" title="Editar"
            class="p-1.5 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-600 transition">
            <i class="fa-solid fa-pen text-xs"></i>
          </button>
          <button onclick="askDeleteReet(${idx})" title="Eliminar"
            class="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-500 transition">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </div>`
      : `<div class="flex items-center justify-center gap-1">
          <button onclick="openReetiquetadoDetailModal(${idx})" title="Ver detalles"
            class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
            <i class="fa-solid fa-eye text-xs"></i>
          </button>
          <button onclick="restoreReet(${idx})" title="Restaurar"
            class="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-xs transition">
            <i class="fa-solid fa-rotate-left"></i> Restaurar
          </button>
          <button onclick="askPermDeleteReet(${idx})" title="Eliminar permanentemente"
            class="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xs transition">
            <i class="fa-solid fa-trash-can"></i> Borrar
          </button>
        </div>`;
    return `<tr class="${rowClass}">
      <td class="px-3 py-2 font-medium ${isActive ? 'text-gray-800' : 'text-gray-400'}">${p.producto}</td>
      <td class="px-3 py-2 text-center ${isActive ? 'text-gray-700' : 'text-gray-400'}">${p.cantidad}</td>
      <td class="px-3 py-2">${reetBadge}</td>
      <td class="px-3 py-2 text-gray-600 text-sm">${p.entregadoA || '—'}</td>
      <td class="px-3 py-2 text-gray-500 text-sm">${p.fecha || '—'}</td>
      <td class="px-3 py-2">${reetEstadoBadge(p.estado)}</td>
      <td class="px-3 py-2">${activoBadge}</td>
      <td class="px-3 py-2">${actions}</td>
    </tr>`;
  };

  const totalPages = Math.max(1, Math.ceil(products.length / ROWS_PER_PAGE));
  if (vs.page > totalPages) vs.page = totalPages;
  const items = products.map((p, idx) => ({ p, idx }));
  const pageItems = items.slice((vs.page - 1) * ROWS_PER_PAGE, vs.page * ROWS_PER_PAGE);
  const rows = pageItems.length
    ? pageItems.map(item => buildReetRow(item.p, item.idx, item.p.activo)).join('')
    : `<tr><td colspan="8" class="text-center py-14 text-gray-400 text-sm">
        <i class="fa-solid fa-tag text-4xl mb-3 block text-gray-300"></i>Sin registros de reetiquetado.
       </td></tr>`;

  const card = document.createElement('div');
  card.className = 'section-card bg-white rounded-2xl shadow-md overflow-hidden';
  card.innerHTML = `
    <div class="bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
          <i class="fa-solid fa-tag text-white text-lg"></i>
        </div>
        <div>
          <h2 class="text-white font-bold text-xl tracking-wide">REETIQUETADOS</h2>
          <p class="text-white/70 text-xs">${activos.length} activo${activos.length!==1?'s':''}</p>
        </div>
      </div>
      <button onclick="openReetiquetadoModal()"
        class="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-sm transition border border-white/30">
        <i class="fa-solid fa-plus"></i> Agregar
      </button>
    </div>
    <div class="px-6 py-4 flex flex-wrap gap-3 border-b border-gray-100">
      <div class="flex flex-col items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 min-w-[80px]">
        <span class="text-xs text-blue-500 font-semibold uppercase">Total</span>
        <span class="text-2xl font-bold text-blue-700">${products.length}</span>
      </div>
      <div class="flex flex-col items-center bg-green-50 border border-green-200 rounded-xl px-4 py-2 min-w-[100px]">
        <span class="text-xs text-green-600 font-semibold uppercase">Reetiquetados</span>
        <span class="text-2xl font-bold text-green-700">${totalReet}</span>
      </div>
      <div class="flex flex-col items-center bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 min-w-[100px]">
        <span class="text-xs text-yellow-600 font-semibold uppercase">Pendientes</span>
        <span class="text-2xl font-bold text-yellow-700">${pendientes}</span>
      </div>
      <div class="flex flex-col items-center bg-red-50 border border-red-200 rounded-xl px-4 py-2 min-w-[80px]">
        <span class="text-xs text-red-500 font-semibold uppercase">Inactivos</span>
        <span class="text-2xl font-bold text-red-600">${inactivos.length}</span>
      </div>
    </div>
    <div class="table-wrap px-2 py-2">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="bg-teal-50 text-teal-800 text-xs uppercase">
            <th class="px-3 py-2 text-left font-semibold">Producto</th>
            <th class="px-3 py-2 text-center font-semibold">Cant.</th>
            <th class="px-3 py-2 text-left font-semibold">Reetiquetado</th>
            <th class="px-3 py-2 text-left font-semibold">Entregado a</th>
            <th class="px-3 py-2 text-left font-semibold">Fecha</th>
            <th class="px-3 py-2 text-left font-semibold">Estado</th>
            <th class="px-3 py-2 text-left font-semibold">Activo</th>
            <th class="px-3 py-2 text-center font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${buildPagination(vs.page, totalPages, viewKey)}`;
  return card;
}

// ---- Modal Agregar/Editar Reetiquetado ----
function openReetiquetadoModal(idx = null) {
  const overlay = document.getElementById('reetiquetadoOverlay');
  const form    = document.getElementById('reetiquetadoForm');
  document.getElementById('reetModalTitle').textContent = idx === null ? 'Agregar Reetiquetado' : 'Editar Reetiquetado';
  document.getElementById('reetEditIndex').value = idx !== null ? idx : '';

  if (idx !== null) {
    const sec = getReetSec();
    const p   = sec.products[idx];
    document.getElementById('reetProducto').value    = p.producto;
    document.getElementById('reetCantidad').value    = p.cantidad;
    document.getElementById('reetReetiquetado').checked = p.reetiquetado;
    document.getElementById('reetEntregadoA').value  = p.entregadoA || '';
    document.getElementById('reetFecha').value       = p.fecha || '';
    document.getElementById('reetEstado').value      = p.estado || 'PENDIENTE';
    document.getElementById('reetActivo').checked    = p.activo;
  } else {
    form.reset();
    document.getElementById('reetActivo').checked = true;
    document.getElementById('reetEstado').value   = 'PENDIENTE';
  }
  overlay.classList.add('open');
}
function closeReetiquetadoModal() {
  document.getElementById('reetiquetadoOverlay').classList.remove('open');
}

document.getElementById('reetiquetadoForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const sec = getReetSec();
  const idx = document.getElementById('reetEditIndex').value;
  const prod = {
    producto:     document.getElementById('reetProducto').value.trim(),
    cantidad:     Number(document.getElementById('reetCantidad').value),
    reetiquetado: document.getElementById('reetReetiquetado').checked,
    entregadoA:   document.getElementById('reetEntregadoA').value.trim(),
    fecha:        document.getElementById('reetFecha').value.trim(),
    estado:       document.getElementById('reetEstado').value,
    activo:       document.getElementById('reetActivo').checked,
  };
  if (idx === '') { sec.products.push(prod); showToast('Reetiquetado agregado', 'success'); }
  else            { sec.products[Number(idx)] = prod; showToast('Reetiquetado actualizado', 'info'); }
  saveDB(db);
  closeReetiquetadoModal();
  renderAll();
});

// ---- Modal Detalle Reetiquetado ----
function openReetiquetadoDetailModal(idx) {
  const sec = getReetSec();
  const p   = sec.products[idx];
  const activoBadge = p.activo
    ? `<span class="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-300"><i class="fa-solid fa-circle text-green-500 text-[8px]"></i> Activo</span>`
    : `<span class="inline-flex items-center gap-1.5 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full border border-red-300"><i class="fa-solid fa-circle text-red-400 text-[8px]"></i> Inactivo</span>`;
  const reetBadge = p.reetiquetado
    ? `<span class="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-300"><i class="fa-solid fa-check text-[10px]"></i> Sí</span>`
    : `<span class="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-300"><i class="fa-solid fa-xmark text-[10px]"></i> No</span>`;

  document.getElementById('reetDetailContent').innerHTML = `
    <div class="bg-gradient-to-r from-teal-700 to-teal-600 -mx-6 -mt-6 px-6 py-5 mb-5 rounded-t-2xl">
      <div class="flex items-start gap-3">
        <div class="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <i class="fa-solid fa-tag text-white text-xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-white font-bold text-lg leading-tight">${p.producto}</h3>
          <p class="text-white/60 text-xs mt-0.5">REETIQUETADOS</p>
        </div>
        <div class="flex-shrink-0">${activoBadge}</div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2 mb-4">
      <div class="flex flex-col items-center bg-blue-50 border border-blue-100 rounded-xl py-3 px-2">
        <i class="fa-solid fa-cubes text-blue-400 text-base mb-1"></i>
        <span class="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">Cantidad</span>
        <span class="text-xl font-black text-blue-700 mt-0.5">${p.cantidad}</span>
      </div>
      <div class="flex flex-col items-center bg-teal-50 border border-teal-100 rounded-xl py-3 px-2">
        <i class="fa-solid fa-tag text-teal-400 text-base mb-1"></i>
        <span class="text-[10px] text-teal-600 font-semibold uppercase tracking-wide">Reetiquetado</span>
        <div class="mt-1">${reetBadge}</div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2 mb-2">
      <div class="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
        <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5">
          <i class="fa-solid fa-user text-teal-400"></i> Entregado a
        </p>
        <span class="text-sm font-semibold text-gray-700">${p.entregadoA || '<span class="text-gray-400 italic">—</span>'}</span>
      </div>
      <div class="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
        <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5">
          <i class="fa-solid fa-calendar text-teal-400"></i> Fecha
        </p>
        <span class="text-sm font-semibold text-gray-700">${p.fecha || '<span class="text-gray-400 italic">—</span>'}</span>
      </div>
    </div>
    <div class="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-4">
      <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5">
        <i class="fa-solid fa-circle-info text-teal-400"></i> Estado
      </p>
      ${reetEstadoBadge(p.estado)}
    </div>
    <button onclick="closeReetiquetadoDetailModal()"
      class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm">
      <i class="fa-solid fa-xmark"></i> Cerrar
    </button>`;
  document.getElementById('reetiquetadoDetailOverlay').classList.add('open');
}
function closeReetiquetadoDetailModal() {
  document.getElementById('reetiquetadoDetailOverlay').classList.remove('open');
}

// ---- Eliminar (soft) Reetiquetado ----
let _pendingReetDelete = null;
function askDeleteReet(idx) {
  _pendingReetDelete = idx;
  pendingDelete = null; // clear normal pending so existing handler skips
  document.getElementById('deleteOverlay').classList.add('open');
}

// ---- Restaurar Reetiquetado ----
function restoreReet(idx) {
  const sec = getReetSec();
  sec.products[idx].activo = true;
  saveDB(db);
  showToast('Registro restaurado', 'success');
  renderAll();
}

// ---- Eliminar permanentemente Reetiquetado ----
let _pendingPermReetDelete = null;
function askPermDeleteReet(idx) {
  _pendingPermReetDelete = idx;
  document.getElementById('permDeleteReetOverlay').classList.add('open');
}
function closePermDeleteReetModal() {
  _pendingPermReetDelete = null;
  document.getElementById('permDeleteReetOverlay').classList.remove('open');
}
document.getElementById('confirmPermDeleteReetBtn').addEventListener('click', function() {
  if (_pendingPermReetDelete === null) return;
  const sec = getReetSec();
  sec.products.splice(_pendingPermReetDelete, 1);
  saveDB(db);
  closePermDeleteReetModal();
  showToast('Registro eliminado permanentemente', 'error');
  renderAll();
});

// ============================================================
// EXPORTAR PDF
// ============================================================
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const now = new Date();
  const fecha = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`;
  const pageW = doc.internal.pageSize.getWidth();

  // Colores
  const verde     = [22, 101, 52];
  const verdeClaro= [240, 253, 244];
  const grisClaro = [248, 250, 252];
  const grisOsc   = [71, 85, 105];

  // Título principal
  doc.setFillColor(...verde);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text('AGROINVENTARIO — Reporte de Inventario', pageW/2, 11, { align:'center' });
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text(`Generado: ${fecha}`, pageW - 10, 11, { align:'right' });

  let y = 24;

  // Secciones normales
  const mainSecs = db.sections.filter(s => !EXCLUDED_FROM_GENERAL.has(s.id));
  mainSecs.forEach(sec => {
    const prods = sec.products || [];
    if (!prods.length) return;

    // Verificar espacio — nueva página si hace falta
    if (y > 170) { doc.addPage(); y = 10; }

    // Header de sección
    doc.setFillColor(...verde);
    doc.roundedRect(10, y, pageW - 20, 8, 2, 2, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text(sec.name, 14, y + 5.5);
    const secTotal = prods.reduce((a,p)=>a+Number(p.total),0);
    doc.text(`Total: S/ ${secTotal.toFixed(2)}`, pageW - 14, y + 5.5, { align:'right' });
    y += 10;

    // Tabla
    doc.autoTable({
      startY: y,
      margin: { left: 10, right: 10 },
      head: [['Producto','Cant.','Precio','Total','Presentación','Vencimiento','Condición']],
      body: prods.map(p => [
        p.producto,
        p.cantidad,
        `S/ ${Number(p.precio).toFixed(2)}`,
        `S/ ${Number(p.total).toFixed(2)}`,
        p.presentacion,
        p.vencimiento,
        p.estado
      ]),
      headStyles: { fillColor: [30,130,70], textColor:255, fontStyle:'bold', fontSize:8 },
      bodyStyles: { fontSize: 7.5, textColor: [30,30,30] },
      alternateRowStyles: { fillColor: [245,250,245] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 14, halign:'center' },
        2: { cellWidth: 20, halign:'right' },
        3: { cellWidth: 22, halign:'right' },
        4: { cellWidth: 22 },
        5: { cellWidth: 28 },
        6: { cellWidth: 'auto' }
      },
      didDrawPage: (data) => { y = data.cursor.y + 6; }
    });
    y = doc.lastAutoTable.finalY + 8;
  });

  // Sección DESECHOS
  const desechosSec = db.sections.find(s => s.id === 'desechos');
  if (desechosSec && desechosSec.products.length) {
    if (y > 160) { doc.addPage(); y = 10; }
    doc.setFillColor(190, 18, 60);
    doc.roundedRect(10, y, pageW - 20, 8, 2, 2, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('DESECHOS', 14, y + 5.5);
    const dt = desechosSec.products.reduce((a,p)=>a+Number(p.total),0);
    doc.text(`Total: S/ ${dt.toFixed(2)}`, pageW - 14, y + 5.5, { align:'right' });
    y += 10;
    doc.autoTable({
      startY: y, margin: { left:10, right:10 },
      head: [['Producto','Cant.','Precio','Total','Rubro','Condición']],
      body: desechosSec.products.map(p=>[p.producto,p.cantidad,`S/ ${Number(p.precio).toFixed(2)}`,`S/ ${Number(p.total).toFixed(2)}`,p.rubro||'',p.estado]),
      headStyles: { fillColor:[190,18,60], textColor:255, fontStyle:'bold', fontSize:8 },
      bodyStyles: { fontSize:7.5 },
      alternateRowStyles: { fillColor:[255,241,242] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Sección SALIDAS
  const salidaSec = db.sections.find(s => s.id === 'salidas');
  if (salidaSec && (salidaSec.salidas||[]).length) {
    if (y > 160) { doc.addPage(); y = 10; }
    doc.setFillColor(67, 56, 202);
    doc.roundedRect(10, y, pageW - 20, 8, 2, 2, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('SALIDAS', 14, y + 5.5);
    const st = salidaSec.salidas.reduce((a,r)=>a+Number(r.total),0);
    doc.text(`Total: S/ ${st.toFixed(2)}`, pageW - 14, y + 5.5, { align:'right' });
    y += 10;
    doc.autoTable({
      startY: y, margin: { left:10, right:10 },
      head: [['Producto','Cant.','Receptor','Código','Precio','Total','Fecha','Observación']],
      body: salidaSec.salidas.map(r=>[r.producto,r.cantidad,r.receptor||'',r.codigo||'',`S/ ${Number(r.precio).toFixed(2)}`,`S/ ${Number(r.total).toFixed(2)}`,r.fecha||'',r.observacion||'']),
      headStyles: { fillColor:[67,56,202], textColor:255, fontStyle:'bold', fontSize:8 },
      bodyStyles: { fontSize:7.5 },
      alternateRowStyles: { fillColor:[238,242,255] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Sección REETIQUETADOS
  const reetSec = db.sections.find(s => s.id === 'reetiquetados');
  if (reetSec && (reetSec.products||[]).length) {
    if (y > 160) { doc.addPage(); y = 10; }
    doc.setFillColor(15, 118, 110);
    doc.roundedRect(10, y, pageW - 20, 8, 2, 2, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('REETIQUETADOS', 14, y + 5.5);
    const rt = reetSec.products.filter(p=>p.activo).length;
    doc.text(`${rt} activos`, pageW - 14, y + 5.5, { align:'right' });
    y += 10;
    doc.autoTable({
      startY: y, margin: { left:10, right:10 },
      head: [['Producto','Cant.','Reetiquetado','Entregado a','Fecha','Estado']],
      body: reetSec.products.map(p=>[p.producto,p.cantidad,p.reetiquetado?'Sí':'No',p.entregadoA||'',p.fecha||'',p.estado]),
      headStyles: { fillColor:[15,118,110], textColor:255, fontStyle:'bold', fontSize:8 },
      bodyStyles: { fontSize:7.5 },
      alternateRowStyles: { fillColor:[240,253,250] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Resumen final
  if (y > 170) { doc.addPage(); y = 10; }
  const bruto   = mainSecs.reduce((a,s)=>a+(s.products||[]).reduce((b,p)=>b+Number(p.total),0),0);
  const salidas = salidaSec ? (salidaSec.salidas||[]).reduce((a,r)=>a+Number(r.total),0) : 0;
  doc.setFillColor(...verde);
  doc.roundedRect(10, y, pageW - 20, 8, 2, 2, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(10); doc.setFont('helvetica','bold');
  doc.text('RESUMEN GENERAL', 14, y + 5.5);
  y += 10;
  doc.autoTable({
    startY: y, margin: { left:10, right:10 },
    head: [['Concepto','Monto']],
    body: [
      ['Monto Bruto Total', `S/ ${bruto.toFixed(2)}`],
      ['Total Salidas',     `S/ ${salidas.toFixed(2)}`],
      ['MONTO FINAL',       `S/ ${(bruto - salidas).toFixed(2)}`],
    ],
    headStyles: { fillColor:[30,130,70], textColor:255, fontStyle:'bold', fontSize:9 },
    bodyStyles: { fontSize:9 },
    columnStyles: { 0:{ fontStyle:'bold' }, 1:{ halign:'right', fontStyle:'bold' } },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fillColor = [220,252,231];
        data.cell.styles.textColor = [22,101,52];
        data.cell.styles.fontSize  = 11;
      }
    }
  });

  // Numeración de páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(150,150,150);
    doc.text(`Página ${i} de ${totalPages}`, pageW/2, doc.internal.pageSize.getHeight()-5, { align:'center' });
  }

  doc.save(`AgroInventario_${fecha.replace(/\//g,'-')}.pdf`);
  showToast('PDF descargado', 'success');
}

// ============================================================
// EXPORTAR EXCEL (CSV con punto y coma para Excel en español)
// ============================================================
function exportarExcel() {
  const now = new Date();
  const fecha = `${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`;
  // Usar punto y coma como separador (estándar Excel en español/Latinoamérica)
  const SEP = ';';
  let csv = '\uFEFF'; // BOM UTF-8

  db.sections.forEach(sec => {
    if (sec.id === 'salidas') return;
    csv += `\n"=== ${sec.name} ==="\n`;
    csv += `"Producto"${SEP}"Cantidad"${SEP}"Precio"${SEP}"Total"${SEP}"Presentación"${SEP}"Vencimiento"${SEP}"Condición"${SEP}"Rubro"${SEP}"Observación"${SEP}"Activo"\n`;
    (sec.products || []).forEach(p => {
      csv += `"${p.producto}"${SEP}"${p.cantidad}"${SEP}"${p.precio}"${SEP}"${p.total}"${SEP}"${p.presentacion}"${SEP}"${p.vencimiento}"${SEP}"${p.estado}"${SEP}"${p.rubro||''}"${SEP}"${(p.observacion||'').replace(/"/g,"'")}"${SEP}"${p.activo?'Sí':'No'}"\n`;
    });
    const tot = (sec.products||[]).reduce((a,p)=>a+Number(p.total),0);
    csv += `"TOTAL ${sec.name}"${SEP}""${SEP}""${SEP}"${tot}"${SEP}""${SEP}""${SEP}""${SEP}""${SEP}""${SEP}""\n`;
  });

  const salidaSec = db.sections.find(s => s.id === 'salidas');
  if (salidaSec && (salidaSec.salidas||[]).length) {
    csv += `\n"=== SALIDAS ==="\n`;
    csv += `"Producto"${SEP}"Cantidad"${SEP}"Stock"${SEP}"Receptor"${SEP}"Código"${SEP}"Precio"${SEP}"Total"${SEP}"Observación"${SEP}"Fecha"\n`;
    (salidaSec.salidas||[]).forEach(r => {
      csv += `"${r.producto}"${SEP}"${r.cantidad}"${SEP}"${r.stock||0}"${SEP}"${r.receptor||''}"${SEP}"${r.codigo||''}"${SEP}"${r.precio}"${SEP}"${r.total}"${SEP}"${(r.observacion||'').replace(/"/g,"'")}"${SEP}"${r.fecha||''}"\n`;
    });
    const totS = (salidaSec.salidas||[]).reduce((a,r)=>a+Number(r.total),0);
    csv += `"TOTAL SALIDAS"${SEP}""${SEP}""${SEP}""${SEP}""${SEP}""${SEP}"${totS}"${SEP}""${SEP}""\n`;
  }

  const reetSec = db.sections.find(s => s.id === 'reetiquetados');
  if (reetSec && (reetSec.products||[]).length) {
    csv += `\n"=== REETIQUETADOS ==="\n`;
    csv += `"Producto"${SEP}"Cantidad"${SEP}"Reetiquetado"${SEP}"Entregado a"${SEP}"Fecha"${SEP}"Estado"${SEP}"Activo"\n`;
    (reetSec.products||[]).forEach(p => {
      csv += `"${p.producto}"${SEP}"${p.cantidad}"${SEP}"${p.reetiquetado?'Sí':'No'}"${SEP}"${p.entregadoA||''}"${SEP}"${p.fecha||''}"${SEP}"${p.estado}"${SEP}"${p.activo?'Sí':'No'}"\n`;
    });
  }

  const mainSecs = db.sections.filter(s => !EXCLUDED_FROM_GENERAL.has(s.id));
  const bruto    = mainSecs.reduce((a,s)=>a+(s.products||[]).reduce((b,p)=>b+Number(p.total),0),0);
  const salidas  = salidaSec ? (salidaSec.salidas||[]).reduce((a,r)=>a+Number(r.total),0) : 0;
  csv += `\n"=== RESUMEN ==="\n`;
  csv += `"Monto Bruto"${SEP}"${bruto}"\n`;
  csv += `"Total Salidas"${SEP}"${salidas}"\n`;
  csv += `"Monto Final"${SEP}"${bruto - salidas}"\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `AgroInventario_${fecha}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast('Excel descargado', 'success');
}

// ============================================================
// REINICIAR INVENTARIO
// ============================================================
function confirmarReinicio() {
  document.getElementById('reiniciarOverlay').classList.add('open');
}
function ejecutarReinicio() {
  // Limpiar todos los productos de todas las secciones y salidas
  db.sections.forEach(sec => {
    if (sec.id === 'salidas') { sec.salidas = []; }
    else { sec.products = []; }
  });
  saveDB(db);
  document.getElementById('reiniciarOverlay').classList.remove('open');
  showToast('Inventario reiniciado', 'error');
  renderAll();
}

// ============================================================
// INIT
// ============================================================
function initApp() {
  window.db = db;
  setupSessionWatchers();
  if (!isAuthenticated()) {
    showLogin('Bienvenido. Ingresa tu usuario y contraseña.');
  } else {
    hideLogin();
    renderAll();
  }
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const usuario = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  loginUser(usuario, password);
});

// Esperar a Firebase (máx 4 segundos de fallback)
let _initDone = false;
function doInit() {
  if (_initDone) {
    if (window._firestoreNeedsSync && window._firestoreSave && window.db) {
      window._firestoreSave(db);
      window._firestoreNeedsSync = false;
    }
    return;
  }
  _initDone = true;
  // Recargar db desde localStorage por si Firebase actualizó los datos
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      const fresh = normalizeInventoryData(JSON.parse(raw));
      db.sections = fresh.sections;
      window._lastLocalSave = getLocalDBUpdatedAt();
    } catch(e) {
      console.warn('Error al recargar DB en doInit:', e);
    }
  }
  initApp();
  if (window._firestoreNeedsSync && window._firestoreSave) {
    window._firestoreSave(db);
    window._firestoreNeedsSync = false;
  }
}

document.addEventListener('firebaseReady', doInit);
setTimeout(doInit, 4000); // fallback si Firebase no responde
