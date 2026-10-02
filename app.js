// Router principal de la SPA + cabecera
import { api, CATEGORIES } from './api.js';
import { updateCartCount } from './ui.js';
import { renderHome } from './views/home.js';
import { renderListing, parseHash } from './views/listing.js';
import { renderProduct } from './views/product.js';
import { renderSell } from './views/sell.js';
import { renderDashboard } from './views/dashboard.js';
import { renderLogin } from './views/auth.js';
import { renderCart } from './views/cart.js';
import { renderCheckout } from './views/checkout.js';
import { renderOrder } from './views/order.js';
import { renderEdit } from './views/edit.js';

const app = document.getElementById('app');
document.getElementById('year').textContent = new Date().getFullYear();

// Estado de sesión visual
api.setToken(api.token);

// Barra de categorías
const catBar = document.getElementById('catBar');
catBar.innerHTML = CATEGORIES.map((c) => `<a href="#/category/${c.id}">${c.icon} ${c.name}</a>`).join('');

// Buscador
document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = document.getElementById('searchInput').value.trim();
  if (q) location.hash = '#/search/' + encodeURIComponent(q);
});

// Logout
document.getElementById('navLogout').addEventListener('click', async () => {
  try { await api.post('/api/auth/logout'); } catch (e) {}
  api.setToken(null);
  location.hash = '#/';
});

async function router() {
  const h = location.hash || '#/';
  const { parts, query } = parseHash(h);
  const [seg, param] = parts;
  let view;

  if (!seg) view = await renderHome();
  else if (seg === 'category') view = await renderListing({ type: 'category', value: param });
  else if (seg === 'search') view = await renderListing({ type: 'search', value: decodeURIComponent(param || '') });
  else if (seg === 'product') view = await renderProduct({ id: param });
  else if (seg === 'sell') view = await renderSell();
  else if (seg === 'dashboard') view = await renderDashboard();
  else if (seg === 'login') view = await renderLogin();
  else if (seg === 'edit') view = await renderEdit({ id: param });
  else if (seg === 'cart') view = await renderCart();
  else if (seg === 'checkout') view = await renderCheckout();
  else if (seg === 'order') view = await renderOrder({ id: param });
  else view = await renderHome();

  app.innerHTML = view.html || '';
  if (view.onMount) view.onMount(app);
  updateCartCount();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

window.addEventListener('hashchange', router);
router();
