// Vista: Detalle de producto
import { api, catName } from '../api.js';
import { money, esc, addToCart, toast } from '../ui.js';

export async function renderProduct(params) {
  let p;
  try { p = await api.get('/api/products/' + params.id); } catch (e) {
    return { html: `<div class="empty"><div class="big">🚫</div><p>Producto no encontrado.</p></div>`, onMount() {} };
  }

  const imgs = p.images && p.images.length ? p.images : [''];
  const thumbs = imgs.map((src, i) => `<img src="${esc(src)}" class="${i === 0 ? 'active' : ''}" data-i="${i}" alt="">`).join('');
  const company = p.company || {};

  const html = `
  <div class="detail">
    <div class="gallery">
      <div class="main-img"><img id="mainImg" src="${esc(imgs[0])}" alt="${esc(p.title)}"></div>
      ${imgs.length > 1 ? `<div class="thumbs">${thumbs}</div>` : ''}
    </div>
    <div>
      <span class="tag">${esc(catName(p.category))}</span>
      <h1>${esc(p.title)}</h1>
      <div class="price">${money(p.price)}</div>
      <div class="meta">Vendido por <strong>${esc(p.companyName || 'Tienda')}</strong> · Stock: ${p.stock}</div>

      <div class="pickup-box">
        📍 <strong>Click &amp; Collect:</strong> recoge en <strong>${esc(p.pickupAddress || 'tienda')}${p.pickupCity ? ', ' + esc(p.pickupCity) : ''}</strong>.<br>
        ${p.pickupInstructions ? esc(p.pickupInstructions) : 'Te avisaremos cuando tu pedido esté listo para recoger.'}
      </div>

      <p class="meta">${esc(p.description)}</p>

      <div class="seller-card">
        ${company.logo ? `<img class="logo" src="${esc(company.logo)}" alt="">` : '<div class="logo" style="display:grid;place-items:center">🏬</div>'}
        <div>
          <div style="font-weight:700">${esc(p.companyName || 'Tienda')}</div>
          <div class="desc">${esc(company.description || (company.city ? 'Ubicados en ' + company.city : 'Vendedor verificado de Click & Collect'))}</div>
        </div>
      </div>

      <div style="display:flex;gap:12px;align-items:center;margin-top:18px">
        <div class="qty">
          <button id="qMinus" type="button">−</button>
          <input id="qty" value="1" inputmode="numeric" aria-label="Cantidad">
          <button id="qPlus" type="button">+</button>
        </div>
        <button class="btn btn-primary" id="addBtn" style="flex:1">🛒 Añadir al carrito</button>
      </div>
    </div>
  </div>`;

  return {
    html,
    onMount(root) {
      const main = root.querySelector('#mainImg');
      root.querySelectorAll('.thumbs img').forEach((im) => im.addEventListener('click', () => {
        main.src = im.src;
        root.querySelectorAll('.thumbs img').forEach((x) => x.classList.remove('active'));
        im.classList.add('active');
      }));
      const qty = root.querySelector('#qty');
      root.querySelector('#qMinus').addEventListener('click', () => { qty.value = Math.max(1, (parseInt(qty.value, 10) || 1) - 1); });
      root.querySelector('#qPlus').addEventListener('click', () => { qty.value = Math.min(p.stock, (parseInt(qty.value, 10) || 1) + 1); });
      root.querySelector('#addBtn').addEventListener('click', () => {
        addToCart({
          id: p.id, title: p.title, price: p.price, qty: parseInt(qty.value, 10) || 1,
          image: imgs[0], sellerId: p.sellerId, pickupCity: p.pickupCity, stock: p.stock,
        });
      });
    },
  };
}
