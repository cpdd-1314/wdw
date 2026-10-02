// Vista: Confirmación de pedido
import { api } from '../api.js';
import { money, esc } from '../ui.js';

export async function renderOrder(params) {
  let o;
  try { o = await api.get('/api/orders/' + params.id); }
  catch (e) { return { html: `<div class="empty"><div class="big">🚫</div><p>Pedido no encontrado.</p></div>`, onMount() {} }; }

  const items = o.items.map((i) => `
    <div class="line"><span>${esc(i.title)} ×${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join('');

  const html = `
  <div class="confirm">
    <div class="check">✓</div>
    <h2>¡Pedido confirmado!</h2>
    <p>Recibirás un aviso cuando esté listo para recoger en la tienda.</p>
    <div class="code">${esc(o.id)}</div>
    <div class="summary" style="text-align:left;margin-top:18px;position:static">
      ${items}
      <div class="total"><span>Total</span><span>${money(o.total)}</span></div>
    </div>
    <div style="text-align:left;margin-top:16px;font-size:14px;color:var(--ink-soft)">
      <p>💳 <strong>Pago:</strong> ${esc(o.paymentName)} <span class="tag">${esc(o.status)}</span></p>
      <p>📍 <strong>Recogida:</strong> ${esc(o.pickup.name || 'A nombre del cliente')}${o.pickup.time ? ' · ' + esc(o.pickup.time) : ''}</p>
      ${o.pickup.notes ? `<p>📝 ${esc(o.pickup.notes)}</p>` : ''}
    </div>
    <div class="beta-note" style="text-align:left;margin-top:16px">⚠️ Pedido de demostración (beta). No se ha cobrado nada y no hay envío; solo recogida en tienda.</div>
    <div style="display:flex;gap:12px;justify-content:center;margin-top:18px">
      <a href="#/" class="btn btn-primary">Seguir comprando</a>
      <a href="#/category/electronica" class="btn">Explorar</a>
    </div>
  </div>`;
  return { html, onMount() {} };
}
