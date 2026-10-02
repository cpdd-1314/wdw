// Vista: Carrito
import { getCart, setQty, removeFromCart, saveCart, money, esc, emptyState } from '../ui.js';

export async function renderCart() {
  const cart = getCart();
  if (!cart.length) {
    return { html: emptyState('🛒', 'Tu carrito está vacío. <a href="#/category/electronica" style="color:var(--accent)">Sigue comprando</a>'), onMount() {} };
  }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const items = cart.map((i) => `
    <div class="cart-item">
      <img src="${esc(i.image)}" alt="${esc(i.title)}">
      <div>
        <div class="ci-title">${esc(i.title)}</div>
        <div class="ci-pickup">📍 Recogida: ${esc(i.pickupCity || 'tienda')}</div>
        <div class="qty" style="margin-top:8px">
          <button data-minus="${i.id}">−</button>
          <input value="${i.qty}" data-set="${i.id}" inputmode="numeric" style="width:52px;text-align:center;border:0;border-left:1px solid var(--line);border-right:1px solid var(--line);border-radius:0">
          <button data-plus="${i.id}">+</button>
        </div>
      </div>
      <div class="ci-right">
        <div class="ci-price">${money(i.price * i.qty)}</div>
        <button class="btn btn-sm btn-danger" data-del="${i.id}" style="margin-top:8px">Quitar</button>
      </div>
    </div>`).join('');

  const html = `
  <div class="section-title"><h2>Tu carrito</h2></div>
  <div class="cart-layout">
    <div>${items}</div>
    <aside class="summary">
      <h3>Resumen</h3>
      <div class="line"><span>Productos</span><span>${cart.reduce((s, i) => s + i.qty, 0)}</span></div>
      <div class="line"><span>Envío</span><span style="color:var(--green);font-weight:700">Click &amp; Collect · Gratis</span></div>
      <div class="total"><span>Total</span><span>${money(total)}</span></div>
      <button class="btn btn-primary btn-block" id="toCheckout" style="margin-top:14px">Ir a pagar (beta)</button>
      <p style="font-size:12px;color:var(--muted);margin-top:10px;text-align:center">🔒 Modo beta: no se cobrará nada.</p>
    </aside>
  </div>`;

  return {
    html,
    onMount(root) {
      root.querySelectorAll('[data-minus]').forEach((b) => b.addEventListener('click', () => {
        const it = getCart().find((x) => x.id === b.dataset.minus); if (it) setQty(it.id, it.qty - 1);
        route('#/cart');
      }));
      root.querySelectorAll('[data-plus]').forEach((b) => b.addEventListener('click', () => {
        const it = getCart().find((x) => x.id === b.dataset.plus); if (it) setQty(it.id, it.qty + 1);
        route('#/cart');
      }));
      root.querySelectorAll('[data-set]').forEach((inp) => inp.addEventListener('change', () => {
        setQty(inp.dataset.set, parseInt(inp.value, 10) || 1); route('#/cart');
      }));
      root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { removeFromCart(b.dataset.del); route('#/cart'); }));
      root.querySelector('#toCheckout').addEventListener('click', () => route('#/checkout'));
    },
  };
}
function route(h) { location.hash = h; }
