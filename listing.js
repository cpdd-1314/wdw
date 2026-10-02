// Vista: Listado por categoría o búsqueda
import { api, CATEGORIES, catName } from '../api.js';
import { productCard, emptyState } from '../ui.js';

export async function renderListing(params) {
  const { type, value } = params; // type: 'category' | 'search'
  const isSearch = type === 'search';
  const title = isSearch ? `Resultados: "${value}"` : catName(value);

  let products = [];
  const sort = params.query && params.query.sort ? params.query.sort : 'new';
  const qs = isSearch
    ? `/api/products?q=${encodeURIComponent(value)}&sort=${sort}`
    : `/api/products?category=${encodeURIComponent(value)}&sort=${sort}`;
  try { products = await api.get(qs); } catch (e) {}

  const opts = CATEGORIES.map((c) => `<option value="${c.id}" ${!isSearch && c.id === value ? 'selected' : ''}>${c.name}</option>`).join('');
  const html = `
  <div class="section-title"><h2>${esc(title)}</h2></div>
  <div class="toolbar">
    <select id="fCat">
      <option value="">Todas las categorías</option>
      ${opts}
    </select>
    <select id="fSort">
      <option value="new" ${sort === 'new' ? 'selected' : ''}>Más recientes</option>
      <option value="price_asc" ${sort === 'price_asc' ? 'selected' : ''}>Precio: menor a mayor</option>
      <option value="price_desc" ${sort === 'price_desc' ? 'selected' : ''}>Precio: mayor a menor</option>
    </select>
    <span class="count">${products.length} producto(s)</span>
  </div>
  ${products.length ? `<div class="grid">${products.map(productCard).join('')}</div>` : emptyState('🔍', 'No encontramos productos. Prueba otra categoría o búsqueda.')}
  `;

  return {
    html,
    onMount(root) {
      const fCat = root.querySelector('#fCat');
      const fSort = root.querySelector('#fSort');
      const go = () => {
        const cat = fCat.value;
        const sort = fSort.value;
        const base = cat ? `#/category/${cat}` : (isSearch ? `#/search/${encodeURIComponent(value)}` : '#/category/electronica');
        // conservamos sort vía query en hash
        location.hash = `${base}?sort=${sort}`;
      };
      fCat.addEventListener('change', go);
      fSort.addEventListener('change', go);
    },
  };
}

// Pequeño helper de escape local
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// Soporta hash con query: #/category/electronica?sort=price_asc
export function parseHash(hash) {
  const clean = hash.replace(/^#\/?/, '');
  const [path, query] = clean.split('?');
  const parts = path.split('/').filter(Boolean);
  const q = {};
  if (query) query.split('&').forEach((kv) => { const [k, v] = kv.split('='); q[k] = decodeURIComponent(v || ''); });
  return { parts, query: q };
}
