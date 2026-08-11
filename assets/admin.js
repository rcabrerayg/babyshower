/* Panel admin — todas las operaciones pasan por RPCs con clave */

const sb = window.supabase.createClient(window.BABY_CONFIG.url, window.BABY_CONFIG.anonKey);

const $ = (sel) => document.querySelector(sel);
let pass = sessionStorage.getItem('babyshower_admin_pass') || '';
let gifts = [];
let claims = [];

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

async function login(p) {
  const { data: ok, error } = await sb.rpc('admin_login', { p_pass: p });
  if (error) { toast('Error de conexión'); return false; }
  return ok === true;
}

async function init() {
  if (pass && await login(pass)) {
    showPanel();
  } else {
    sessionStorage.removeItem('babyshower_admin_pass');
    $('#login-box').style.display = '';
  }
}

$('#login-btn').addEventListener('click', doLogin);
$('#pass-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

async function doLogin() {
  const p = $('#pass-input').value.trim();
  if (!p) return;
  if (await login(p)) {
    pass = p;
    sessionStorage.setItem('babyshower_admin_pass', p);
    showPanel();
  } else {
    $('#login-error').style.display = '';
  }
}

async function showPanel() {
  $('#login-box').style.display = 'none';
  $('#panel').style.display = '';
  await refresh();
}

async function refresh() {
  const [g, c] = await Promise.all([
    sb.from('gifts').select('*').order('category').order('priority', { ascending: false }),
    sb.rpc('admin_list_claims', { p_pass: pass }),
  ]);
  gifts = g.data || [];
  claims = c.data || [];
  renderClaims();
  renderGifts();
}

function renderClaims() {
  if (!claims.length) {
    $('#claims-table').innerHTML = '<p style="color:var(--ink-soft)">Todavía no hay reservas.</p>';
    return;
  }
  $('#claims-table').innerHTML = `
    <div style="overflow-x:auto"><table class="admin-table">
      <thead><tr><th>Regalo</th><th>Quién</th><th>Mensaje</th><th>Cuándo</th></tr></thead>
      <tbody>
        ${claims.map((c) => `
          <tr>
            <td><strong>${escapeHtml(c.gift_name)}</strong></td>
            <td>${escapeHtml(c.claimer_name || '(anónimo)')}</td>
            <td>${escapeHtml(c.message || '—')}</td>
            <td>${new Date(c.claimed_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</td>
          </tr>`).join('')}
      </tbody>
    </table></div>`;
}

function renderGifts() {
  $('#gift-count').textContent = gifts.length;
  $('#gifts-tbody').innerHTML = gifts.map((g) => `
    <tr>
      <td><strong>${escapeHtml(g.name)}</strong>${g.description ? `<br><span style="color:var(--ink-soft)">${escapeHtml(g.description)}</span>` : ''}</td>
      <td>${escapeHtml(g.category)}</td>
      <td>${escapeHtml(g.price_hint || '—')}</td>
      <td>${g.unlimited
        ? `<span class="badge free">∞ ilimitado${g.claims_count ? ` · ${g.claims_count}` : ''}</span>`
        : (g.claimed ? '<span class="badge taken">Reservado</span>' : '<span class="badge free">Disponible</span>')}</td>
      <td style="white-space:nowrap">
        <button class="mini-btn" data-edit="${g.id}">Editar</button>
        ${g.claimed ? `<button class="mini-btn" data-unclaim="${g.id}">Liberar</button>` : ''}
        <button class="mini-btn danger" data-del="${g.id}">Borrar</button>
      </td>
    </tr>`).join('');
}

// ————— formulario añadir / editar —————

$('#gift-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#f-id').value;
  const fields = {
    p_pass: pass,
    p_name: $('#f-name').value.trim(),
    p_description: $('#f-desc').value.trim() || null,
    p_url: $('#f-url').value.trim() || null,
    p_image_url: $('#f-img').value.trim() || null,
    p_price_hint: $('#f-price').value.trim() || null,
    p_category: $('#f-cat').value,
    p_priority: parseInt($('#f-priority').value, 10) || 0,
    p_unlimited: $('#f-unlimited').checked,
  };
  const { error } = id
    ? await sb.rpc('admin_update_gift', { ...fields, p_gift_id: id })
    : await sb.rpc('admin_add_gift', fields);
  if (error) { toast('Error al guardar 😢'); console.error(error); return; }
  toast(id ? 'Regalo actualizado ✔' : 'Regalo añadido ✔');
  resetForm();
  await refresh();
});

function resetForm() {
  $('#gift-form').reset();
  $('#f-id').value = '';
  $('#f-priority').value = 5;
  $('#f-submit').textContent = 'Guardar regalo';
  $('#f-reset').style.display = 'none';
}
$('#f-reset').addEventListener('click', resetForm);

// ————— acciones de tabla —————

$('#gifts-tbody').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  if (btn.dataset.edit) {
    const g = gifts.find((x) => x.id === btn.dataset.edit);
    if (!g) return;
    $('#f-id').value = g.id;
    $('#f-name').value = g.name;
    $('#f-desc').value = g.description || '';
    $('#f-url').value = g.url || '';
    $('#f-img').value = g.image_url || '';
    $('#f-price').value = g.price_hint || '';
    $('#f-cat').value = g.category;
    $('#f-priority').value = g.priority;
    $('#f-unlimited').checked = !!g.unlimited;
    $('#f-submit').textContent = 'Actualizar regalo';
    $('#f-reset').style.display = '';
    $('#gift-form').scrollIntoView({ behavior: 'smooth' });
  }

  if (btn.dataset.unclaim) {
    if (!confirm('¿Liberar este regalo? Se borrará la reserva y volverá a estar disponible.')) return;
    const { error } = await sb.rpc('admin_unclaim_gift', { p_pass: pass, p_gift_id: btn.dataset.unclaim });
    if (error) { toast('Error al liberar'); return; }
    toast('Regalo liberado ✔');
    await refresh();
  }

  if (btn.dataset.del) {
    if (!confirm('¿Borrar este regalo de la lista? Esta acción no se puede deshacer.')) return;
    const { error } = await sb.rpc('admin_delete_gift', { p_pass: pass, p_gift_id: btn.dataset.del });
    if (error) { toast('Error al borrar'); return; }
    toast('Regalo borrado ✔');
    await refresh();
  }
});

init();
