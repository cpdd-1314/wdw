// Vista: Editar producto existente
import { api, CATEGORIES } from '../api.js';
import { toast, esc } from '../ui.js';

const catOptions = CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');

export async function renderEdit(params) {
  if (!api.token) { location.hash = '#/login'; return { html: '', onMount() {} }; }
  let p;
  try { p = await api.get('/api/products/' + params.id); } catch (e) {
    return { html: `<div class="empty"><div class="big">🚫</div><p>Producto no encontrado.</p></div>`, onMount() {} };
  }

  const html = `
  <div class="auth-wrap" style="max-width:620px">
    <h2>Editar producto</h2>
    <form id="fEdit">
      <div class="field"><label>Fotos</label><div id="imgUp" class="uploader"></div></div>
      <div class="field"><label>Título *</label><input name="title" required value="${esc(p.title)}"></div>
      <div class="row2">
        <div class="field"><label>Categoría *</label><select name="category" required>${catOptions}</select></div>
        <div class="field"><label>Precio (€) *</label><input name="price" type="number" min="0" step="0.01" required value="${p.price}"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Stock</label><input name="stock" type="number" min="0" value="${p.stock}"></div>
        <div class="field"><label>Ciudad de recogida</label><input name="pickupCity" value="${esc(p.pickupCity)}"></div>
      </div>
      <div class="field"><label>Dirección de recogida</label><input name="pickupAddress" value="${esc(p.pickupAddress)}"></div>
      <div class="field"><label>Instrucciones de recogida</label><textarea name="pickupInstructions">${esc(p.pickupInstructions)}</textarea></div>
      <div class="field"><label>Descripción</label><textarea name="description">${esc(p.description)}</textarea></div>
      <button class="btn btn-primary btn-block" type="submit">Guardar cambios</button>
      <a href="#/dashboard" class="btn btn-block" style="margin-top:10px">Cancelar</a>
    </form>
  </div>`;

  const images = (p.images || []).slice();

  return {
    html,
    onMount(root) {
      root.querySelector('select[name=category]').value = p.category;
      // uploader
      const up = root.querySelector('#imgUp');
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*'; input.multiple = true; input.hidden = true; up.appendChild(input);
      function paint() {
        up.querySelectorAll('.slot').forEach((s) => s.remove());
        images.forEach((u, i) => {
          const slot = document.createElement('div'); slot.className = 'slot';
          slot.innerHTML = `<img src="${esc(u)}"><button type="button" class="x" data-i="${i}">×</button>`;
          up.insertBefore(slot, input);
        });
        if (images.length < 6) { const add = document.createElement('div'); add.className = 'slot'; add.textContent = '+'; add.addEventListener('click', () => input.click()); up.insertBefore(add, input); }
      }
      up.addEventListener('click', (e) => { if (e.target.classList.contains('x')) { images.splice(+e.target.dataset.i, 1); paint(); } });
      input.addEventListener('change', async () => {
        for (const f of Array.from(input.files || [])) {
          if (images.length >= 6) break;
          const slot = document.createElement('div'); slot.className = 'slot busy'; slot.textContent = '↑'; up.insertBefore(slot, input);
          try { const r = await api.upload(f); images.push(r.url); } catch (err) { toast(err.message, 'err'); }
        }
        input.value = ''; paint();
      });
      paint();

      root.querySelector('#fEdit').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const payload = {
          title: f.title.value, category: f.category.value, price: f.price.value, stock: f.stock.value,
          description: f.description.value, images, pickupCity: f.pickupCity.value,
          pickupAddress: f.pickupAddress.value, pickupInstructions: f.pickupInstructions.value,
        };
        try { await api.put('/api/products/' + p.id, payload); toast('Cambios guardados', 'ok'); location.hash = '#/dashboard'; }
        catch (err) { toast(err.message, 'err'); }
      });
    },
  };
}
