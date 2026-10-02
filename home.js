// Vista: Inicio
import { api, CATEGORIES } from '../api.js';
import { productCard, emptyState } from '../ui.js';

export async function renderHome() {
  let products = [];
  try { products = await api.get('/api/products?sort=new'); } catch (e) { /* red */ }

  const catCards = CATEGORIES.map((c) => `
    <a class="product-card" href="#/category/${c.id}" style="text-align:center;align-items:center;padding:18px 10px">
      <div style="font-size:34px">${c.icon}</div>
      <div class="title" style="min-height:auto">${c.name}</div>
    </a>`).join('');

  const grid = products.length
    ? `<div class="grid">${products.slice(0, 12).map(productCard).join('')}</div>`
    : emptyState('🛒', 'Aún no hay productos. ¡Sé el primero en vender!');

  const html = `
  <section class="hero">
    <h1>Tu marketplace con recogida en tienda</h1>
    <p>Compra cerca de ti y retira tu pedido cuando quieras. Vendedores locales, miles de productos, Click &amp; Collect.</p>
    <div class="hero-cta">
      <a href="#/category/electronica" class="btn btn-primary">Explorar productos</a>
      <a href="#/sell" class="btn btn-dark">Vende en Click &amp; Collect</a>
    </div>
  </section>

  <div class="section-title"><h2>CExplora por categoría</h2><a href="#/category/electronica">Ver todo</a></div>
  <div class="grid">${catCards}</div>

  <div class="section-title"><h2>Novedades cerca de ti</h2><a href="#/category/electronica">Ver todo</a></div>
  ${grid}
  `;
  return { html, onMount() {} };
}
