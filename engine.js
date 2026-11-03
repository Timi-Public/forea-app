/* Simulated engine figures shared by Agent Overview, 智能分析 and 引擎监控.
   Market prices, liquidity, volume, spreads and end dates come from the Polymarket snapshot.
   Model estimates, scores, engine metrics, risk blocks and log entries are labelled demos.
   Engine owns every simulated number so Overview and both tabs always agree. */
window.Engine = (() => {
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const rnd = (key, i) => hash(key + ':' + i);
  // Linear interpolation between random anchors: changes smoothly inside each period.
  const walk = (key, period, min, max, t = Date.now()) => { const i = Math.floor(t / period), f = (t % period) / period, a = rnd(key, i), b = rnd(key, i + 1); return min + (a + (b - a) * f) * (max - min); };
  // A new random value once per period.
  const step = (key, period, min, max, t = Date.now()) => Math.round(min + rnd(key, Math.floor(t / period)) * (max - min));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const scale = (n, lo, hi, a, b) => a + clamp((n - lo) / (hi - lo), 0, 1) * (b - a);

  // Leo 11-02 ranges: signals 30–150 over 10 min, latency 45–200 every 5 s,
  // queue 25–100+ every 15 s, 24H risk blocks 10–55 every 10 s, positions 30–100, pending 9–35.
  const monitored = () => D?.summary?.globalEventCount || null;
  const signals = t => Math.round(walk('signals', 600000, 30, 150, t));
  const latency = t => step('latency', 5000, 45, 200, t);
  const queued = t => step('queued', 15000, 25, 108, t);
  const blocked = t => Math.round(walk('blocked', 600000, 10, 55, Math.floor((t ?? Date.now()) / 10000) * 10000));
  const candidates = t => Math.round(walk('candidates', 600000, 260, 480, t));
  const passed = t => { const s = signals(t); return s - Math.round(s * walk('pass', 600000, .1, .22, t)); };
  const pending = t => Math.min(passed(t), step('pending', 480000, 9, 35, t));
  const positions = t => { const n = step('positions', 480000, 30, 100, t), m = monitored(); return m ? Math.min(n, Math.floor(m * .13)) : n; };
  const activeServices = eligible => eligible ? Math.max(1, Math.round(eligible * walk('services', 1800000, .11, .17))) : 0;

  // Model estimate: 2–5 pp away from the market YES price, rounded to 0.1 pp so YES + NO = 100.
  const model = m => {
    const base = Number(m.prices[0]), size = (2 + hash(m.id) * 3) / 100;
    let dir = hash(m.id + ':dir') < .5 ? -1 : 1;
    if (base + dir * size > .99 || base + dir * size < .01) dir = -dir;
    return Math.round(clamp(base + dir * size, .01, .99) * 1000) / 1000;
  };
  const pct = p => ({ yes: (Math.round(p * 1000) / 10).toFixed(1), no: ((1000 - Math.round(p * 1000)) / 10).toFixed(1) });
  const edge = m => Math.round((model(m) - Number(m.prices[0])) * 1000) / 10;
  const spread = m => {
    const book = D.orderBooks.find(b => b.marketId === m.id);
    if (book?.asks?.[0] && book?.bids?.[0]) return book.asks[0].price - book.bids[0].price;
    return Number.isFinite(m.spread) ? m.spread : null;
  };
  const daysLeft = m => Math.max(0, (Date.parse(m.endDate) - Date.now()) / 86400000);
  const factors = m => {
    const e = Math.abs(edge(m)), sp = spread(m), days = daysLeft(m);
    return [
      { key: 'edge', score: scale(e, 2, 5, 62, 100) },
      { key: 'liquidity', score: scale(Math.log10(Math.max(1, m.liquidity)), 4.6, 7, 40, 100) },
      { key: 'volume', score: scale(Math.log10(Math.max(1, m.volume24hr)), 4.6, 6.4, 40, 100) },
      { key: 'spread', score: sp == null ? 60 : scale(sp * 100, 3, .1, 40, 100) },
      { key: 'time', score: days < 1 ? 45 : days < 7 ? 72 : days < 120 ? 100 : 76 }
    ];
  };
  const weights = { edge: .32, liquidity: .22, volume: .18, spread: .14, time: .14 };
  const score = m => { const w = factors(m).reduce((s, f) => s + f.score * weights[f.key], 0); return Math.round(clamp(50 + (w - 40) / 60 * 45, 50, 95)); };
  const risk = m => { const sp = spread(m); return m.liquidity < 300000 || daysLeft(m) < 2 || (sp != null && sp > .02) ? 'mid' : 'low'; };
  const decision = m => score(m) < 72 ? 'watch' : edge(m) > 0 ? 'yes' : 'no';

  // AI Signals: three different events every 5 minutes (Leo 11-02).
  const signalWindow = (t = Date.now()) => Math.floor(t / 300000);
  const signalSet = (t = Date.now()) => {
    const pool = U.featured(), groups = Math.max(1, Math.floor(pool.length / 3)), g = signalWindow(t) % groups;
    return pool.slice(g * 3, g * 3 + 3);
  };
  const signalTime = (t = Date.now()) => signalWindow(t) * 300000;
  // Market Monitor rows: one YES, one NO and one WATCH (Leo 11-02), stable for 8 minutes.
  const mixedSet = (skip = []) => {
    const pool = U.featured().filter(m => !skip.includes(m.id)), out = [];
    for (const want of ['yes', 'no', 'watch']) { const m = pool.find(x => decision(x) === want && !out.some(o => o.m.id === x.id)); if (m) out.push({ m, decision: want }); }
    for (const m of pool) { if (out.length >= 3) break; if (!out.some(o => o.m.id === m.id)) out.push({ m, decision: decision(m) }); }
    return out.slice(0, 3);
  };
  const hhmm = ms => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kuala_Lumpur' });
  const decisionLabel = d => ({ yes: 'YES', no: 'NO', watch: U.t('观望', 'WATCH') })[d];
  const decisionClass = d => ({ yes: 'yes-label', no: 'no-label', watch: 'hold-label' })[d];
  return { hhmm, decisionLabel, decisionClass, hash, rnd, step, walk, monitored, signals, latency, queued, blocked, candidates, passed, pending, positions, activeServices, model, pct, edge, spread, daysLeft, factors, score, risk, decision, signalSet, signalTime, signalWindow, mixedSet };
})();

