/* ==========================================================================
   The Attention Timeline — application
   --------------------------------------------------------------------------
   Everything on the page is rendered from data/mechanisms.json.
   No framework, no build step. If fetch fails we say so loudly rather than
   rendering an empty page that looks fine.
   ========================================================================== */
'use strict';

const APP = {
  data: null,
  activeFamilies: new Set(),
  query: ''
};

/* ---------- tiny helpers ------------------------------------------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const el = (tag, attrs = {}, children = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c === null || c === undefined) return;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return n;
};

/* Allow a tiny, fixed set of inline markup in data strings (<b>, <code>,
   <em>) without opening the door to arbitrary HTML. */
const ALLOWED = /<\/?(b|i|em|code|sub|sup)>/gi;
function richText(s) {
  const escaped = String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/&lt;(\/?)(b|i|em|code|sub|sup)&gt;/gi, '<$1$2>');
}
void ALLOWED;

const fmtBytes = b => {
  if (b < 1024) return b.toFixed(0) + ' B';
  const u = ['KB', 'MB', 'GB', 'TB'];
  let i = -1, n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + ' ' + u[i];
};

const prettyDate = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${M[m - 1]} ${y}`;
};

/* ==========================================================================
   1. TIMELINE
   ========================================================================== */
function famVar(famId) { return `var(--f-${famId})`; }

function buildMechCard(m, fams) {
  const fam = fams[m.family] || { label: m.family };
  const card = el('article', {
    class: 'mech',
    id: 'm-' + m.id,
    'data-family': m.family,
    'data-search': (m.name + ' ' + (m.aka || []).join(' ') + ' ' + m.problem).toLowerCase(),
    style: `--fam:${famVar(m.family)}`
  });

  /* --- header (always visible; this is the static-readable layer) --- */
  const btn = el('button', {
    class: 'mech-btn', type: 'button',
    'aria-expanded': 'false', 'aria-controls': `body-${m.id}`
  }, [
    el('div', { class: 'mech-top' }, [
      el('span', { class: 'mech-date', text: prettyDate(m.date) }),
      el('span', { class: 'mech-name', text: m.name }),
      el('span', { class: 'mech-fam', text: fam.label }),
      el('span', { class: 'mech-caret', text: '\u25BC' })
    ]),
    el('p', { class: 'mech-problem', html: '<b>Problem it answers:</b> ' + richText(m.problem) })
  ]);

  /* --- body --- */
  const body = el('div', { class: 'mech-body', id: `body-${m.id}` });

  body.appendChild(el('div', { class: 'mech-sub', text: 'How it works' }));
  const how = el('div', { class: 'mech-how' });
  (m.how || []).forEach(p => how.appendChild(el('p', { html: richText(p) })));
  body.appendChild(how);
  if (m.math) body.appendChild(el('div', { class: 'mech-math', text: m.math }));

  /* costs strip */
  if (m.costs) {
    body.appendChild(el('div', { class: 'mech-sub', text: 'What it costs' }));
    const strip = el('div', { class: 'costs' });
    for (const [k, v] of Object.entries(m.costs)) {
      strip.appendChild(el('div', { class: 'cost' }, [
        el('div', { class: 'k', text: k }),
        el('div', { class: 'v', text: v })
      ]));
    }
    body.appendChild(strip);
  }

  /* pros / cons — the graded core, so never collapse one side */
  body.appendChild(el('div', { class: 'mech-sub', text: 'The trade' }));
  const trade = el('div', { class: 'tradeoff' }, [
    el('div', { class: 'pros' }, [
      el('ul', {}, (m.pros || []).map(p => el('li', { html: richText(p) })))
    ]),
    el('div', { class: 'cons' }, [
      el('ul', {}, (m.cons || []).map(p => el('li', { html: richText(p) })))
    ])
  ]);
  body.appendChild(trade);

  body.appendChild(el('div', { class: 'mech-sub', text: 'When you would actually pick it' }));
  body.appendChild(el('div', { class: 'pick' }, [
    el('p', { html: '<b>Pick it when:</b> ' + richText(m.pick) })
  ]));
  if (m.avoid) {
    body.appendChild(el('div', { class: 'pick avoid' }, [
      el('p', { html: '<b>Do not pick it when:</b> ' + richText(m.avoid) })
    ]));
  }

  if (m.shipped) {
    body.appendChild(el('p', { class: 'shipped', html: '<b>Shipped in:</b> ' + richText(m.shipped) }));
  }

  /* citation */
  const c = m.citation || {};
  const cite = el('div', { class: 'cite' }, [
    el('div', { class: 'ttl', text: c.title || '' }),
    el('div', { text: c.authors || '' })
  ]);
  const row = el('div', { class: 'row' });
  if (c.id) row.appendChild(el('span', { class: 'tag', text: c.id }));
  row.appendChild(el('span', { class: 'tag', text: (m.dateKind || 'date') + ': ' + m.date }));
  if (c.latest) row.appendChild(el('span', { class: 'tag', text: 'latest ' + c.latest }));
  if (c.venue) row.appendChild(el('span', { class: 'tag', text: c.venue }));
  row.appendChild(el('span', {
    class: 'tag ' + (c.verified ? 'ok' : 'warnt'),
    text: c.verified ? '\u2713 date verified at source' : '\u26A0 unverified'
  }));
  if (c.url) row.appendChild(el('a', { href: c.url, target: '_blank', rel: 'noopener', text: 'source \u2197' }));
  cite.appendChild(row);
  if (c.note) cite.appendChild(el('p', { style: 'margin:8px 0 0', html: richText(c.note) }));
  body.appendChild(cite);

  card.appendChild(btn);
  card.appendChild(body);

  btn.addEventListener('click', () => {
    const open = card.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });

  return card;
}

function renderTimeline() {
  const host = $('#timeline');
  host.textContent = '';
  const { mechanisms, eras, families } = APP.data;

  /* chronological, always — this is the whole point of the page */
  const sorted = [...mechanisms].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));

  eras.forEach(era => {
    const inEra = sorted.filter(m => m.date >= era.from && m.date <= era.to);
    if (!inEra.length) return;

    const wrap = el('div', { class: 'era', 'data-era': era.id, style: `--era:${era.color}` });
    wrap.appendChild(el('div', { class: 'era-head' }, [
      el('span', { class: 'yrs', text: era.years }),
      el('span', { class: 'nm', text: era.name }),
      el('p', { class: 'beat', html: richText(era.beat) })
    ]));
    const bodyEl = el('div', { class: 'era-body' });
    inEra.forEach(m => bodyEl.appendChild(buildMechCard(m, families)));
    wrap.appendChild(bodyEl);
    host.appendChild(wrap);
  });

  applyFilters();
}

function applyFilters() {
  const q = APP.query.trim().toLowerCase();
  let shown = 0;
  $$('#timeline .mech').forEach(card => {
    const famOk = APP.activeFamilies.size === 0 || APP.activeFamilies.has(card.dataset.family);
    const qOk = !q || card.dataset.search.includes(q);
    const vis = famOk && qOk;
    card.classList.toggle('hidden', !vis);
    if (vis) shown++;
  });
  /* hide an era whose cards are all filtered out */
  $$('#timeline .era').forEach(era => {
    const any = $$('.mech:not(.hidden)', era).length > 0;
    era.style.display = any ? '' : 'none';
  });
  const meta = $('#filter-count');
  if (meta) meta.textContent = `${shown} / ${APP.data.mechanisms.length} shown`;
}

function renderFilters() {
  const host = $('#filters');
  const { families, mechanisms } = APP.data;
  host.textContent = '';

  const counts = {};
  mechanisms.forEach(m => { counts[m.family] = (counts[m.family] || 0) + 1; });

  host.appendChild(el('button', {
    class: 'chip', type: 'button', 'aria-pressed': 'true', id: 'chip-all',
    onclick: () => { APP.activeFamilies.clear(); syncChips(); applyFilters(); }
  }, [el('span', { text: 'All' })]));

  Object.entries(families).forEach(([id, f]) => {
    if (!counts[id]) return;
    const chip = el('button', {
      class: 'chip', type: 'button', 'data-fam': id, 'aria-pressed': 'false',
      style: `color:${famVar(id)}`,
      onclick: () => {
        APP.activeFamilies.has(id) ? APP.activeFamilies.delete(id) : APP.activeFamilies.add(id);
        syncChips(); applyFilters();
      }
    }, [
      el('span', { class: 'dot' }),
      el('span', { text: `${f.label} (${counts[id]})`, style: 'color:var(--ink-dim)' })
    ]);
    host.appendChild(chip);
  });

  const search = el('input', {
    class: 'searchbox', type: 'search', id: 'mech-search',
    placeholder: 'Search mechanisms\u2026', 'aria-label': 'Search mechanisms'
  });
  search.addEventListener('input', e => { APP.query = e.target.value; applyFilters(); });
  host.appendChild(search);
  host.appendChild(el('span', { class: 'filter-meta', id: 'filter-count' }));
}

function syncChips() {
  const none = APP.activeFamilies.size === 0;
  $('#chip-all').setAttribute('aria-pressed', String(none));
  $$('#filters .chip[data-fam]').forEach(c => {
    const on = APP.activeFamilies.has(c.dataset.fam);
    c.setAttribute('aria-pressed', String(on));
    c.classList.toggle('off', !none && !on);
  });
}

/* ==========================================================================
   2. LAB — attention mask / score heatmap
   --------------------------------------------------------------------------
   We generate a real toy attention: random Q,K -> scaled dot product ->
   apply the mechanism's mask -> softmax. So the picture shows both the
   *shape* of the sparsity and what softmax does with it.
   ========================================================================== */
const MASKS = {
  full: {
    label: 'Full causal (standard attention)',
    note: 'Every token attends to every earlier token. Exact, and quadratic.',
    fn: (i, j) => j <= i
  },
  bidirectional: {
    label: 'Bidirectional (encoder / BERT-style)',
    note: 'No causal mask at all — every token sees the whole sequence.',
    fn: () => true
  },
  sliding: {
    label: 'Sliding window (Longformer / Mistral)',
    note: 'Only the last W tokens are visible. Cost per token becomes constant, ' +
          'but information beyond W must travel layer by layer.',
    fn: (i, j, p) => j <= i && (i - j) < p.window
  },
  dilated: {
    label: 'Strided / dilated (Sparse Transformer)',
    note: 'A local band plus every k-th token, so any two positions connect in ' +
          'two hops instead of one.',
    fn: (i, j, p) => j <= i && ((i - j) < Math.max(2, Math.round(Math.sqrt(p.n))) || j % Math.max(2, Math.round(Math.sqrt(p.n))) === 0)
  },
  global: {
    label: 'Local + global tokens (Longformer / BigBird)',
    note: 'A few designated tokens attend everywhere and are attended by everyone; ' +
          'everything else is local.',
    fn: (i, j, p) => j <= i && ((i - j) < p.window || j < p.nGlobal || i < p.nGlobal)
  },
  sink: {
    label: 'Sliding window + attention sinks (StreamingLLM)',
    note: 'A sliding window, plus the first few tokens are never evicted. Those ' +
          'sink tokens absorb probability mass that softmax must place somewhere.',
    fn: (i, j, p) => j <= i && ((i - j) < p.window || j < p.nSink)
  },
  block: {
    label: 'Block-sparse (MoBA / block selection)',
    note: 'The sequence is cut into blocks; each query attends to its own block ' +
          'plus a handful of selected blocks.',
    fn: (i, j, p) => {
      if (j > i) return false;
      const B = Math.max(2, Math.round(p.n / 8));
      const bi = Math.floor(i / B), bj = Math.floor(j / B);
      return bj === bi || bj === 0 || (bi - bj) % 2 === 1;
    }
  },
  random: {
    label: 'Local + global + random (BigBird)',
    note: 'Adds random long-range edges so the attention graph stays a fast mixer ' +
          'while each row is sparse.',
    fn: (i, j, p) => {
      if (j > i) return false;
      if ((i - j) < 2 || j < p.nGlobal) return true;
      /* deterministic pseudo-random so the picture is stable across redraws */
      return ((i * 2654435761 ^ j * 40503) % 97) < 8;
    }
  },
  topk: {
    label: 'Top-k selection (score-dependent)',
    note: 'The mask is not fixed. Scores are computed, then only the k highest ' +
          'per query survive — so the pattern is different for every input.',
    fn: (i, j) => j <= i,
    topk: true
  },
  nsa: {
    label: 'Compressed + selected + window (DeepSeek NSA)',
    note: 'Three branches in parallel: coarse compressed blocks for the whole past, ' +
          'a few finely selected blocks, and a local window. Gated and summed.',
    fn: (i, j, p) => {
      if (j > i) return false;
      const B = Math.max(2, Math.round(p.n / 12));
      if ((i - j) < p.window / 2) return true;              // local window branch
      if (j % B === 0) return true;                          // compressed block reps
      const bi = Math.floor(i / B), bj = Math.floor(j / B);  // selected blocks
      return (bi - bj) === 1 || bj === 0;
    }
  },
  linear: {
    label: 'Linear / recurrent state (no matrix at all)',
    note: 'There is no n\u00D7n matrix to draw. The past is compressed into a ' +
          'fixed-size state, so influence decays smoothly with distance instead ' +
          'of being selected. Shown here as the effective influence profile.',
    fn: (i, j) => j <= i,
    decay: true
  }
};

const heat = {
  canvas: null, ctx: null,
  params: { n: 48, window: 10, nSink: 4, nGlobal: 3, k: 8, mode: 'full', decay: 0.94 },
  Q: null, K: null
};

function seededRandn(seed) {
  /* mulberry32 + Box-Muller: stable across reloads so screenshots reproduce */
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    const u = ((t ^ t >>> 14) >>> 0) / 4294967296;
    a = a + 0x9E3779B9 | 0;
    let t2 = Math.imul(a ^ a >>> 15, 1 | a);
    t2 = t2 + Math.imul(t2 ^ t2 >>> 7, 61 | t2) ^ t2;
    const v = ((t2 ^ t2 >>> 14) >>> 0) / 4294967296;
    return Math.sqrt(-2 * Math.log(u + 1e-12)) * Math.cos(2 * Math.PI * v);
  };
}

function makeQK(n, d = 16) {
  const rnd = seededRandn(20260822);
  const mk = () => Array.from({ length: n }, () => Array.from({ length: d }, () => rnd()));
  return [mk(), mk()];
}

function computeAttention() {
  const p = heat.params, n = p.n, d = 16;
  if (!heat.Q || heat.Q.length !== n) [heat.Q, heat.K] = makeQK(n, d);
  const spec = MASKS[p.mode];
  const scale = 1 / Math.sqrt(d);
  const A = [];

  for (let i = 0; i < n; i++) {
    const raw = new Array(n).fill(-Infinity);
    for (let j = 0; j < n; j++) {
      if (!spec.fn(i, j, p)) continue;
      let dot = 0;
      for (let t = 0; t < d; t++) dot += heat.Q[i][t] * heat.K[j][t];
      raw[j] = dot * scale;
    }

    /* top-k prunes AFTER scoring — that is exactly what makes it input-dependent */
    if (spec.topk) {
      const idx = raw.map((v, j) => [v, j]).filter(x => isFinite(x[0]))
                     .sort((a, b) => b[0] - a[0]).slice(0, p.k).map(x => x[1]);
      const keep = new Set(idx);
      for (let j = 0; j < n; j++) if (!keep.has(j)) raw[j] = -Infinity;
    }

    /* linear attention has no selection: influence just decays */
    if (spec.decay) {
      for (let j = 0; j <= i; j++) raw[j] = Math.log(Math.pow(p.decay, i - j) + 1e-9);
    }

    let mx = -Infinity;
    for (let j = 0; j < n; j++) if (raw[j] > mx) mx = raw[j];
    let sum = 0;
    const row = new Array(n).fill(0);
    if (isFinite(mx)) {
      for (let j = 0; j < n; j++) if (isFinite(raw[j])) { row[j] = Math.exp(raw[j] - mx); sum += row[j]; }
      for (let j = 0; j < n; j++) row[j] /= (sum || 1);
    }
    A.push(row);
  }
  return A;
}

function drawHeatmap() {
  const c = heat.canvas, ctx = heat.ctx;
  if (!c) return;
  const n = heat.params.n;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = Math.min(c.parentElement.clientWidth - 32, 560);
  c.style.width = size + 'px'; c.style.height = size + 'px';
  c.width = Math.round(size * dpr); c.height = Math.round(size * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const A = computeAttention();
  const cell = size / n;

  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, size, size);

  /* normalise per-row against that row's max so sparse rows stay legible */
  for (let i = 0; i < n; i++) {
    const mx = Math.max(...A[i], 1e-9);
    for (let j = 0; j < n; j++) {
      const v = A[i][j];
      if (v <= 1e-6) {
        /* draw the "structurally masked" region faintly so the shape reads */
        if (j <= i) { ctx.fillStyle = '#161b27'; ctx.fillRect(j * cell, i * cell, cell + .5, cell + .5); }
        continue;
      }
      const t = Math.pow(v / mx, 0.55);
      const r = Math.round(11 + t * (125 - 11));
      const g = Math.round(14 + t * (211 - 14));
      const b = Math.round(20 + t * (252 - 20));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(j * cell, i * cell, cell + .5, cell + .5);
    }
  }

  /* axes hints */
  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(.5, .5, size - 1, size - 1);

  /* stats */
  let kept = 0, total = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) { total++; if (A[i][j] > 1e-6) kept++; }
  const pct = total ? (100 * kept / total) : 0;
  const spec = MASKS[heat.params.mode];
  $('#heat-note').innerHTML =
    richText(spec.note) +
    `<br><br><b>Density:</b> ${kept.toLocaleString()} of ${total.toLocaleString()} causal pairs are actually computed ` +
    `\u2014 <b>${pct.toFixed(1)}%</b> of the full lower triangle.` +
    (spec.decay ? ' <b>Note:</b> a linear-attention model never builds this matrix; the picture is the implied influence, not a stored object.' : '');
}

function initHeatLab() {
  heat.canvas = $('#heat-canvas');
  if (!heat.canvas) return;
  heat.ctx = heat.canvas.getContext('2d');

  const sel = $('#heat-mode');
  Object.entries(MASKS).forEach(([k, v]) => sel.appendChild(el('option', { value: k, text: v.label })));
  sel.value = 'full';

  const bind = (id, key, out, transform = v => v) => {
    const node = $(id);
    if (!node) return;
    const upd = () => {
      heat.params[key] = transform(Number(node.value));
      if (out) $(out).textContent = heat.params[key];
      drawHeatmap();
    };
    node.addEventListener('input', upd);
    upd();
  };

  sel.addEventListener('change', () => { heat.params.mode = sel.value; drawHeatmap(); });
  bind('#heat-n', 'n', '#heat-n-val');
  bind('#heat-w', 'window', '#heat-w-val');
  bind('#heat-k', 'k', '#heat-k-val');
  bind('#heat-sink', 'nSink', '#heat-sink-val');

  window.addEventListener('resize', () => drawHeatmap());
  drawHeatmap();
}

/* ==========================================================================
   3. LAB — KV cache calculator
   ========================================================================== */
const KV_PRESETS = {
  'llama3-8b':   { label: 'Llama 3 8B',        L: 32, H: 32, dh: 128, G: 8,  window: 0 },
  'llama2-7b':   { label: 'Llama 2 7B (MHA)',  L: 32, H: 32, dh: 128, G: 32, window: 0 },
  'llama3-70b':  { label: 'Llama 3 70B',       L: 80, H: 64, dh: 128, G: 8,  window: 0 },
  'mistral-7b':  { label: 'Mistral 7B (SWA)',  L: 32, H: 32, dh: 128, G: 8,  window: 4096 },
  'gpt3-175b':   { label: 'GPT-3 175B (MHA)',  L: 96, H: 96, dh: 128, G: 96, window: 0 },
  'deepseek-v2': { label: 'DeepSeek-V2 (MLA)', L: 60, H: 128, dh: 128, G: 128, window: 0, dc: 512, drope: 64 }
};

function renderKV() {
  const p = KV_PRESETS[$('#kv-model').value];
  const seq = Number($('#kv-seq').value);
  const batch = Number($('#kv-batch').value);
  const bytes = Number($('#kv-dtype').value);

  $('#kv-seq-val').textContent = seq.toLocaleString();
  $('#kv-batch-val').textContent = batch;

  const perTok = kvh => 2 * p.L * kvh * p.dh * bytes;          // K and V
  const mlaPerTok = () => p.L * ((p.dc || 512) + (p.drope || 64)) * bytes;

  const rows = [
    { k: 'Multi-head (MHA)',    heads: p.H, per: perTok(p.H),  note: `${p.H} KV heads \u2014 one per query head`, fam: 'kv' },
    { k: 'Grouped-query (GQA)', heads: p.G, per: perTok(p.G),  note: `${p.G} KV heads shared across ${p.H} query heads`, fam: 'kv' },
    { k: 'Multi-query (MQA)',   heads: 1,   per: perTok(1),    note: '1 KV head for the whole layer', fam: 'kv' },
    { k: 'Latent (MLA)',        heads: '\u2014', per: mlaPerTok(),
      note: `compressed to ${(p.dc || 512)} dims + ${(p.drope || 64)} decoupled RoPE dims per layer`, fam: 'kv' }
  ];

  const effSeq = p.window ? Math.min(seq, p.window) : seq;
  rows.forEach(r => { r.total = r.per * effSeq * batch; });

  if (p.window) {
    rows.push({
      k: `+ sliding window (${p.window.toLocaleString()})`, heads: p.G,
      per: perTok(p.G), total: perTok(p.G) * Math.min(seq, p.window) * batch,
      note: `cache stops growing past ${p.window.toLocaleString()} tokens`, fam: 'sparse'
    });
  }

  const mx = Math.max(...rows.map(r => r.total));
  const base = rows[0].total;
  const tb = $('#kv-body');
  tb.textContent = '';
  rows.forEach(r => {
    const ratio = base / r.total;
    tb.appendChild(el('tr', { class: r.total === Math.min(...rows.map(x => x.total)) ? 'hi' : '' }, [
      el('td', {}, [el('b', { text: r.k }), el('div', { style: 'font-size:.8rem;color:var(--ink-faint)', text: r.note })]),
      el('td', { class: 'num', text: fmtBytes(r.per) }),
      el('td', { class: 'num', text: fmtBytes(r.total) }),
      el('td', { class: 'num', text: ratio >= 1.02 ? ratio.toFixed(1) + '\u00D7 smaller' : '\u2014' }),
      el('td', { class: 'barcell' }, [
        el('div', { class: 'bar', style: `width:${Math.max(1, 100 * r.total / mx)}%;background:${famVar(r.fam)}` })
      ])
    ]));
  });

  const q = 2 * seq * seq * p.L * p.H;   // rough score-matrix element count
  $('#kv-note').innerHTML =
    `At <b>${seq.toLocaleString()}</b> tokens \u00D7 batch <b>${batch}</b>, plain multi-head attention needs ` +
    `<b>${fmtBytes(rows[0].total)}</b> of KV cache. That is the bill every mechanism below is trying to reduce. ` +
    `Note the cache is read <i>in full for every generated token</i>, so this number is a bandwidth cost per step, ` +
    `not just a storage cost. The score matrix itself would be ~${(q / 1e9).toFixed(1)}B elements if materialised, ` +
    `which is why FlashAttention never materialises it.` +
    (p.window ? ` <b>${p.label}</b> also caps the window at ${p.window.toLocaleString()}, so its cache flattens instead of growing.` : '');
}

function initKVLab() {
  const sel = $('#kv-model');
  if (!sel) return;
  Object.entries(KV_PRESETS).forEach(([k, v]) => sel.appendChild(el('option', { value: k, text: v.label })));
  sel.value = 'llama3-70b';
  ['#kv-model', '#kv-seq', '#kv-batch', '#kv-dtype'].forEach(id =>
    $(id).addEventListener('input', renderKV));
  renderKV();
}

/* ==========================================================================
   4. LAB — positional encoding plots
   ========================================================================== */
const posLab = { canvas: null, ctx: null };

function drawPos() {
  const c = posLab.canvas, ctx = posLab.ctx;
  if (!c) return;
  const mode = $('#pos-mode').value;
  const factor = Number($('#pos-factor').value);
  $('#pos-factor-val').textContent = factor + '\u00D7';

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.min(c.parentElement.clientWidth - 32, 700), H = 340;
  c.style.width = W + 'px'; c.style.height = H + 'px';
  c.width = W * dpr; c.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b0e14'; ctx.fillRect(0, 0, W, H);

  const pad = { l: 52, r: 16, t: 18, b: 34 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

  const axes = (xlab, ylab, x0, x1, y0, y1) => {
    ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const y = pad.t + ph * g / 4;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pw, y); ctx.stroke();
      ctx.fillStyle = '#6d7688'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'right';
      ctx.fillText((y1 - (y1 - y0) * g / 4).toFixed(2), pad.l - 8, y + 4);
    }
    ctx.fillStyle = '#6d7688'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText(String(x0), pad.l, H - 10);
    ctx.fillText(String(x1), pad.l + pw, H - 10);
    ctx.fillText(xlab, pad.l + pw / 2, H - 10);
    ctx.save(); ctx.translate(13, pad.t + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillText(ylab, 0, 0); ctx.restore();
  };

  const line = (pts, color, width = 2, dash = null) => {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke(); ctx.setLineDash([]);
  };

  const N = 512;
  const legend = [];

  if (mode === 'sinusoidal') {
    axes('token position \u2192', 'PE value', 0, N, -1, 1);
    const dims = [0, 2, 8, 24, 64];
    const cols = ['#7dd3fc', '#c4b5fd', '#6ee7b7', '#fcd34d', '#fb923c'];
    dims.forEach((i, idx) => {
      const wl = Math.pow(10000, i / 128);
      const pts = [];
      for (let p = 0; p < N; p++) {
        const v = Math.sin(p / wl);
        pts.push([pad.l + pw * p / N, pad.t + ph * (1 - (v + 1) / 2)]);
      }
      line(pts, cols[idx], 1.8);
      legend.push([`dim ${i} (wavelength \u2248 ${wl < 10 ? wl.toFixed(1) : Math.round(wl).toLocaleString()})`, cols[idx]]);
    });
    $('#pos-note').innerHTML =
      'Each dimension is a sine of a different wavelength, from ~6 tokens up to ~60,000. ' +
      'Position is a <b>fixed function</b>, not a learned parameter, so nothing prevents you feeding in ' +
      'position 5,000 to a model trained on 512 \u2014 the values are perfectly well defined. ' +
      'That is the promise. The catch is that "well defined" is not the same as "the model has ever seen ' +
      'that combination of phases", which is why sinusoidal extrapolation disappoints in practice.';
  }

  else if (mode === 'rope-decay') {
    axes('relative distance \u2192', 'expected q\u00B7k', 0, N, -0.2, 1);
    const bases = [10000, 10000 * factor, 500000];
    const cols = ['#c4b5fd', '#f0abfc', '#6ee7b7'];
    bases.forEach((base, bi) => {
      const pts = [];
      for (let m = 0; m < N; m++) {
        let s = 0;
        const D = 64;
        for (let i = 0; i < D; i++) s += Math.cos(m / Math.pow(base, 2 * i / (2 * D)));
        const v = s / D;
        pts.push([pad.l + pw * m / N, pad.t + ph * (1 - (v + 0.2) / 1.2)]);
      }
      line(pts, cols[bi], 2, bi === 1 ? [5, 4] : null);
      legend.push([bi === 1 ? `base 10000 \u00D7 ${factor} (NTK-aware)` : `base ${base.toLocaleString()}`, cols[bi]]);
    });
    $('#pos-note').innerHTML =
      'RoPE rotates q and k by an angle proportional to position, so the dot product depends only on the ' +
      '<b>difference</b> of positions. Averaged over dimensions you get this long-term decay: nearby tokens ' +
      'interact strongly, distant ones weakly. <b>Raising the base</b> (the dashed line) stretches every ' +
      'wavelength, which is the whole idea behind NTK-aware scaling \u2014 you buy reach by spending resolution.';
  }

  else if (mode === 'alibi') {
    axes('distance from query \u2192', 'bias added to score', 0, 256, -8, 0);
    const heads = [1, 2, 4, 8];
    const cols = ['#7dd3fc', '#c4b5fd', '#fcd34d', '#fb923c'];
    heads.forEach((h, i) => {
      const m = 1 / Math.pow(2, h);
      const pts = [];
      for (let dst = 0; dst < 256; dst++) {
        const v = Math.max(-8, -m * dst);
        pts.push([pad.l + pw * dst / 256, pad.t + ph * (1 - (v + 8) / 8)]);
      }
      line(pts, cols[i], 2);
      legend.push([`head slope m = 1/2^${h}`, cols[i]]);
    });
    $('#pos-note').innerHTML =
      'ALiBi adds no embedding at all. It subtracts a penalty proportional to distance, with a ' +
      '<b>different slope per head</b> \u2014 steep heads look local, shallow heads look far. Because the ' +
      'penalty is a straight line defined for any distance, the model degrades gracefully rather than ' +
      'falling off a cliff at the training length. The price is a hard-wired recency prior: ' +
      'ALiBi cannot express "the important token is 30k back and nothing since matters".';
  }

  else if (mode === 'extension') {
    axes('position fed to the model \u2192', 'effective position seen', 0, N * factor, 0, N * factor);
    const train = N;
    const mk = (f, col, lab, dash) => {
      const pts = [];
      for (let p = 0; p <= N * factor; p += 8) {
        const v = f(p);
        pts.push([pad.l + pw * p / (N * factor), pad.t + ph * (1 - Math.min(v, N * factor) / (N * factor))]);
      }
      line(pts, col, 2, dash);
      legend.push([lab, col]);
    };
    mk(p => p, '#f87171', 'no scaling \u2014 goes out of distribution past training length', [4, 4]);
    mk(p => p / factor, '#7dd3fc', `linear interpolation (PI) \u00F7 ${factor}`, null);
    mk(p => p / Math.pow(factor, 0.75), '#c4b5fd', 'NTK-aware (base scaling, mostly high dims)', null);
    mk(p => p <= train / 2 ? p : train / 2 + (p - train / 2) / factor, '#6ee7b7', 'YaRN / NTK-by-parts (near intact, far compressed)', null);

    ctx.strokeStyle = 'rgba(248,113,113,.4)'; ctx.setLineDash([3, 3]);
    const ty = pad.t + ph * (1 - train / (N * factor));
    ctx.beginPath(); ctx.moveTo(pad.l, ty); ctx.lineTo(pad.l + pw, ty); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#f87171'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText('training length', pad.l + 6, ty - 6);

    $('#pos-note').innerHTML =
      'The context-extension family is one argument: <b>how do you map a position the model has never seen ' +
      'onto one it has?</b> Linear interpolation squashes everything uniformly and blurs local detail. ' +
      'NTK-aware scaling stretches the base instead, so high-frequency dimensions keep their resolution. ' +
      'YaRN goes further and treats dimensions differently by wavelength \u2014 leave the ones that already ' +
      'fit alone, interpolate only the ones that do not. Everything above the red line is territory the ' +
      'model was never trained on.';
  }

  /* legend */
  ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'left';
  let ly = pad.t + 6;
  legend.forEach(([lab, col]) => {
    ctx.fillStyle = col; ctx.fillRect(pad.l + pw - 200, ly - 7, 9, 9);
    ctx.fillStyle = '#a8b0c2'; ctx.fillText(lab, pad.l + pw - 186, ly + 1);
    ly += 16;
  });
}

function initPosLab() {
  posLab.canvas = $('#pos-canvas');
  if (!posLab.canvas) return;
  posLab.ctx = posLab.canvas.getContext('2d');
  $('#pos-mode').addEventListener('change', drawPos);
  $('#pos-factor').addEventListener('input', drawPos);
  window.addEventListener('resize', drawPos);
  drawPos();
}

/* ==========================================================================
   5. Comparator
   ========================================================================== */
const CMP_ROWS = [
  ['First appeared', m => prettyDate(m.date) + (m.dateKind ? ` <span style="color:var(--ink-faint)">(${m.dateKind})</span>` : '')],
  ['Family',         (m, f) => (f[m.family] || {}).label || m.family],
  ['Problem it answers', m => m.problem],
  ['Cost profile',   m => m.costs ? Object.entries(m.costs).map(([k, v]) => `<b>${k}:</b> <code>${v}</code>`).join('<br>') : '\u2014'],
  ['What it buys',   m => '<ul>' + (m.pros || []).map(p => `<li>${richText(p)}</li>`).join('') + '</ul>'],
  ['What it gives up', m => '<ul>' + (m.cons || []).map(p => `<li>${richText(p)}</li>`).join('') + '</ul>'],
  ['Pick it when',   m => m.pick],
  ['Avoid it when',  m => m.avoid || '\u2014'],
  ['Shipped in',     m => m.shipped || '\u2014']
];

function renderComparator() {
  const picks = $$('#cmp-picks select').map(s => s.value).filter(Boolean);
  const chosen = picks.map(id => APP.data.mechanisms.find(m => m.id === id)).filter(Boolean);
  const host = $('#cmp-table');
  host.textContent = '';
  if (!chosen.length) return;

  const table = el('table', { class: 'cmp' });
  const thead = el('thead', {}, [
    el('tr', {}, [el('th', { class: 'rowk', text: '' })].concat(
      chosen.map(m => el('th', { style: `color:${famVar(m.family)}`, text: m.name }))))
  ]);
  const tbody = el('tbody');
  CMP_ROWS.forEach(([label, fn]) => {
    tbody.appendChild(el('tr', {}, [el('th', { class: 'rowk', text: label })].concat(
      chosen.map(m => el('td', { html: fn(m, APP.data.families) })))));
  });
  table.appendChild(thead); table.appendChild(tbody);
  host.appendChild(table);

  /* the verdict line is the point of the whole widget */
  const span = chosen.map(m => m.date).sort();
  const yrs = (new Date(span[span.length - 1]) - new Date(span[0])) / 31557600000;
  $('#cmp-verdict').innerHTML =
    `<b>Read it as a trade, not a ranking.</b> These ${chosen.length} are separated by ` +
    `<b>${yrs.toFixed(1)} years</b>. None of them replaced the others outright \u2014 each one moved cost ` +
    `from a place the field could not afford to a place it could, and every row of "what it gives up" is ` +
    `the bill for the corresponding row of "what it buys". If two of these look interchangeable to you, ` +
    `compare their <i>cost profile</i> row at your actual context length, not their headline.`;
}

function initComparator() {
  const host = $('#cmp-picks');
  if (!host) return;
  const sorted = [...APP.data.mechanisms].sort((a, b) => a.date.localeCompare(b.date));
  const defaults = ['sdpa', 'gqa', 'mla'];
  for (let i = 0; i < 3; i++) {
    const sel = el('select', { 'aria-label': `Mechanism ${i + 1}` });
    sorted.forEach(m => sel.appendChild(el('option', { value: m.id, text: `${m.date.slice(0, 7)} \u2014 ${m.name}` })));
    sel.value = defaults[i] && sorted.some(m => m.id === defaults[i]) ? defaults[i] : sorted[i].id;
    sel.addEventListener('change', renderComparator);
    host.appendChild(sel);
  }
  renderComparator();
}

/* ==========================================================================
   6. Sources table
   ========================================================================== */
function renderSources() {
  const tb = $('#src-body');
  if (!tb) return;
  tb.textContent = '';
  [...APP.data.mechanisms].sort((a, b) => a.date.localeCompare(b.date)).forEach(m => {
    const c = m.citation || {};
    tb.appendChild(el('tr', {}, [
      el('td', { class: 'd', text: m.date }),
      el('td', {}, [el('a', { href: '#m-' + m.id, text: m.name })]),
      el('td', { text: c.title || '' }),
      el('td', {}, [c.url ? el('a', { href: c.url, target: '_blank', rel: 'noopener', text: c.id || 'source' })
                          : el('span', { text: c.id || '\u2014' })]),
      el('td', { text: m.dateKind || '' }),
      el('td', { html: c.verified ? '<span style="color:var(--pro)">\u2713</span>' : '<span style="color:var(--warn)">\u26A0</span>' })
    ]));
  });
}

/* ==========================================================================
   boot
   ========================================================================== */
async function boot() {
  try {
    const res = await fetch('data/mechanisms.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    APP.data = await res.json();
  } catch (err) {
    $('#timeline').innerHTML =
      `<div class="panel" style="border-color:var(--con)">
         <h3 style="color:var(--con)">Could not load the mechanism data</h3>
         <p>${String(err)}</p>
         <p>If you opened this file directly from disk, the browser blocked the
            <code>fetch</code> of <code>data/mechanisms.json</code>. Serve the folder over HTTP
            instead \u2014 for example <code>python -m http.server</code> \u2014 or use the deployed link.</p>
       </div>`;
    return;
  }

  document.querySelectorAll('[data-count="mechanisms"]').forEach(n => n.textContent = APP.data.mechanisms.length);
  const yrs = APP.data.mechanisms.map(m => m.date).sort();
  const spanEl = document.querySelector('[data-count="span"]');
  if (spanEl) spanEl.textContent = `${yrs[0].slice(0, 4)}\u2013${yrs[yrs.length - 1].slice(0, 4)}`;
  const verEl = document.querySelector('[data-count="verified"]');
  if (verEl) verEl.textContent = APP.data.mechanisms.filter(m => m.citation && m.citation.verified).length;

  renderFilters();
  renderTimeline();
  renderSources();
  initHeatLab();
  initKVLab();
  initPosLab();
  initComparator();

  /* deep link to a mechanism */
  if (location.hash.startsWith('#m-')) {
    const card = document.querySelector(location.hash);
    if (card) { card.classList.add('is-open'); $('.mech-btn', card).setAttribute('aria-expanded', 'true'); card.scrollIntoView(); }
  }
}

document.addEventListener('DOMContentLoaded', boot);
