// Vista: Inicio de sesión de vendedor
import { api } from '../api.js';
import { toast, esc } from '../ui.js';

export async function renderLogin() {
  const html = `
  <div class="auth-wrap">
    <h2>Iniciar sesión</h2>
    <p style="text-align:center;color:var(--muted);margin-top:0">Accede a tu panel de vendedor</p>
    <form id="loginForm">
      <div class="field">
        <label>Email</label>
        <input type="email" name="email" required placeholder="tu@empresa.com">
      </div>
      <div class="field">
        <label>Contraseña</label>
        <input type="password" name="password" required placeholder="••••••••">
      </div>
      <button class="btn btn-primary btn-block" type="submit">Entrar</button>
    </form>
    <p style="text-align:center;margin-top:16px;font-size:14px">¿Aún no vendes? <a href="#/sell" style="color:var(--accent);font-weight:700">Crea tu tienda</a></p>
  </div>`;

  return {
    html,
    onMount(root) {
      root.querySelector('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        try {
          const r = await api.post('/api/auth/login', { email: f.email.value, password: f.password.value });
          api.setToken(r.token);
          toast('Sesión iniciada', 'ok');
          location.hash = '#/dashboard';
        } catch (err) { toast(err.message, 'err'); }
      });
    },
  };
}
