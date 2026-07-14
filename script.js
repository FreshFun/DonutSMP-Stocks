/* =========================================================
   Glaze Index — DonutSMP market terminal
   Auction + Investment data is SIMULATED (seeded, deterministic).
   Player Stats calls the real DonutSMP API (api.donutsmp.net).
   ========================================================= */

/* ---------- seeded RNG so charts are stable across reloads ---------- */
function hashSeed(str){
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++){
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/* ---------- item catalogue ---------- */
const ITEMS = [
  { id:'totem',    name:'Totem of Undying',              cat:'Combat',    base:38000,  color:'#e8a33d', glyph:'✦' },
  { id:'netherite',name:'Netherite Ingot',                cat:'Material',  base:9500,   color:'#7a5c47', glyph:'▲' },
  { id:'elytra',   name:'Elytra',                         cat:'Traversal', base:64000,  color:'#5b7fd6', glyph:'✈' },
  { id:'shulker',  name:'Shulker Box',                    cat:'Storage',   base:15500,  color:'#a566c9', glyph:'▧' },
  { id:'gapple',   name:'Enchanted Golden Apple',         cat:'Consumable',base:47000,  color:'#f2c94c', glyph:'●' },
  { id:'mending',  name:'Mending Book',                   cat:'Enchant',   base:21000,  color:'#4caf7d', glyph:'❧' },
  { id:'trident',  name:'Trident',                        cat:'Combat',    base:29500,  color:'#4fb3c9', glyph:'↑' },
  { id:'template', name:'Netherite Upgrade Template',     cat:'Material',  base:12500,  color:'#c96a4f', glyph:'◆' },
  { id:'beacon',   name:'Beacon',                         cat:'Building',  base:8600,   color:'#65c8e8', glyph:'◈' },
  { id:'diamond',  name:'Diamond Block',                  cat:'Material',  base:3200,   color:'#5ad1c9', glyph:'■' },
];

/* ---------- price history generation ---------- */
// Generates DAILY closes for the past `days` days, seeded per item.
function genDaily(item, days){
  const rand = hashSeed(item.id + '-daily');
  let price = item.base * (0.55 + rand() * 0.35); // where the 1yr series starts
  const out = [];
  const drift = (rand() - 0.45) * 0.0016; // slight per-item long-run trend
  for (let i = 0; i < days; i++){
    const shock = (rand() - 0.5) * 0.05;
    price = Math.max(item.base * 0.15, price * (1 + drift + shock));
    out.push(Math.round(price));
  }
  return out;
}
// Generates hourly points for "today", anchored near the last daily close.
function genHourly(item, anchor){
  const rand = hashSeed(item.id + '-hourly-' + new Date().toISOString().slice(0,10));
  let price = anchor * (0.985 + rand() * 0.03);
  const out = [];
  for (let i = 0; i < 24; i++){
    price = Math.max(item.base * 0.1, price * (1 + (rand() - 0.5) * 0.018));
    out.push(Math.round(price));
  }
  return out;
}

const HISTORY = {}; // id -> { daily365: [...] }
ITEMS.forEach(it => { HISTORY[it.id] = { daily365: genDaily(it, 365) }; });

function seriesFor(item, range){
  const d = HISTORY[item.id].daily365;
  if (range === '1Y') return { labels: labelsBackFrom(365, 'd'), values: d };
  if (range === '1M') return { labels: labelsBackFrom(30, 'd'), values: d.slice(-30) };
  if (range === '1W') return { labels: labelsBackFrom(7, 'd'), values: d.slice(-7) };
  // 1D -> hourly, anchored on the latest daily close
  const hourly = genHourly(item, d[d.length - 1]);
  return { labels: labelsBackFrom(24, 'h'), values: hourly };
}
function labelsBackFrom(n, unit){
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--){
    const t = new Date(now);
    if (unit === 'd') t.setDate(t.getDate() - i); else t.setHours(t.getHours() - i);
    out.push(unit === 'd'
      ? t.toLocaleDateString(undefined, { month:'short', day:'numeric' })
      : t.toLocaleTimeString(undefined, { hour:'numeric' }));
  }
  return out;
}

