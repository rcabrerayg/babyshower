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
  'Recuerdos': '📸',
  'Para los papás': '🤍',
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
    .select('id, name, description, url, image_url, price_hint, category, priority, claimed, unlimited, claims_count')
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

// hash estable por id → rotación/variación de cada papelito
function seededRot(id, spread = 2.1) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return ((h / 997) * 2 - 1) * spread;
}

const TAPE_COLOR = {
  'Paseo y porteo': '#f0dfc0',
  'Sueño': '#dce9f1',
  'Alimentación': '#e7ecdf',
  'Baño e higiene': '#dce9f1',
  'Salud y hogar': '#f6e5dd',
  'Juego': '#f6e5dd',
  'Ropa': '#e7ecdf',
  'Recuerdos': '#f0dfc0',
  'Para los papás': '#f6e5dd',
  'Otros': '#f0dfc0',
};

// cuerda de tender: una prenda colgada por regalo elegido
const GARMENT_COLORS = ['#92b4c8', '#a8b79b', '#d9a08b', '#e4c98e', '#5b7c93'];
const GARMENTS = [
  // body
  'M9 1 L19 1 L27 8 L22 14 L20 12 L20 21 Q20 23 18 23 L10 23 Q8 23 8 21 L8 12 L6 14 L1 8 Z',
  // camiseta
  'M9 1 L19 1 L27 7 L23 12 L20 10 L20 19 Q20 21 18 21 L10 21 Q8 21 8 19 L8 10 L5 12 L1 7 Z M12 1 Q14 4 16 1',
  // pantaloncito
  'M6 2 L22 2 L24 20 Q24 22 22 22 L17 22 L14 10 L11 22 L6 22 Q4 22 4 20 Z',
];

