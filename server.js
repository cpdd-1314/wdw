/**
 * Click & Collect Market — Backend (Express)
 * Marketplace tipo Amazon con recogida en tienda (Click & Collect).
 * Modo BETA: el checkout NO procesa pagos reales.
 *
 * Almacenamiento: archivo JSON en /data/db.json (suficiente para demo/beta).
 * Imágenes: se guardan en /public/uploads y se sirven estaticamente.
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'public', 'uploads');
[DATA_DIR, UPLOAD_DIR].forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

app.use(express.json({ limit: '2mb' }));

/* ----------------------------- Base de datos ----------------------------- */
const DB_FILE = path.join(DATA_DIR, 'db.json');
let db = { sellers: [], products: [], orders: [] };
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { /* corrupto: reinicia */ }
  }
  if (!db.sellers) db.sellers = [];
  if (!db.products) db.products = [];
  if (!db.orders) db.orders = [];
}
function saveDB() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
loadDB();

/* ----------------------------- Utilidades ------------------------------- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(pw, stored) {
  const [salt, hash] = (stored || '').split(':');
  if (!salt || !hash) return false;
  const h = crypto.scryptSync(pw, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
}
const uid = () => crypto.randomUUID();
const clean = (s) => (typeof s === 'string' ? s.trim() : s);

/* Sesiones en memoria (proceso unico) */
const sessions = {}; // token -> sellerId
function newSession(sellerId) {
  const token = uid();
  sessions[token] = sellerId;
  return token;
}
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const sellerId = sessions[token];
  if (!sellerId) return res.status(401).json({ error: 'No autorizado' });
  req.sellerId = sellerId;
  next();
}

/* ----------------------------- Subida de imagenes ----------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, uid() + path.extname(file.originalname).toLowerCase()),
});
const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (/\image\//.test(file.mimetype) ? cb(null, true) : cb(new Error('Solo se permiten imágenes'))),
});
app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
  res.json({ url: '/uploads/' + req.file.filename });
});

/* ----------------------------- Constantes ------------------------------- */
const CATEGORIES = [
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
const PAYMENTS = [
  { id: 'tarjeta', name: 'Tarjeta de crédito / débito' },
  { id: 'paypal', name: 'PayPal' },
  { id: 'transferencia', name: 'Transferencia bancaria' },
  { id: 'bizum', name: 'Bizum / QR' },
  { id: 'contraentrega', name: 'Pago al recoger (contra entrega)' },
];

/* ----------------------------- Rutas: auth/sellers ---------------------- */
app.get('/api/categories', (req, res) => res.json(CATEGORIES));
app.get('/api/payments', (req, res) => res.json(PAYMENTS));

app.post('/api/sellers/register', (req, res) => {
  const b = req.body || {};
  const email = clean(b.email);
  const password = b.password;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  if (db.sellers.some((s) => s.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ error: 'Ese email ya está registrado' });

  const seller = {
    id: uid(),
    email: email.toLowerCase(),
    password: hashPassword(password),
    company: {
      name: clean(b.company?.name) || '',
      taxId: clean(b.company?.taxId) || '',
      address: clean(b.company?.address) || '',
      city: clean(b.company?.city) || '',
      phone: clean(b.company?.phone) || '',
      category: clean(b.company?.category) || '',
      description: clean(b.company?.description) || '',
      logo: clean(b.company?.logo) || '',
    },
    createdAt: new Date().toISOString(),
  };
  db.sellers.push(seller);
  saveDB();
  const token = newSession(seller.id);
  res.json({ token, seller: publicSeller(seller) });
});

app.post('/api/auth/login', (req, res) => {
  const b = req.body || {};
  const seller = db.sellers.find((s) => s.email.toLowerCase() === clean(b.email).toLowerCase());
  if (!seller || !verifyPassword(b.password || '', seller.password))
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  const token = newSession(seller.id);
  res.json({ token, seller: publicSeller(seller) });
});

app.get('/api/me', auth, (req, res) => {
  const s = db.sellers.find((x) => x.id === req.sellerId);
  if (!s) return res.status(404).json({ error: 'No encontrado' });
  res.json(publicSeller(s));
});

app.put('/api/sellers/me', auth, (req, res) => {
  const s = db.sellers.find((x) => x.id === req.sellerId);
  if (!s) return res.status(404).json({ error: 'No encontrado' });
  const b = req.body || {};
  s.company = {
    name: clean(b.name) ?? s.company.name,
    taxId: clean(b.taxId) ?? s.company.taxId,
    address: clean(b.address) ?? s.company.address,
    city: clean(b.city) ?? s.company.city,
    phone: clean(b.phone) ?? s.company.phone,
    category: clean(b.category) ?? s.company.category,
    description: clean(b.description) ?? s.company.description,
    logo: clean(b.logo) ?? s.company.logo,
  };
  saveDB();
  res.json(publicSeller(s));
});

app.post('/api/auth/logout', auth, (req, res) => {
  const token = (req.headers.authorization || '').slice(7);
  delete sessions[token];
  res.json({ ok: true });
});

function publicSeller(s) {
  return {
    id: s.id, email: s.email, company: s.company,
    createdAt: s.createdAt,
    productCount: db.products.filter((p) => p.sellerId === s.id).length,
  };
}
app.get('/api/sellers/:id', (req, res) => {
  const s = db.sellers.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Vendedor no encontrado' });
  res.json({ ...publicSeller(s), products: db.products.filter((p) => p.sellerId === s.id && p.stock > 0) });
});
app.get('/api/sellers/:id/orders', auth, (req, res) => {
  if (req.sellerId !== req.params.id) return res.status(403).json({ error: 'No permitido' });
  res.json(db.orders.filter((o) => o.sellerId === req.params.id));
});

/* ----------------------------- Rutas: products -------------------------- */
app.get('/api/products', (req, res) => {
  const { q, category, city, seller, sort } = req.query;
  let list = db.products.filter((p) => p.stock > 0);
  if (category) list = list.filter((p) => p.category === category);
  if (seller) list = list.filter((p) => p.sellerId === seller);
  if (city) list = list.filter((p) => p.pickupCity && p.pickupCity.toLowerCase().includes(city.toLowerCase()));
  if (q) {
    const t = q.toLowerCase();
    list = list.filter((p) =>
      p.title.toLowerCase().includes(t) || p.description.toLowerCase().includes(t) ||
      (p.companyName && p.companyName.toLowerCase().includes(t)));
  }
  if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'new') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.get('/api/products/:id', (req, res) => {
  const p = db.products.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  const seller = db.sellers.find((s) => s.id === p.sellerId);
  res.json({ ...p, company: seller ? seller.company : null });
});

app.post('/api/products', auth, (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.price || !b.category) return res.status(400).json({ error: 'Título, precio y categoría son obligatorios' });
  const seller = db.sellers.find((s) => s.id === req.sellerId);
  const product = {
    id: uid(),
    sellerId: req.sellerId,
    companyName: seller ? seller.company.name : '',
    title: clean(b.title),
    description: clean(b.description) || '',
    category: clean(b.category),
    price: Number(b.price),
    stock: Math.max(0, parseInt(b.stock || '1', 10) || 1),
    images: Array.isArray(b.images) ? b.images : [],
    pickupAddress: clean(b.pickupAddress) || (seller ? seller.company.address : ''),
    pickupCity: clean(b.pickupCity) || (seller ? seller.company.city : ''),
    pickupInstructions: clean(b.pickupInstructions) || '',
    createdAt: new Date().toISOString(),
  };
  db.products.push(product);
  saveDB();
  res.json(product);
});

app.delete('/api/products/:id', auth, (req, res) => {
  const p = db.products.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'No encontrado' });
  if (p.sellerId !== req.sellerId) return res.status(403).json({ error: 'No permitido' });
  db.products = db.products.filter((x) => x.id !== req.params.id);
  saveDB();
  res.json({ ok: true });
});