function currentPrice(item){ return HISTORY[item.id].daily365[364]; }
function pctChange(item, daysBack){
  const d = HISTORY[item.id].daily365;
  const now = d[364];
  const then = d[Math.max(0, 364 - daysBack)];
  return ((now - then) / then) * 100;
}
function fmtMoney(n){
  if (n >= 1000000) return '$' + (n/1000000).toFixed(2) + 'M';
  if (n >= 1000) return '$' + (n/1000).toFixed(1) + 'k';
  return '$' + Math.round(n);
}
function fmtPct(p){ return (p >= 0 ? '+' : '') + p.toFixed(1) + '%'; }

/* ---------- ticker ---------- */
function buildTicker(){
  const track = document.getElementById('tickerTrack');
  const chunk = ITEMS.map(it => {
    const chg = pctChange(it, 1);
    const cls = chg >= 0 ? 'tk-up' : 'tk-down';
    const arrow = chg >= 0 ? '▲' : '▼';
    return `<span class="ticker-item"><span class="tk-name">${it.name}</span>
      <span class="mono">${fmtMoney(currentPrice(it))}</span>
      <span class="${cls}">${arrow} ${fmtPct(chg)}</span></span>`;
  }).join('');
  track.innerHTML = chunk + chunk; // duplicated for seamless loop
}

/* ---------- sparkline (inline SVG) ---------- */
function sparklineSVG(values, color){
  const w = 200, h = 36;
  const min = Math.min(...values), max = Math.max(...values);
  const range = (max - min) || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/* ---------- auction grid ---------- */
function buildGrid(){
  const grid = document.getElementById('itemGrid');
  grid.innerHTML = ITEMS.map(it => {
    const price = currentPrice(it);
    const chg = pctChange(it, 1);
    const cls = chg >= 0 ? 'up' : 'down';
    const spark = HISTORY[it.id].daily365.slice(-30);
    return `<button class="item-card" data-id="${it.id}">
      <div class="item-top">
        <div class="item-icon" style="background:${it.color}22; color:${it.color}">${it.glyph}</div>
        <div>
          <div class="item-name">${it.name}</div>
          <div class="item-cat">${it.cat}</div>
        </div>
      </div>
      ${sparklineSVG(spark, chg >= 0 ? '#4caf7d' : '#e15554')}
      <div class="item-price-row">
        <span class="item-price">${fmtMoney(price)}</span>
        <span class="pill ${cls}">${fmtPct(chg)}</span>
      </div>
    </button>`;
  }).join('');
  grid.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => openDetail(card.dataset.id));
  });
}

/* ---------- detail view + chart ---------- */
let chartInstance = null;
let activeItemId = null;
let activeRange = '1D';

function openDetail(id){
  activeItemId = id;
  activeRange = '1D';
  document.getElementById('itemGrid').parentElement.querySelector('.grid').style.display = 'none';
  document.getElementById('itemDetail').hidden = false;
  document.querySelectorAll('.range-btn').forEach(b => b.classList.toggle('active', b.dataset.range === '1D'));
  renderDetail();
}
document.getElementById('closeDetail').addEventListener('click', () => {
  document.getElementById('itemDetail').hidden = true;
  document.querySelector('#auction .grid').style.display = 'grid';
});
document.querySelectorAll('.range-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeRange = btn.dataset.range;
    document.querySelectorAll('.range-btn').forEach(b => b.classList.toggle('active', b === btn));
    renderDetail();
  });
});

function renderDetail(){
  const item = ITEMS.find(i => i.id === activeItemId);
  const price = currentPrice(item);
  const chg = pctChange(item, 1);

  document.getElementById('detailIcon').textContent = item.glyph;
  document.getElementById('detailIcon').style.background = item.color + '22';
  document.getElementById('detailIcon').style.color = item.color;
  document.getElementById('detailName').textContent = item.name;
  document.getElementById('detailPrice').textContent = fmtMoney(price);
  const changeEl = document.getElementById('detailChange');
  changeEl.textContent = fmtPct(chg) + ' today';
  changeEl.className = 'pill ' + (chg >= 0 ? 'up' : 'down');

  const { labels, values } = seriesFor(item, activeRange);
  const rising = values[values.length - 1] >= values[0];
  const lineColor = rising ? '#4caf7d' : '#e15554';

  const ctx = document.getElementById('priceChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: lineColor,
        backgroundColor: lineColor + '1a',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: (c) => fmtMoney(c.parsed.y) }
      }},
      scales: {
        x: { ticks: { color: '#8992a3', maxTicksLimit: 8 }, grid: { color: '#2a3140' } },
        y: { ticks: { color: '#8992a3', callback: v => fmtMoney(v) }, grid: { color: '#2a3140' } },
      }
    }
  });

  const vol = volatility(item);
  const mom7 = pctChange(item, 7);
  const mom30 = pctChange(item, 30);
  document.getElementById('detailStats').innerHTML = `
    ${statBox('7d momentum', fmtPct(mom7))}
    ${statBox('30d momentum', fmtPct(mom30))}
    ${statBox('Volatility (30d)', vol.toFixed(1) + '%')}
    ${statBox('52w high', fmtMoney(Math.max(...HISTORY[item.id].daily365)))}
    ${statBox('52w low', fmtMoney(Math.min(...HISTORY[item.id].daily365)))}
  `;
}
function statBox(label, value){
  return `<div class="stat-box"><div class="label">${label}</div><div class="value">${value}</div></div>`;
}

