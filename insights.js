/* Agent Trading · 智能分析 / 引擎监控 (proposal pending Leo confirmation).
   Market fields come from the Polymarket snapshot; model, engine, risk and log figures are labelled demos. */
window.Insights = (() => {
  const t = (zh, en) => U.t(zh, en);
  const fmt = n => n == null ? '—' : Number(n).toLocaleString('en-US');
  const demo = () => `<span class="demo-tag">${t('演示', 'DEMO')}</span>`;
  const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(1);
  const { decisionLabel, decisionClass, hhmm } = Engine;
  const short = m => U.esc(m.question.replace(/^Will (the )?/i, '').replace(/\?$/, ''));
  const hhmmss = ms => new Date(ms).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kuala_Lumpur' });
  const days = m => { const d = Engine.daysLeft(m); return d < 1 ? t('不足 1 天', '< 1 day') : Math.round(d) + t(' 天', d >= 1.5 ? ' days' : ' day'); };
  const cents = v => v == null ? '—' : (v * 100).toFixed(1) + '¢';
  const sourceLine = () => `<div class="source"><span>${t('数据来源', 'Data source')}</span><a href="#sources">Polymarket · ${U.captureTime()}${icon('external', '', 10)}</a></div>`;

  const cta = () => S.agentState === 'inactive'
    ? `<article class="panel ins-cta" data-card="join"><p>${t('投入 USDC，Agent 按信号替你下单', 'Add USDC and the agent trades on these signals')}</p><button class="btn primary block" data-action="choose-agent">${t('开始智能交易', 'Start agent trading')}${icon('arrow', '', 14)}</button></article>`
    : `<article class="panel ins-cta" data-card="join"><p>${t('你的 Agent 正在按这些信号运行', 'Your agent is running on these signals')}</p><button class="btn secondary block" data-action="choose-agent">${t('查看我的 Agent', 'View my agent')}${icon('arrow', '', 14)}</button></article>`;

  /* ---------- 智能分析 ---------- */
  function funnel() {
    const rows = [
      [t('监测市场', 'Markets monitored'), Engine.monitored(), 'monitored', false],
      [t('候选市场', 'Candidates'), Engine.candidates(), 'candidates', true],
      [t('有效交易信号', 'Valid signals'), Engine.signals(), 'signals', true],
      [t('通过风控', 'Passed risk checks'), Engine.passed(), 'passed', true],
      [t('待执行信号', 'Queued signals'), Engine.pending(), 'pending', true]
    ];
    const top = Math.log10(Math.max(10, rows[0][1] || 1000));
    return `<article class="panel ins-funnel" data-card="signal-funnel">
      <div class="panel-head"><h2>Signal Funnel</h2>${demo()}</div>
      ${rows.map(([label, value, key, simulated]) => `<div class="ins-funnel-row">
        <div class="between"><span>${label}${simulated ? '' : `<small>Polymarket</small>`}</span><b data-engine="${key}">${fmt(value)}</b></div>
        <div class="ins-bar"><span style="width:${value ? Math.max(6, Math.log10(Math.max(1, value)) / top * 100) : 0}%"></span></div>
      </div>`).join('')}
      <div class="source"><span>${t('监测市场为 Polymarket 开放事件数，其余为演示', 'Monitored count is open Polymarket events; the rest is demo')}</span><a href="#sources">${U.captureTime()}${icon('external', '', 10)}</a></div>
    </article>`;
  }

  function edgeMap() {
    const list = U.featured().slice(0, 6), span = 5;
    return `<article class="panel ins-edge" data-card="model-vs-market">
      <div class="panel-head"><h2>Model vs Market</h2>${demo()}</div>
      <div class="ins-edge-head"><span>${t('市场隐含 → 模型估计（YES）', 'Market → model (YES)')}</span><span>NO</span><span>YES</span><span>${t('偏差', 'Edge')}</span></div>
      ${list.map(m => {
        const a = Number(m.prices[0]) * 100, b = Engine.model(m) * 100, e = Engine.edge(m), w = Math.min(1, Math.abs(e) / span) * 50;
        return `<div class="ins-edge-row">
          <p title="${U.esc(m.question)}">${short(m)}</p>
          <div class="ins-edge-line">
            <span class="ins-edge-values">${a.toFixed(1)}% <i>→</i> <b class="accent">${b.toFixed(1)}%</b></span>
            <span class="ins-diverge" aria-hidden="true"><span class="${e > 0 ? 'up' : 'down'}" style="${e > 0 ? 'left:50%' : 'right:50%'};width:${w}%"></span></span>
            <b class="${e > 0 ? 'positive' : 'negative'}">${signed(e)}</b>
          </div>
        </div>`;
      }).join('')}
      <div class="ins-axis" aria-hidden="true"><span></span><span>−${span}pp</span><span>0</span><span>+${span}pp</span><span></span></div>
      ${sourceLine()}
    </article>`;
  }

  function breakdown() {
    const set = Engine.signalSet();
    if (!set.some(m => m.id === S.insightMarket)) S.insightMarket = set[0]?.id;
    const m = set.find(x => x.id === S.insightMarket) || set[0];
    if (!m) return '';
    const p = Engine.pct(Engine.model(m)), mk = Engine.pct(Number(m.prices[0])), d = Engine.decision(m), f = Object.fromEntries(Engine.factors(m).map(x => [x.key, x.score]));
    const rows = [
      ['edge', t('概率偏差', 'Probability edge'), signed(Engine.edge(m)) + ' pp', t('演示模型', 'Demo model')],
      ['liquidity', t('盘口流动性', 'Market liquidity'), '$' + U.money(m.liquidity, true), 'Polymarket'],
      ['volume', t('24H 成交额', '24H volume'), '$' + U.money(m.volume24hr, true), 'Polymarket'],
      ['spread', t('YES 买卖价差', 'YES spread'), cents(Engine.spread(m)), 'Polymarket'],
      ['time', t('距离结算', 'Time to resolution'), days(m), 'Polymarket']
    ];
    return `<article class="panel ins-breakdown" data-card="signal-breakdown">
      <div class="panel-head"><h2>Signal Breakdown</h2>${demo()}</div>
      <div class="ins-chips" role="group" aria-label="${t('选择信号', 'Choose a signal')}">${set.map((x, i) => `<button data-insight="market" data-value="${x.id}" class="${x.id === m.id ? 'active' : ''}" aria-pressed="${x.id === m.id}">${U.thumb(x)}<span>${t('信号', 'Signal')} ${i + 1}</span></button>`).join('')}</div>
      <h3 class="ins-event" title="${U.esc(m.question)}">${U.esc(m.question)}</h3>
      <div class="ins-verdict">
        <div><span class="label">${t('模型信号评分', 'Signal score')}</span><strong>${Engine.score(m)}<small> / 100</small></strong></div>
        <div><span class="label">${t('结论', 'Call')}</span><span class="${decisionClass(d)}">${decisionLabel(d)}</span></div>
        <div><span class="label">${t('风险', 'Risk')}</span><span class="risk ${Engine.risk(m) === 'mid' ? 'mid' : ''}">${Engine.risk(m) === 'mid' ? t('中', 'Medium') : t('低', 'Low')}</span></div>
      </div>
      <div class="ins-probs">
        <span></span><span class="yes-label">YES</span><span class="no-label">NO</span>
        <span class="muted">${t('市场隐含', 'Market')}</span><b>${mk.yes}%</b><b>${mk.no}%</b>
        <span class="muted">${t('模型估计', 'Model')}</span><b class="accent">${p.yes}%</b><b class="accent">${p.no}%</b>
      </div>
      <div class="ins-factors">${rows.map(([key, label, value, src]) => `<div class="ins-factor">
        <div class="between"><span>${label}<small>${src}</small></span><b>${value}</b></div>
        <div class="ins-bar thin"><span style="width:${Math.round(f[key])}%"></span></div>
      </div>`).join('')}</div>
      <div class="source"><span>${t('信号生成', 'Signal generated')} ${hhmm(Engine.signalTime())} UTC+8 · ${t('5M 更新', 'Updates every 5M')}</span><a href="#sources">Polymarket · ${U.captureTime()}${icon('external', '', 10)}</a></div>
    </article>`;
  }

  function parameters() {
    const rows = [
      [t('信号刷新', 'Signal refresh'), t('每 5 分钟', 'Every 5 min')],
      [t('市场监测刷新', 'Market monitor refresh'), t('每 8 分钟', 'Every 8 min')],
      [t('模型与市场偏差', 'Model–market edge'), '2–5 pp'],
      [t('信号评分区间', 'Signal score range'), '50–95'],
      [t('运行周期', 'Run cycle'), t('8H · 撤单 3–5H', '8H · Exit 3–5H')]
    ];
    return `<article class="panel ins-params" data-card="model-parameters">
      <div class="panel-head"><h2>Model Parameters</h2><span class="demo-tag">${t('演示参数', 'DEMO SETTINGS')}</span></div>
      ${rows.map(([a, b]) => `<div class="ins-kv"><span>${a}</span><b>${b}</b></div>`).join('')}
    </article>`;
  }

  function analysis() {
    return `<div class="ins-layout">${funnel()}${edgeMap()}${breakdown()}${parameters()}${cta()}</div>`;
  }

  /* ---------- 引擎监控 ---------- */
  function health() {
    const stages = [
      ['globe', t('市场扫描', 'Market scan'), `<b data-engine="monitored">${fmt(Engine.monitored())}</b> ${t('个市场', 'markets')}`],
      ['pulse', t('信号识别', 'Signal analysis'), `<b data-engine="signals">${Engine.signals()}</b> ${t('条有效信号', 'valid signals')}`],
      ['shield', t('风控校验', 'Risk check'), `24H ${t('拦截', 'blocked')} <b data-engine="blocked">${Engine.blocked()}</b> ${t('次', '')}`],
      ['layers', t('订单执行', 'Order execution'), `${t('待处理', 'Queued')} <b data-engine="queued">${Engine.queued()}</b> ${t('笔', 'orders')}`]
    ];
    return `<article class="panel ins-health" data-card="engine-health">
      <div class="panel-head"><h2>Engine Health</h2>${demo()}</div>
      <div class="ins-status">
        <div><span class="label">${t('交易引擎', 'Trading engine')}</span>${U.badge(t('运行中', 'Running'))}</div>
        <div><span class="label">${t('维护计划', 'Maintenance')}</span><b>${t('暂无', 'None scheduled')}</b></div>
        <div><span class="label">${t('数据延迟', 'Data latency')}</span><b><span data-engine="latency">${Engine.latency()}</span> ms</b></div>
      </div>
      ${stages.map(([ic, name, value]) => `<div class="ins-stage"><span class="metric-icon">${icon(ic)}</span><div><h3>${name}</h3><p>${value}</p></div><span class="ins-ok"><i></i>${t('正常', 'Normal')}</span></div>`).join('')}
    </article>`;
  }

  function feeds() {
    const rows = [
      [t('预测市场与价格', 'Markets & prices'), 'Gamma API'],
      [t('订单簿', 'Order books'), 'CLOB'],
      [t('公开成交', 'Public trades'), 'Data API']
    ];
    return `<article class="panel ins-feeds" data-card="data-feeds">
      <div class="panel-head"><h2>Data Feeds</h2><span class="badge gray">${t('行情快照', 'SNAPSHOT')}</span></div>
      ${rows.map(([a, b]) => `<div class="ins-feed"><div><h3>${a}</h3><p>Polymarket · ${b}</p></div><span>${U.captureTime()}</span></div>`).join('')}
      <a class="text-link ins-feed-link" href="#sources">${t('查看数据来源', 'View data sources')}${icon('arrow', '', 13)}</a>
    </article>`;
  }

  const logEvery = 7000;
  function logEntries(now = Date.now(), n = 8) {
    const pool = U.featured(), k0 = Math.floor(now / logEvery);
    return Array.from({ length: n }, (_, j) => {
      const k = k0 - j, r = Engine.rnd('log', k), m = pool[Math.floor(Engine.rnd('log-market', k) * pool.length)], at = k * logEvery;
      if (r < .22) return { at, stage: t('市场扫描', 'Scan'), tone: 'gray', text: t(`完成扫描 ${fmt(Engine.monitored())} 个市场 · ${Engine.latency(at)}ms`, `Scanned ${fmt(Engine.monitored())} markets · ${Engine.latency(at)}ms`) };
      if (r < .58) { const e = Engine.edge(m); return { at, stage: t('信号识别', 'Signal'), tone: '', text: `${short(m)} · ${e > 0 ? 'YES' : 'NO'} ${signed(e)}pp · ${t('评分', 'score')} ${Engine.score(m)}` }; }
      if (r < .78) return { at, stage: t('风控拦截', 'Blocked'), tone: 'amber', text: short(m) };
      const side = Engine.edge(m) > 0 ? 'YES' : 'NO', price = side === 'YES' ? m.prices[0] : m.prices[1];
      return { at, stage: t('订单执行', 'Order'), tone: 'purple', text: `${short(m)} · ${side} ${t('限价', 'limit')} ${(price * 100).toFixed(1)}¢` };
    });
  }
  const logRows = () => logEntries().map(x => `<div class="ins-log-row"><div class="ins-log-meta"><span class="badge ${x.tone}">${x.stage}</span><time>${hhmmss(x.at)}</time></div><p>${x.text}</p></div>`).join('');
  function engineLog() {
    return `<article class="panel ins-log" data-card="engine-log">
      <div class="panel-head"><h2>Engine Log</h2>${demo()}</div>
      <div class="ins-log-list" data-engine-log>${logRows()}</div>
    </article>`;
  }

  function monitoring() {
    return `<div class="ins-layout">${health()}${engineLog()}${feeds()}${cta()}</div>`;
  }

  /* ---------- live chart and log updates without re-rendering ---------- */
  let lastLog = 0;
  const setText = (sel, v) => document.querySelectorAll(sel).forEach(el => { if (el.textContent !== String(v)) el.textContent = v; });
  function tick() {
    if (!window.D || S.route !== 'agent' || S.agentTab !== 3) return;
    const now = Date.now();
    const k = Math.floor(now / logEvery);
    if (k !== lastLog) { lastLog = k; const el = document.querySelector('[data-engine-log]'); if (el) el.innerHTML = logRows(); }
  }
  setInterval(tick, 1000);
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-insight]');
    if (!el) return;
    e.preventDefault();
    if (el.dataset.insight === 'market') { S.insightMarket = el.dataset.value; render({ preserve: true }); }
  });

  return { analysis, monitoring };
})();
