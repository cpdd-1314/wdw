// Capa de acceso a la API
const TOKEN_KEY = 'cc_token';

export const api = {
  token: localStorage.getItem(TOKEN_KEY) || null,

  setToken(t) {
    this.token = t || null;
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
    document.body.classList.toggle('logged', !!t);
  },

  async req(method, url, body) {
    const headers = {};
    if (this.token) headers.Authorization = 'Bearer ' + this.token;
    const opts = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    let data = {};
    try { data = await res.json(); } catch (e) { /* vacío */ }
    if (!res.ok) throw new Error(data.error || ('Error ' + res.status));
    return data;
  },

  get: (u) => api.req('GET', u),
  post: (u, b) => api.req('POST', u, b),
  del: (u) => api.req('DELETE', u),

  // Sube un archivo y devuelve { url }
  async upload(file) {
    const fd = new FormData();
    fd.append('image', file);
    const headers = {};
    if (api.token) headers.Authorization = 'Bearer ' + api.token;
    const res = await fetch('/api/upload', { method: 'POST', headers, body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Fallo al subir imagen');
    return data;
  },
};

export const CATEGORIES = [
  { id: 'electronica', name: 'Electrónica', icon: '💻' },
  { id: 'hogar', name: 'Hogar y Cocina', icon: '🏠' },
  { id: 'moda', name: 'Moda', icon: '👗' },
  { id: 'belleza', name: 'Belleza', icon: '💄' },
  { id: 'deportes', name: 'Deportes', icon: '⚽' },
  { id: 'libros', name: 'Libros', icon: '📚' },
  { id: 'juguetes', name: 'Juguetes', icon: '🧸' },
  { id: 'alimentos', name: 'Alimentos', icon: '🍎' },
  { id: 'mascotas', name: 'Mascotas', icon: '🐾' },
  { id: 'auto', name: 'Auto y Motor', icon: '🚗' },
];
export const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || id;

export const PAYMENTS = [
  { id: 'tarjeta', name: 'Tarjeta de crédito / débito' },
  { id: 'paypal', name: 'PayPal' },
  { id: 'transferencia', name: 'Transferencia bancaria' },
  { id: 'bizum', name: 'Bizum / QR' },
  { id: 'contraentrega', name: 'Pago al recoger (contra entrega)' },
];
