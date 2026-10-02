// Utilidades de UI compartidas: toast, formato, carrito, render de tarjetas

export function toast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = 'toast ' + type; }, 2600);
}

export const money = (n) => '€' + Number(n || 0).toFixed(2);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ----------------------------- Carrito (localStorage) -----------------------------
const CART_KEY = 'cc_cart';
export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
}
export function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartCount(); }
export function addToCart(item) {
  const c = getCart();
  const ex = c.find((i) => i.id === item.id);
  if (ex) ex.qty = Math.min(ex.qty + item.qty, ex.stock || 99);
  else c.push(item);
  saveCart(c);
  toast('Añadido al carrito', 'ok');
}
export function setQty(id, qty) {
  const c = getCart();
  const it = c.find((i) => i.id === id);
  if (it) it.qty = Math.max(1, qty);
  saveCart(c);
}
export function removeFromCart(id) { saveCart(getCart().filter((i) => i.id !== id)); }
export function clearCart() { localStorage.removeItem(CART_KEY); updateCartCount(); }

export function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = getCart().reduce((s, i) => s + i.qty, 0);
}

// ----------------------------- Tarjeta de producto -----------------------------
export function productCard(p) {
  const img = p.images && p.images.length ? p.images[0] : '';
  return `
  <a class="product-card" href="#/product/${esc(p.id)}">
    <div class="thumb">
      ${img ? `<img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy">` : '<div style="display:grid;place-items:center;height:100%;font-size:40px;color:#cfd2da">📦</div>'}
      <span class="cat-tag">${esc(p.category)}</span>
    </div>
    <div class="body">
      <div class="title">${esc(p.title)}</div>
      <div class="seller">${esc(p.companyName || 'Tienda')}</div>
      <div class="pickup">📍 ${esc(p.pickupCity || 'Recogida en tienda')}</div>
      <div class="price">${money(p.price)}</div>
    </div>
  </a>`;
}

export function emptyState(icon, msg) {
  return `<div class="empty"><div class="big">${icon}</div><p>${msg}</p></div>`;
}