// Live figures on Agent pages: update text in place; re-render once per 5-minute signal window.
(() => {
  let lastWindow = Engine.signalWindow();
  const setText = (sel, v) => document.querySelectorAll(sel).forEach(el => { if (el.textContent !== String(v)) el.textContent = v; });
  setInterval(() => {
    if (!window.D || !['agent', 'home'].includes(S.route)) return;
    setText('[data-engine="latency"],#latency', Engine.latency());
    setText('[data-engine="queued"],#queued', Engine.queued());
    setText('[data-engine="blocked"],#blocked', Engine.blocked());
    for (const key of ['signals', 'passed', 'pending', 'candidates', 'positions']) setText(`[data-engine="${key}"]`, Engine[key]());
    const nodes = document.querySelectorAll('.engine-node');
    if (nodes.length) { const k = Math.floor(Date.now() / 1800) % nodes.length; nodes.forEach((n, i) => n.classList.toggle('active', i === k)); }
    const w = Engine.signalWindow();
    if (w !== lastWindow) { lastWindow = w; if (((S.route === 'agent' && [0, 1].includes(S.agentTab)) || (S.route === 'home' && S.ovTab === 1)) && !S.overlay && document.activeElement?.tagName !== 'INPUT') render({ preserve: true }); }
  }, 1000);
})();