/* ---------- volatility + investment scoring ---------- */
function volatility(item){
  const d = HISTORY[item.id].daily365.slice(-30);
  const returns = [];
  for (let i = 1; i < d.length; i++) returns.push((d[i] - d[i-1]) / d[i-1]);
  const mean = returns.reduce((a,b) => a+b, 0) / returns.length;
  const variance = returns.reduce((a,b) => a + (b-mean)**2, 0) / returns.length;
  return Math.sqrt(variance) * 100;
}
function verdictFor(item){
  const mom7 = pctChange(item, 7);
  const mom30 = pctChange(item, 30);
  const vol = volatility(item);

  let verdict, reason;
  if (mom7 > 4 && mom30 > 2){
    verdict = 'BUY';
    reason = `Up ${fmtPct(mom7)} over the last week with 30-day momentum also positive (${fmtPct(mom30)}). Volatility sits at ${vol.toFixed(1)}%, so the climb looks like genuine demand rather than a single spike — a reasonable window to buy in before it runs further.`;
  } else if (mom7 < -4 && mom30 < -2){
    verdict = 'SELL';
    reason = `Down ${fmtPct(mom7)} this week and still negative over 30 days (${fmtPct(mom30)}). With volatility at ${vol.toFixed(1)}%, this reads as a sustained slide rather than noise — better to offload now or wait it out than buy in.`;
  } else if (vol > 3.2){
    verdict = 'HOLD';
    reason = `Volatility is high (${vol.toFixed(1)}%) with no clear direction — 7-day momentum is ${fmtPct(mom7)} against a 30-day trend of ${fmtPct(mom30)}. Swingy enough that timing is mostly luck right now; wait for a clearer trend.`;
  } else {
    verdict = 'HOLD';
    reason = `Fairly flat: ${fmtPct(mom7)} over 7 days and ${fmtPct(mom30)} over 30, with volatility around ${vol.toFixed(1)}%. Nothing wrong with holding what you have, but there's no strong signal to add more right now.`;
  }
  return { verdict, reason, mom7, mom30, vol };
}

function buildInvestList(){
  const wrap = document.getElementById('investList');
  wrap.innerHTML = ITEMS.map(item => {
    const { verdict, reason, mom7, mom30, vol } = verdictFor(item);
    const vClass = verdict.toLowerCase();
    return `<div class="invest-row" data-id="${item.id}">
      <div class="invest-item">
        <div class="item-icon" style="background:${item.color}22; color:${item.color}">${item.glyph}</div>
        <div class="invest-meta">
          <div class="name">${item.name}</div>
          <div class="cat">${item.cat} · ${fmtMoney(currentPrice(item))}</div>
        </div>
      </div>
      <div class="invest-col"><span class="label">7d</span>${fmtPct(mom7)}</div>
      <div class="invest-col"><span class="label">30d</span>${fmtPct(mom30)}</div>
      <div class="invest-col"><span class="label">Volatility</span>${vol.toFixed(1)}%</div>
      <div class="verdict ${vClass}">${verdict}</div>
      <div class="invest-reason">${reason}</div>
    </div>`;
  }).join('');
  wrap.querySelectorAll('.invest-row').forEach(row => {
    row.addEventListener('click', () => row.classList.toggle('expanded'));
  });
}

/* ---------- tabs ---------- */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* =========================================================
   PLAYER STATS — live DonutSMP API
   Docs: https://donutapi.numenmc.me/  (base https://api.donutsmp.net/v1)
   Get a key in-game with /api on DonutSMP. Sent as Authorization: Bearer <key>.
   ========================================================= */
const API_BASE = 'https://api.donutsmp.net/v1';
const KEY_STORAGE = 'glazeindex_donutsmp_key';