function updateProgress() {
  const normal = gifts.filter((g) => !g.unlimited);
  const total = normal.length;
  const taken = normal.filter((g) => g.claimed).length;
  const label = $('#progress-count');
  label.textContent = taken === 0
    ? 'aún no hay regalos elegidos — ¡estrena la cuerda!'
    : `${taken} de ${total} regalos ya tienen dueño`;

  const svg = $('#clothesline');
  const W = 600, ROPE_Y0 = 22, ROPE_MID = 58, ROPE_Y1 = 22;
  const shown = Math.min(taken, 12);
  const extra = taken - shown;
  let parts = [
    `<path d="M8 ${ROPE_Y0} Q ${W / 2} ${ROPE_MID} ${W - 8} ${ROPE_Y1}" stroke="#b8a98f" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    // pinzas de los extremos
    `<line x1="8" y1="${ROPE_Y0 - 8}" x2="8" y2="${ROPE_Y0 + 4}" stroke="#8d7f68" stroke-width="3" stroke-linecap="round"/>`,
    `<line x1="${W - 8}" y1="${ROPE_Y1 - 8}" x2="${W - 8}" y2="${ROPE_Y1 + 4}" stroke="#8d7f68" stroke-width="3" stroke-linecap="round"/>`,
  ];
  for (let i = 0; i < shown; i++) {
    const t = shown === 1 ? 0.5 : 0.09 + (i / (shown - 1)) * 0.82;
    // punto sobre la curva cuadrática
    const x = (1 - t) ** 2 * 8 + 2 * (1 - t) * t * (W / 2) + t ** 2 * (W - 8);
    const y = (1 - t) ** 2 * ROPE_Y0 + 2 * (1 - t) * t * ROPE_MID + t ** 2 * ROPE_Y1;
    const color = GARMENT_COLORS[i % GARMENT_COLORS.length];
    const shape = GARMENTS[i % GARMENTS.length];
    parts.push(`
      <g transform="translate(${x - 14}, ${y - 1})">
        <g class="garment" style="animation-delay:${i * 0.08}s, ${i * 0.4}s">
          <rect x="12" y="-2" width="4" height="7" rx="1.5" fill="#8d7f68"/>
          <g transform="translate(0, 4)"><path d="${shape}" fill="${color}" fill-opacity=".9" stroke="#3e3a34" stroke-opacity=".22" stroke-width="1"/></g>
        </g>
      </g>`);
  }
  if (extra > 0) {
    parts.push(`<text x="${W - 14}" y="${ROPE_Y1 + 46}" text-anchor="end" font-family="Caveat, cursive" font-size="22" fill="#7d766b" transform="rotate(-3 ${W - 14} ${ROPE_Y1 + 46})">…y ${extra} más 🎉</text>`);
  }
  svg.innerHTML = parts.join('');
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
    ? `<span class="claimed-stamp ${mine ? 'mine' : ''}">${mine ? '¡tuyo! ✨' : '¡elegido!'}</span>`
    : '';
  const rot = seededRot(g.id).toFixed(2);
  const tape = TAPE_COLOR[g.category] || TAPE_COLOR['Otros'];
  const counter = g.unlimited && g.claims_count > 0
    ? `<p class="unlimited-count">ya se han apuntado ${g.claims_count} 💛</p>`
    : '';
  const button = g.claimed
    ? ''
    : `<button class="btn-claim" data-claim="${g.id}">✂️ &nbsp;${g.unlimited ? 'yo también me apunto' : 'lo regalo yo'}</button>`;
  return `
    <article class="card ${g.claimed ? 'claimed' : ''} ${g.unlimited ? 'unlimited' : ''}" data-id="${g.id}" style="--r:${rot}deg; --tape:${tape}">
      ${g.unlimited ? '<span class="unlimited-badge">∞ para todos</span>' : stamp}
      ${g.image_url ? `<img class="gift-img" src="${escapeHtml(g.image_url)}" alt="" loading="lazy">` : ''}
      <h3>${escapeHtml(g.name)}</h3>
      ${g.description ? `<p class="desc">${escapeHtml(g.description)}</p>` : ''}
      <div class="meta">
        ${g.price_hint ? `<span class="price-tag">≈ ${escapeHtml(g.price_hint)}</span>` : ''}
        ${g.url ? `<a class="idea-link" href="${escapeHtml(g.url)}" target="_blank" rel="noopener">ver idea ↗</a>` : ''}
      </div>
      ${counter}
      ${button}
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
        <div class="grid">${masonryHtml(items)}</div>
      </section>`;
  }).join('');
}

// masonry manual: reparte las cards en columnas equilibrando la altura estimada
// (CSS `columns` tiene bugs de pintado en Chrome con cards rotadas/animadas)
function masonryHtml(items) {
  const width = listEl.clientWidth || 900;
  const nCols = Math.max(1, Math.min(4, Math.floor(width / 280)));
  const cols = Array.from({ length: nCols }, () => ({ h: 0, html: [] }));
  for (const g of items) {
    const est = 150
      + (g.description ? g.description.length * 0.55 : 0)
      + (g.image_url ? 160 : 0)
      + (g.unlimited ? 40 : 0);
    const target = cols.reduce((a, b) => (b.h < a.h ? b : a));
    target.h += est;
    target.html.push(cardHtml(g));
  }
  return cols.map((c) => `<div class="col">${c.html.join('')}</div>`).join('');
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 180);
});

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
  $('#modal-note').textContent = selectedGift.unlimited
    ? 'Este regalo es para todos: cada aportación suma y nunca se agota. Tu nombre es opcional y solo lo veremos nosotros.'
    : 'Al reservarlo, desaparecerá como disponible para el resto de invitados. Tu nombre es opcional y solo lo veremos nosotros.';
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
  if (selectedGift.unlimited) {
    selectedGift.claims_count += 1;
  } else {
    selectedGift.claimed = true;
  }
  $('#success-title').textContent = selectedGift.unlimited ? '¡Apuntado!' : '¡Reservado!';
  $('#success-text').innerHTML = selectedGift.unlimited
    ? 'Mil gracias, nos hace muchísima ilusión.<br>Cada aportación suma un montón 💛'
    : 'Mil gracias, nos hace muchísima ilusión.<br>Ya está marcado para que nadie lo repita.';
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
