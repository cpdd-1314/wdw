// Vista: Onboarding de vendedor (registro + datos de empresa + primer producto)
import { api, CATEGORIES } from '../api.js';
import { toast, esc, money } from '../ui.js';

let state = { step: 1, company: {}, product: { images: [] }, seller: null };

const catOptions = CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');

function renderShell(inner, step) {
  const steps = [
    { n: 1, t: 'Cuenta' },
    { n: 2, t: 'Empresa' },
    { n: 3, t: 'Producto' },
  ];
  const stepper = `<div class="stepper">${steps.map((s) => `<div class="step ${s.n === step ? 'active' : ''} ${s.n < step ? 'done' : ''}">${s.n < step ? '✓' : s.n}. ${s.t}</div>`).join('')}</div>`;
  return `<div class="auth-wrap" style="max-width:620px">${stepper}${inner}</div>`;
}

function stepAccount() {
  return renderShell(`
    <h2 style="text-align:center">Crea tu cuenta de vendedor</h2>
    <p style="text-align:center;color:var(--muted);margin-top:0">Empieza a vender en minutos</p>
    <form id="fAccount">
      <div class="field"><label>Email de la empresa</label><input type="email" name="email" required placeholder="ventas@empresa.com"></div>
      <div class="field"><label>Contraseña</label><input type="password" name="password" required minlength="6" placeholder="Mínimo 6 caracteres"></div>
      <button class="btn btn-primary btn-block" type="submit">Continuar</button>
    </form>
    <p style="text-align:center;margin-top:16px;font-size:14px">¿Ya tienes cuenta? <a href="#/login" style="color:var(--accent);font-weight:700">Inicia sesión</a></p>
  `, 1);
}

function stepCompany() {
  const c = state.company || {};
  return renderShell(`
    <h2>Datos de tu empresa</h2>
    <form id="fCompany">
      <div class="field"><label>Nombre de la tienda / empresa *</label><input name="name" required value="${esc(c.name)}" placeholder="Mi Tienda S.L."></div>
      <div class="row2">
        <div class="field"><label>NIF / Tax ID</label><input name="taxId" value="${esc(c.taxId)}" placeholder="ES12345678X"></div>
        <div class="field"><label>Teléfono</label><input name="phone" value="${esc(c.phone)}" placeholder="+34 600 000 000"></div>
      </div>
      <div class="field"><label>Dirección de recogida (Click & Collect) *</label><input name="address" required value="${esc(c.address)}" placeholder="Calle, número"></div>
      <div class="row2">
        <div class="field"><label>Ciudad *</label><input name="city" required value="${esc(c.city)}" placeholder="Madrid"></div>
        <div class="field"><label>Categoría principal</label><select name="category">${catOptions}</select></div>
      </div>
      <div class="field"><label>Logotipo</label><div id="logoUp" class="uploader"></div></div>
      <div class="field"><label>Descripción de la empresa</label><textarea name="description" placeholder="Cuéntale a los clientes sobre tu negocio…">${esc(c.description)}</textarea></div>
      <button class="btn btn-primary btn-block" type="submit">Guardar y continuar</button>
    </form>
  `, 2);
}

function stepProduct() {
  const p = state.product;
  return renderShell(`
    <h2>Publica tu primer producto</h2>
    <p style="color:var(--muted);margin-top:0">Sube fotos, precio y dónde se recoge.</p>
    <form id="fProduct">
      <div class="field"><label>Fotos del producto *</label><div id="imgUp" class="uploader"></div><div class="hint">Hasta 6 imágenes. La primera será la portada.</div></div>
      <div class="field"><label>Título *</label><input name="title" required placeholder="Ej. Auriculares inalámbricos X200"></div>
      <div class="row2">
        <div class="field"><label>Categoría *</label><select name="category" required>${catOptions}</select></div>
        <div class="field"><label>Precio (€) *</label><input name="price" type="number" min="0" step="0.01" required placeholder="29.99"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Stock disponible</label><input name="stock" type="number" min="1" value="10"></div>
        <div class="field"><label>Ciudad de recogida</label><input name="pickupCity" placeholder="(por defecto la de tu empresa)"></div>
      </div>
      <div class="field"><label>Dirección de recogida</label><input name="pickupAddress" placeholder="(por defecto la de tu empresa)"></div>
      <div class="field"><label>Instrucciones de recogida</label><textarea name="pickupInstructions" placeholder="Ej. Recoger en mostrador, pide tu pedido al llegar."></textarea></div>
      <div class="field"><label>Descripción</label><textarea name="description" placeholder="Características, estado, etc."></textarea></div>
      <button class="btn btn-primary btn-block" type="submit">Publicar producto</button>
    </form>
  `, 3);
}

