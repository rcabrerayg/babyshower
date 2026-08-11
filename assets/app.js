/* La lista del bebé — lógica de invitados */

const sb = window.supabase.createClient(window.BABY_CONFIG.url, window.BABY_CONFIG.anonKey);

const CAT_EMOJI = {
  'Paseo y porteo': '🦆',
  'Sueño': '🌙',
  'Alimentación': '🍼',
  'Baño e higiene': '🫧',
  'Salud y hogar': '🏡',
  'Juego': '🧸',
  'Ropa': '🧦',
  'Otros': '🎁',
};
const CAT_ORDER = Object.keys(CAT_EMOJI);

let gifts = [];
let activeCat = '*';
let hideClaimed = false;
let selectedGift = null;

const $ = (sel) => document.querySelector(sel);
const listEl = $('#list');
const controlsEl = $('#controls');
const backdrop = $('#modal-backdrop');

// reservas hechas desde este dispositivo
const myClaims = new Set(JSON.parse(localStorage.getItem('babyshower_claims') || '[]'));
function rememberClaim(id) {
  myClaims.add(id);
  localStorage.setItem('babyshower_claims', JSON.stringify([...myClaims]));
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadGifts() {
  const { data, error } = await sb
    .from('gifts')
    .select('id, name, description, url, image_url, price_hint, category, priority, claimed')
    .order('priority', { ascending: false })
    .order('name');
  if (error) {
    listEl.innerHTML = '<div class="empty">No se pudo cargar la lista 😢 Prueba a recargar la página.</div>';
    console.error(error);
    return;
  }
  gifts = data;
  render();
}

function updateProgress() {
  const total = gifts.length;
  const taken = gifts.filter((g) => g.claimed).length;
  $('#progress-count').textContent = `${taken} de ${total}`;
  $('#progress-fill').style.width = total ? `${(taken / total) * 100}%` : '0%';
}

function renderChips() {
  const cats = [...new Set(gifts.map((g) => g.category))]
    .sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b));
  controlsEl.querySelectorAll('.chip[data-cat]:not([data-cat="*"])').forEach((c) => c.remove());
  const toggle = controlsEl.querySelector('.toggle-claimed');
  for (const cat of cats) {
    const btn = document.createElement('button');
    btn.className = 'chip' + (activeCat === cat ? ' active' : '');
    btn.dataset.cat = cat;
    btn.textContent = `${CAT_EMOJI[cat] || '🎁'} ${cat}`;
    controlsEl.insertBefore(btn, toggle);
  }
}

function cardHtml(g) {
  const mine = myClaims.has(g.id);
  const stamp = g.claimed
    ? `<span class="claimed-stamp ${mine ? 'mine' : ''}">${mine ? 'Elegido por ti ✨' : 'Ya elegido 💝'}</span>`
    : `<span class="corner-heart">🤍</span>`;
  return `
    <article class="card ${g.claimed ? 'claimed' : ''}" data-id="${g.id}">
      ${stamp}
      ${g.image_url ? `<img class="gift-img" src="${escapeHtml(g.image_url)}" alt="" loading="lazy">` : ''}
      <h3>${escapeHtml(g.name)}</h3>
      ${g.description ? `<p class="desc">${escapeHtml(g.description)}</p>` : '<p class="desc"></p>'}
      <div class="meta">
        ${g.price_hint ? `<span class="price-tag">${escapeHtml(g.price_hint)}</span>` : ''}
        ${g.url ? `<a class="idea-link" href="${escapeHtml(g.url)}" target="_blank" rel="noopener">Ver idea ↗</a>` : ''}
      </div>
      ${g.claimed ? '' : `<button class="btn-claim" data-claim="${g.id}">Lo regalo yo 🎁</button>`}
    </article>`;
}

function render() {
  updateProgress();
  renderChips();

  const visible = gifts
    .filter((g) => activeCat === '*' || g.category === activeCat)
    .filter((g) => !hideClaimed || !g.claimed);

  if (!visible.length) {
    listEl.innerHTML = '<div class="empty">Nada por aquí… ¡prueba otra categoría! 🌿</div>';
    return;
  }

  const byCat = new Map();
  for (const g of visible) {
    if (!byCat.has(g.category)) byCat.set(g.category, []);
    byCat.get(g.category).push(g);
  }

  const cats = [...byCat.keys()].sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b));
  listEl.innerHTML = cats.map((cat) => {
    const items = byCat.get(cat);
    const free = items.filter((g) => !g.claimed).length;
    return `
      <section class="category">
        <div class="category-head">
          <span class="emoji">${CAT_EMOJI[cat] || '🎁'}</span>
          <h2>${escapeHtml(cat)}</h2>
          <span class="count">${free} disponible${free === 1 ? '' : 's'}</span>
        </div>
        <div class="grid">${items.map(cardHtml).join('')}</div>
      </section>`;
  }).join('');
}

// ————— interacción —————

controlsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip[data-cat]');
  if (!chip) return;
  activeCat = chip.dataset.cat;
  controlsEl.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === chip));
  render();
});

$('#hide-claimed').addEventListener('change', (e) => {
  hideClaimed = e.target.checked;
  render();
});

listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-claim]');
  if (!btn) return;
  selectedGift = gifts.find((g) => g.id === btn.dataset.claim);
  if (!selectedGift) return;
  $('#modal-gift-name').textContent = selectedGift.name;
  $('#modal-form').style.display = '';
  $('#modal-success').style.display = 'none';
  $('#claimer-name').value = '';
  $('#claimer-message').value = '';
  backdrop.classList.add('open');
  $('#claimer-name').focus();
});

$('#modal-cancel').addEventListener('click', () => backdrop.classList.remove('open'));
$('#modal-close').addEventListener('click', () => backdrop.classList.remove('open'));
backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.classList.remove('open'); });

$('#modal-confirm').addEventListener('click', async () => {
  if (!selectedGift) return;
  const btn = $('#modal-confirm');
  btn.disabled = true;
  const { data: ok, error } = await sb.rpc('claim_gift', {
    p_gift_id: selectedGift.id,
    p_name: $('#claimer-name').value,
    p_message: $('#claimer-message').value,
  });
  btn.disabled = false;

  if (error) {
    toast('Ups, algo falló. Inténtalo de nuevo 🙏');
    console.error(error);
    return;
  }
  if (!ok) {
    backdrop.classList.remove('open');
    toast('¡Vaya! Alguien lo acaba de elegir hace un momento 😅');
    await loadGifts();
    return;
  }

  rememberClaim(selectedGift.id);
  selectedGift.claimed = true;
  $('#modal-form').style.display = 'none';
  $('#modal-success').style.display = '';
  confettiBurst();
  render();
});

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

function confettiBurst() {
  const modal = $('#modal');
  const colors = ['#92b4c8', '#a8b79b', '#d9a08b', '#f0dfc0', '#5b7c93'];
  for (let i = 0; i < 26; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.2 + Math.random() * 1.4 + 's';
    c.style.animationDelay = Math.random() * 0.3 + 's';
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    modal.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}

// ————— realtime: la lista se actualiza sola —————
sb.channel('gifts-live')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'gifts' }, () => loadGifts())
  .subscribe();

loadGifts();