app.put('/api/products/:id', auth, (req, res) => {
  const p = db.products.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'No encontrado' });
  if (p.sellerId !== req.sellerId) return res.status(403).json({ error: 'No permitido' });
  const b = req.body || {};
  Object.assign(p, {
    title: clean(b.title) || p.title,
    description: b.description !== undefined ? clean(b.description) : p.description,
    category: clean(b.category) || p.category,
    price: b.price !== undefined ? Number(b.price) : p.price,
    stock: b.stock !== undefined ? Math.max(0, parseInt(b.stock, 10) || 0) : p.stock,
    images: Array.isArray(b.images) ? b.images : p.images,
    pickupAddress: b.pickupAddress !== undefined ? clean(b.pickupAddress) : p.pickupAddress,
    pickupCity: b.pickupCity !== undefined ? clean(b.pickupCity) : p.pickupCity,
    pickupInstructions: b.pickupInstructions !== undefined ? clean(b.pickupInstructions) : p.pickupInstructions,
  });
  saveDB();
  res.json(p);
});

/* ----------------------------- Rutas: orders (beta) --------------------- */
app.post('/api/orders', (req, res) => {
  const b = req.body || {};
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return res.status(400).json({ error: 'El carrito está vacío' });
  if (!b.paymentMethod) return res.status(400).json({ error: 'Selecciona un método de pago' });

  const orderItems = [];
  let total = 0;
  for (const it of items) {
    const p = db.products.find((x) => x.id === it.productId);
    if (!p || p.stock <= 0) return res.status(400).json({ error: `Producto no disponible: ${p ? p.title : it.productId}` });
    const qty = Math.min(parseInt(it.qty, 10) || 1, p.stock);
    orderItems.push({ productId: p.id, title: p.title, price: p.price, qty, image: p.images[0] || '', sellerId: p.sellerId, pickupCity: p.pickupCity });
    total += p.price * qty;
    p.stock -= qty;
  }
  const order = {
    id: 'PED-' + Date.now().toString(36).toUpperCase(),
    items: orderItems,
    total: Number(total.toFixed(2)),
    paymentMethod: b.paymentMethod,
    paymentName: (PAYMENTS.find((x) => x.id === b.paymentMethod) || {}).name || b.paymentMethod,
    customer: { name: clean(b.customer?.name) || 'Cliente', email: clean(b.customer?.email) || '', phone: clean(b.customer?.phone) || '' },
    pickup: { name: clean(b.pickup?.name) || '', time: clean(b.pickup?.time) || '', notes: clean(b.pickup?.notes) || '' },
    status: 'beta_pendiente', // MODO BETA: no se procesa ningun cargo real
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  saveDB();
  res.json(order);
});

app.get('/api/orders/:id', (req, res) => {
  const o = db.orders.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(o);
});

/* ----------------------------- Estáticos + SPA -------------------------- */
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(ROOT, 'public')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'No encontrado' });
  res.sendFile(path.join(ROOT, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Click & Collect Market corriendo en http://localhost:${PORT}`));