// Subidor de imágenes reutilizable
function makeUploader(root, slotId, urls, max, single) {
  const up = root.querySelector('#' + slotId);
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*'; input.hidden = true;
  if (!single) input.multiple = true;
  up.appendChild(input);

  function paint() {
    up.querySelectorAll('.slot').forEach((s) => s.remove());
    urls.forEach((u, i) => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.innerHTML = `<img src="${esc(u)}"><button type="button" class="x" data-i="${i}">×</button>`;
      up.insertBefore(slot, input);
    });
    if (urls.length < max) {
      const add = document.createElement('div');
      add.className = 'slot'; add.textContent = '+';
      add.addEventListener('click', () => input.click());
      up.insertBefore(add, input);
    }
  }
  up.addEventListener('click', (e) => { if (e.target.classList.contains('x')) { urls.splice(+e.target.dataset.i, 1); paint(); } });
  input.addEventListener('change', async () => {
    const files = Array.from(input.files || []);
    for (const f of files) {
      if (urls.length >= max) break;
      const slot = document.createElement('div'); slot.className = 'slot busy'; slot.textContent = '↑'; up.insertBefore(slot, input);
      try { const r = await api.upload(f); urls.push(r.url); } catch (err) { toast(err.message, 'err'); }
    }
    input.value = '';
    paint();
  });
  paint();
}

export async function renderSell() {
  // Determinar paso inicial según sesión
  if (!api.token) { state.step = 1; }
  else {
    try { state.seller = await api.get('/api/me'); state.company = state.seller.company || {}; }
    catch (e) { api.setToken(null); state.step = 1; }
    if (state.step === 1) state.step = (state.company && state.company.name) ? 3 : 2;
  }

  let html;
  if (state.step === 1) html = stepAccount();
  else if (state.step === 2) html = stepCompany();
  else html = stepProduct();

  return {
    html,
    onMount(root) {
      if (state.step === 1) {
        root.querySelector('#fAccount').addEventListener('submit', async (e) => {
          e.preventDefault();
          const f = e.target;
          try {
            const r = await api.post('/api/sellers/register', { email: f.email.value, password: f.password.value, company: {} });
            api.setToken(r.token);
            state.seller = r.seller; state.company = r.seller.company || {};
            state.step = 2; route('#/sell');
          } catch (err) { toast(err.message, 'err'); }
        });
      } else if (state.step === 2) {
        makeUploader(root, 'logoUp', state.company.logo ? [state.company.logo] : [], 1, true);
        // sincronizar estado.company.logo con el array interno
        const syncLogo = () => { state.company.logo = (root.querySelector('#logoUp').querySelector('img') || {}).src || ''; };
        root.querySelector('#fCompany').addEventListener('submit', async (e) => {
          e.preventDefault();
          const f = e.target;
          const logoImg = root.querySelector('#logoUp img');
          const payload = {
            name: f.name.value, taxId: f.taxId.value, phone: f.phone.value,
            address: f.address.value, city: f.city.value, category: f.category.value,
            description: f.description.value, logo: logoImg ? logoImg.src : '',
          };
          try {
            const r = await api.put('/api/sellers/me', payload);
            state.seller = r; state.company = r.company || {};
            toast('Empresa guardada', 'ok');
            state.step = 3; route('#/sell');
          } catch (err) { toast(err.message, 'err'); }
        });
      } else {
        makeUploader(root, 'imgUp', state.product.images, 6, false);
        root.querySelector('#fProduct').addEventListener('submit', async (e) => {
          e.preventDefault();
          const f = e.target;
          if (!state.product.images.length) { toast('Sube al menos una foto', 'err'); return; }
          const payload = {
            title: f.title.value, category: f.category.value, price: f.price.value,
            stock: f.stock.value, description: f.description.value,
            images: state.product.images,
            pickupCity: f.pickupCity.value, pickupAddress: f.pickupAddress.value,
            pickupInstructions: f.pickupInstructions.value,
          };
          try {
            await api.post('/api/products', payload);
            toast('Producto publicado', 'ok');
            location.hash = '#/dashboard';
          } catch (err) { toast(err.message, 'err'); }
        });
      }
    },
  };
}

// navegación interna (re-render de la misma vista)
function route(h) { location.hash = h; }