const keyToggle = document.getElementById('keyToggle');
const keyBox = document.getElementById('keyBox');
const apiKeyInput = document.getElementById('apiKeyInput');
const keyStatus = document.getElementById('keyStatus');

const savedKey = localStorage.getItem(KEY_STORAGE);
if (savedKey){ apiKeyInput.value = savedKey; keyStatus.textContent = 'Key saved in this browser'; }

keyToggle.addEventListener('click', () => {
  keyBox.hidden = !keyBox.hidden;
  keyToggle.textContent = keyBox.hidden ? '+ Set my DonutSMP API key' : '– Hide API key field';
});
document.getElementById('saveKeyBtn').addEventListener('click', () => {
  const v = apiKeyInput.value.trim();
  if (v){ localStorage.setItem(KEY_STORAGE, v); keyStatus.textContent = 'Key saved in this browser'; }
  else { localStorage.removeItem(KEY_STORAGE); keyStatus.textContent = 'Key cleared'; }
});

const lookupForm = document.getElementById('lookupForm');
const lookupBtn = document.getElementById('lookupBtn');
const playerMsg = document.getElementById('playerMsg');
const playerCard = document.getElementById('playerCard');

function showMsg(text, info){
  playerMsg.hidden = false;
  playerMsg.textContent = text;
  playerMsg.className = 'player-msg' + (info ? ' info' : '');
}
function hideMsg(){ playerMsg.hidden = true; }

lookupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('usernameInput').value.trim();
  if (!username) return;
  const key = localStorage.getItem(KEY_STORAGE);

  playerCard.hidden = true;
  hideMsg();

  if (!key){
    showMsg('Add your DonutSMP API key above to pull live stats — get one in-game by typing /api on the server.', true);
    return;
  }

  lookupBtn.disabled = true;
  lookupBtn.textContent = 'Loading…';
  try {
    const res = await fetch(`${API_BASE}/stats/${encodeURIComponent(username)}`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    if (!res.ok){
      if (res.status === 401) throw new Error('That API key was rejected. Double-check it with /api in-game.');
      if (res.status === 404) throw new Error(`No DonutSMP player found for "${username}".`);
      throw new Error(`API returned an error (status ${res.status}).`);
    }
    const data = await res.json();
    renderPlayer(username, data);
  } catch (err){
    // Browsers commonly block this cross-origin call (CORS) unless it's
    // proxied through a backend — flag that possibility alongside the raw error.
    showMsg(`Couldn't load stats: ${err.message} If this keeps happening, the DonutSMP API may be blocking direct browser requests (CORS) — this call would need to go through a small server-side proxy instead.`);
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.textContent = 'Look up';
  }
});

function renderPlayer(username, data){
  const stats = data.result || data.stats || data;
  document.getElementById('playerAvatar').textContent = username.slice(0,2).toUpperCase();
  document.getElementById('playerName').textContent = username;
  document.getElementById('playerSub').textContent = 'DonutSMP player';

  const fields = [
    ['Balance', pick(stats, ['money','balance','cash'])],
    ['Kills', pick(stats, ['kills','playerKills'])],
    ['Deaths', pick(stats, ['deaths'])],
    ['Mobs killed', pick(stats, ['mobKills','mobsKilled','mobkilled'])],
    ['Playtime', formatPlaytime(pick(stats, ['playtime','playTime']))],
    ['Shards', pick(stats, ['shards'])],
    ['Blocks placed', pick(stats, ['placedBlocks','blocksPlaced'])],
    ['Blocks broken', pick(stats, ['brokenBlocks','blocksBroken'])],
  ].filter(([, v]) => v !== undefined && v !== null);

  document.getElementById('playerStatGrid').innerHTML = fields.length
    ? fields.map(([label, value]) => statBox(label, String(value))).join('')
    : `<div class="stat-box"><div class="label">Raw response</div><div class="value">${escapeHtml(JSON.stringify(stats).slice(0,300))}</div></div>`;

  playerCard.hidden = false;
}
function pick(obj, keys){
  for (const k of keys) if (obj && obj[k] !== undefined) return obj[k];
  return undefined;
}
function formatPlaytime(ms){
  if (ms === undefined) return undefined;
  const n = Number(ms);
  if (Number.isNaN(n)) return ms;
  const hours = Math.round(n / 3600000);
  return hours + ' hr';
}
function escapeHtml(str){
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------- init ---------- */
buildTicker();
buildGrid();
buildInvestList();

