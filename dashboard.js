// Vista: Panel de vendedor (dashboard)
import { api, CATEGORIES, catName } from '../api.js';
import { money, esc, toast, productCard, emptyState } from '../ui.js';

const catOptions = CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');

export async function renderDashboard() {
  if (!api.token) { location.hash = '#/login'; return { html: '', onMount() {} }; }
  let seller, products = [], orders = [];
  try {
    seller = await api.get('/api/me');
    products = await api.get('/api/products?seller=' + seller.id);
    orders = await api.get('/api/sellers/' + seller.id + '/orders');
  } catch (e) { api.setToken(null); location.hash = '#/login'; return { html: '', onMount() {} }; }

  const stockTotal = products.reduce((s, p) => s + p.stock, 0);
  const ordersTotal = orders.reduce((s, o) => s + o.total, 0);

  const prodHtml = products.length
    ? `<div class="dash-grid">${products.map((p) => `
        <div class="dash-card">
          <div class="thumb">${p.images[0] ? `<img src="${esc(p.images[0])}" alt="">` : ''}</div>
          <div class="body">
            <div style="font-weight:600">${esc(p.title)}</div>
            <div class="p">${money(p.price)}</div>
            <div style="font-size:12.5px;color:var(--muted)">Stock: ${p.stock} · ${esc(catName(p.category))}</div>
            <div class="acts">
              <a class="btn btn-sm" href="#/edit/${p.id}">Editar</a>
              <button class="btn btn-sm btn-danger" data-del="${p.id}">Eliminar</button>
            </div>
          </div>
        </div>`).join('')}</div>`
    : emptyState('📦', 'Aún no tienes productos. <a href="#/sell" style="color:var(--accent)">Publica el primero</a>');

  const orderHtml = orders.length
    ? orders.map((o) => `
      <div style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between"><strong>${esc(o.id)}</strong><span class="tag">${esc(o.status)}</span></div>
        <div style="font-size:13.5px;color:var(--muted);margin:4px 0">${o.items.length} artículo(s) · ${money(o.total)} · ${esc(o.paymentName)}</div>
        <div style="font-size:13px">📍 Recoge: ${esc(o.pickup.name || o.pickup.time || 'Por confirmar')}</div>
      </div>`).join('')
    : `<p style="color:var(--muted)">Sin pedidos todavía.</p>`;

  const html = `
  <div class="dash-head">
    <div>
      <h2 style="margin:0">Hola, ${esc(seller.company.name || seller.email)}</h2>
      <p style="color:var(--muted);margin:0">${esc(seller.company.city || '')} · Click &amp; Collect</p>
    </div>
    <a href="#/sell" class="btn btn-primary">+ Nuevo producto</a>
  </div>

  <div class="stat-row">
    <div class="stat"><div class="n">${products.length}</div><div class="l">Productos publicados</div></div>
    <div class="stat"><div class="n">${stockTotal}</div><div class="l">Unidades en stock</div></div>
    <div class="stat"><div class="n">${orders.length}</div><div class="l">Pedidos (beta)</div></div>
    <div class="stat"><div class="n">${money(ordersTotal)}</div><div class="l">Ventas potenciales</div></div>
  </div>

  <div class="section-title"><h2>Mis productos</h2><a href="#/sell">Añadir</a></div>
  ${prodHtml}

  <div class="section-title"><h2>Pedidos recibidos</h2></div>
  ${orderHtml}
  `;

  return {
    html,
    onMount(root) {
      root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este producto?')) return;
        try { await api.del('/api/products/' + b.dataset.del); toast('Producto eliminado', 'ok'); route('#/dashboard'); }
        catch (err) { toast(err.message, 'err'); }
      }));
    },
  };
}
function route(h) { location.hash = h; }
