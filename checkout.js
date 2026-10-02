// Vista: Checkout (beta - sin cobros reales)
import { getCart, money, esc, clearCart, toast } from '../ui.js';
import { api, PAYMENTS } from '../api.js';

export async function renderCheckout() {
  const cart = getCart();
  if (!cart.length) { location.hash = '#/cart'; return { html: '', onMount() {} }; }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const payOpts = PAYMENTS.map((p, i) => `
    <label class="pay-opt ${i === 0 ? 'active' : ''}" data-pay="${p.id}">
      <span class="dot"></span><span>${esc(p.name)}</span>
    </label>`).join('');

  const items = cart.map((i) => `
    <div class="line"><span>${esc(i.title)} ×${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join('');

  const html = `
  <div class="section-title"><h2>Finalizar compra</h2></div>
  <div class="checkout-grid">
    <div>
      <div class="beta-note">⚠️ <div><strong>Modo BETA.</strong> Esta es una versión de prueba: al pulsar “Confirmar” <strong>no se procesará ningún pago real</strong>. Solo se genera un pedido de demostración para recogida en tienda.</div></div>

      <h3>Datos del cliente</h3>
      <form id="fCheckout">
        <div class="field"><label>Nombre *</label><input name="name" required placeholder="Tu nombre"></div>
        <div class="row2">
          <div class="field"><label>Email *</label><input name="email" type="email" required placeholder="tu@email.com"></div>
          <div class="field"><label>Teléfono</label><input name="phone" placeholder="+34 600 000 000"></div>
        </div>

        <h3 style="margin-top:18px">Recogida en tienda (Click &amp; Collect)</h3>
        <div class="field"><label>Nombre para recoger *</label><input name="pickupName" required placeholder="Persona que recoge"></div>
        <div class="field"><label>Franja horaria preferida</label><input name="pickupTime" placeholder="Ej. Sábado 10-12h"></div>
        <div class="field"><label>Notas</label><textarea name="pickupNotes" placeholder="Instrucciones adicionales…"></textarea></div>

        <h3 style="margin-top:18px">Método de pago</h3>
        <div class="pay-list" id="payList">${payOpts}</div>

        <button class="btn btn-primary btn-block" type="submit" style="margin-top:20px">✓ Confirmar pedido (beta)</button>
      </form>
    </div>

    <aside class="summary">
      <h3>Tu pedido</h3>
      ${items}
      <div class="total"><span>Total</span><span>${money(total)}</span></div>
      <p style="font-size:12px;color:var(--muted);margin-top:10px">Recoge en la tienda del vendedor. Sin envíos.</p>
    </aside>
  </div>`;

  return {
    html,
    onMount(root) {
      const list = root.querySelector('#payList');
      let method = PAYMENTS[0].id;
      list.addEventListener('click', (e) => {
        const opt = e.target.closest('.pay-opt'); if (!opt) return;
        list.querySelectorAll('.pay-opt').forEach((x) => x.classList.remove('active'));
        opt.classList.add('active'); method = opt.dataset.pay;
      });

      root.querySelector('#fCheckout').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const btn = f.querySelector('button');
        btn.disabled = true; btn.textContent = 'Procesando…';
        const payload = {
          items: cart.map((i) => ({ productId: i.id, qty: i.qty })),
          paymentMethod: method,
          customer: { name: f.name.value, email: f.email.value, phone: f.phone.value },
          pickup: { name: f.pickupName.value, time: f.pickupTime.value, notes: f.pickupNotes.value },
        };
        try {
          const order = await api.post('/api/orders', payload);
          clearCart();
          location.hash = '#/order/' + order.id;
        } catch (err) {
          toast(err.message, 'err'); btn.disabled = false; btn.textContent = '✓ Confirmar pedido (beta)';
        }
      });
    },
  };
}
