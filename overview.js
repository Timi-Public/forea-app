/* Overview (Leo 11-03): Hero · Platform Statistics · Core Products · AI Infrastructure ·
   Live Market Activity · Tokenomics · Ecosystem · Security & Transparency · Footer.
   Real: monitored markets (Polymarket open events), 24H volume of the market sample, token supply.
   Demo: signals, markets in service, signal and service feeds (all shared with Agent / Liquidity pages).
   Unknown platform figures stay "—"; contract and audit rows state they are not deployed / published. */
window.Overview=(()=>{
  const t=(zh,en)=>U.t(zh,en);
  const head=(title,sub)=>`<header class="ov-head"><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</header>`;
  const curve=[62,78,82,76,62,50,46,52,66,80,82,74];
  const net=[[14,22],[52,12],[96,30],[140,10],[188,26],[232,8],[276,20],[306,40],[30,118],[84,128],[150,120],[214,130],[262,116],[300,126]];

  function smooth(points){
    return points.map((p,i)=>{
      if(!i)return `M${p[0]} ${p[1]}`;
      const a=points[i-2]||points[i-1],b=points[i-1],d=points[i+1]||p;
      const c1=[b[0]+(p[0]-a[0])/6,b[1]+(p[1]-a[1])/6],c2=[p[0]-(d[0]-b[0])/6,p[1]-(d[1]-b[1])/6];
      return `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p[0]} ${p[1]}`;
    }).join(' ');
  }
  function heroArt(){
    const pts=curve.map((y,i)=>[Math.round(8+i*304/11),y]);
    const links=net.flatMap((a,i)=>net.slice(i+1).filter(b=>Math.hypot(a[0]-b[0],a[1]-b[1])<54).map(b=>`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`)).join('');
    const spokes=[0,3,6,9].map(i=>net.filter(n=>Math.abs(n[0]-pts[i][0])<48).map(n=>`M${pts[i][0]} ${pts[i][1]}L${n[0]} ${n[1]}`).join('')).join('');
    return `<svg class="ov-hero-svg" viewBox="0 0 320 140" aria-hidden="true"><path class="net" d="${links}${spokes}"/>${net.map(([x,y])=>`<circle class="net-node" cx="${x}" cy="${y}" r="1.6"/>`).join('')}<path class="base" d="M8 112H312"/><path class="line" d="${smooth(pts)}"/>${pts.map(([x,y],i)=>[0,3,6,9].includes(i)?`<circle class="node big n${[0,3,6,9].indexOf(i)}" cx="${x}" cy="${y}" r="5.5"/>`:`<circle class="node" cx="${x}" cy="${y}" r="2.6"/>`).join('')}</svg>`;
  }
  function hero(){
    return `<article class="ov-hero" data-card="hero"><div class="ov-tags"><i class="ov-live"></i><span>Polymarket</span><span>Polygon</span><span>AI Agent</span></div>`
      +`<h1>${t('预测市场智能交易<br>与流动性网络','AI trading and liquidity network for prediction markets')}</h1>`
      +`<p>${t('基于 Polymarket 构建，以 AI Agent 智能交易与流动性服务为核心，融合市场分析、自动化执行、风险管理与链上资产管理','Built on Polymarket, with AI agent trading and liquidity services at its core, combining market analysis, automated execution, risk management and onchain asset management')}</p>`
      +`<div class="ov-visual"><div class="ov-visual-labels"><span>${icon('brain','',15)}${t('AI 智能分析','AI analysis')}</span><span>${icon('waves','',15)}${t('预测市场流动性','Market liquidity')}</span></div>${heroArt()}<div class="ov-steps"><span>${t('数据分析','Data analysis')}</span>${icon('chevron','',11)}<span>${t('信号决策','Signal decision')}</span>${icon('chevron','',11)}<span>${t('自动执行','Auto execution')}</span></div></div>`
      +`<div class="ov-hero-actions"><a class="btn ov-primary" href="#agent">${t('开始智能交易','Start Agent Trading')}${icon('external','',13)}</a><a class="btn ov-secondary" href="#liquidity">${t('探索流动性市场','Explore liquidity')}${icon('external','',13)}</a></div>`
      +`<button class="ov-funding" data-action="funding">${icon('wallet','',14)}${t('还没有 USDC？先准备资金','Need USDC? Prepare funds first')}</button></article>`;
  }
  function stats(){
    const cards=[[t('平台管理资产','Assets managed'),'USDC','wallet'],[t('累计交易额','Cumulative volume'),'USDC','chart'],[t('活跃交易盘口','Active markets'),t('个','markets'),'pulse'],[t('流动性服务规模','Liquidity in service'),'USDC','waves']];
    return `<section class="ov-stats" aria-label="${t('平台实时数据','Platform statistics')}">${cards.map(([l,u,ic])=>`<article class="panel ov-stat"><div class="between"><span class="label">${l}</span>${icon(ic,'muted',17)}</div><strong>—</strong><small>${u}</small><span class="ov-status"><i></i>${t('待接入','Pending')}</span></article>`).join('')}</section>`;
  }
  function productHead(ic,title,sub,href){
    return `<a class="ov-product-head" href="${href}"><span class="metric-icon">${icon(ic,'',20)}</span><div><h3>${title}</h3><span>${sub}</span></div>${icon('external','muted',15)}</a>`;
  }
  function signalArt(){
    const bars=Array.from({length:32},(_,i)=>18+Math.round(Engine.walk('ov-bars-'+i,3600000,0,22)));
    return `<svg class="ov-art" viewBox="0 0 320 44" preserveAspectRatio="none" aria-hidden="true">${bars.map((h,i)=>`<rect x="${i*10+1}" y="${44-h}" width="6" height="${h}" rx="2" class="${i%7===3?'hot':''}"/>`).join('')}</svg>`;
  }
  function depthArt(){
    return `<svg class="ov-art" viewBox="0 0 320 44" preserveAspectRatio="none" aria-hidden="true"><path class="bid" d="M0 6H40V12H76V18H108V25H134V32H160V44H0Z"/><path class="ask" d="M160 44V33H184V27H214V20H246V14H282V7H320V44Z"/><path class="mid" d="M160 0V44"/></svg>`;
  }
  function products(){
    const {money}=U,eligible=D.summary.eligibleEventCount??D.markets.filter(U.eligible).length;
    const agent=`<article class="panel ov-product" data-card="ov-agent">${productHead('agent','Agent Trading',t('AI 智能代理交易','AI agent trading'),'#agent')}<h4>${t('让智能代理参与预测市场交易','Let an AI agent trade prediction markets')}</h4><p>${t('通过 AI Agent 持续分析 Polymarket 市场数据，识别交易信号，执行自动化交易与做市策略，并结合风险控制机制管理交易过程','The AI agent keeps analysing Polymarket data, spots trading signals, runs automated trading and market-making strategies, and manages every trade with risk controls')}</p>${signalArt()}`
      +`<div class="ov-spec"><div class="between ov-spec-head"><span>${t('智能交易系统','Trading system')}</span><span class="demo-tag">${t('演示','DEMO')}</span></div><div class="ov-spec-grid">`
      +`<div><span class="label">${t('监测盘口','Markets monitored')}</span><b>${money(Engine.monitored()??D.markets.length,false,0)}</b><small>${t('个','markets')}</small></div>`
      +`<div><span class="label">${t('有效信号','Valid signals')}</span><b data-engine="signals">${Engine.signals()}</b><small>${t('条','signals')}</small></div>`
      +`<div><span class="label">${t('24小时成交','24H volume')}</span><b>${money(D.summary.sampleVolume24hr,true)}</b><small>USDC</small></div></div>`
      +`<div class="between ov-spec-foot"><span class="row">${icon('clock','',15)}${t('8小时运行周期','8H run cycle')}</span><span class="ov-chip">${t('自动化交易','Automated')}</span></div></div>`
      +`<a class="btn secondary block" href="#agent">${t('进入智能交易','Open Agent Trading')}${icon('arrow','',14)}</a></article>`;
    const liquidity=`<article class="panel ov-product" data-card="ov-liquidity">${productHead('waves','Liquidity Marketplace',t('预测市场流动性服务','Prediction market liquidity'),'#liquidity')}<h4>${t('为预测市场提供流动性支持','Liquidity support for prediction markets')}</h4><p>${t('选择指定 Polymarket 交易盘口，提供基础流动性并支付服务费用，由平台结合配套资金与自动化做市系统，为目标盘口提供流动性支持','Choose a Polymarket market, provide base liquidity and pay a service fee; the platform adds matching capital and automated market making to support that market')}</p>${depthArt()}`
      +`<div class="ov-spec"><div class="between ov-spec-head"><span>${t('流动性服务参数','Service terms')}</span><span class="ov-chip">12H</span></div><div class="ov-spec-grid">`
      +`<div><span class="label">${t('基础流动性','Base liquidity')}</span><b>1K–5K</b><small>USDC</small></div>`
      +`<div><span class="label">${t('服务费率','Service fee')}</span><b>4%</b><small>${t('按投入金额','of amount')}</small></div>`
      +`<div><span class="label">${t('服务期限','Term')}</span><b>12</b><small>${t('小时','hours')}</small></div></div>`
      +`<div class="between ov-spec-foot"><span>${t('服务中交易盘口','Markets in service')}</span><b>${money(Engine.activeServices(eligible),false,0)} <small>${t('个','markets')}</small></b></div></div>`
      +`<a class="btn secondary block" href="#liquidity">${t('探索流动性市场','Explore liquidity')}${icon('arrow','',14)}</a></article>`;
    return `<section class="ov-section">${head(t('智能交易与流动性服务','Agent trading and liquidity services'),t('以智能代理连接预测市场交易需求与流动性资源，构建自动化、数据驱动的市场参与体系','Intelligent agents connect prediction market trading demand with liquidity, for automated, data-driven market participation'))}<div class="ov-products">${agent}${liquidity}</div></section>`;
  }
  function infrastructure(){
    const nodes=[['radar','Market Intelligence','市场数据分析','采集预测价格、交易量、订单簿深度与市场流动性信息','Collects prediction prices, volume, order book depth and liquidity'],['brain','AI Signal Engine','智能信号引擎','基于量化指标与模型分析识别交易机会，生成策略信号','Finds opportunities with quantitative indicators and models, and generates strategy signals'],['shield','Risk Management','风险管理系统','对交易成本、资金敞口、仓位限制及执行条件进行校验','Checks trading costs, exposure, position limits and execution conditions'],['swap','Execution Engine','自动交易执行','统一管理订单提交、成交跟踪、撤单与交易结果核算','Handles order submission, fill tracking, cancellation and trade settlement']];
    return `<section class="ov-section">${head(t('AI 驱动的交易基础设施','AI-driven trading infrastructure'),t('从市场数据分析到订单执行，构建覆盖交易决策、自动化执行与风险管理的智能系统','From market data to order execution, one system covers trading decisions, automated execution and risk management'))}<article class="panel ov-infra">${nodes.map(([ic,en,zh,dz,de])=>`<div class="ov-node"><span class="ov-node-icon">${icon(ic,'',19)}</span><div><h3>${en}</h3>${S.lang==='zh'?`<span class="ov-node-sub">${zh}</span>`:''}<p>${t(dz,de)}</p></div></div>`).join('')}<a class="ov-row-link" href="#agent/analysis"><span>${t('探索智能分析与引擎监控','Explore Intelligence and Monitoring')}</span>${icon('external','',14)}</a></article></section>`;
  }
  function services(){
    return `<div class="timeline">${U.featured().slice(0,3).map((m,i)=>`<div class="timeline-item"><time>${U.stamp(Date.now()-[12,44,61][i]*60000)} UTC+8</time><p>${U.esc(m.question)}</p><span class="badge ${['','gray','purple'][i]}">${icon(['drop','check','coins'][i],'',11)}${t(['流动性服务已开始','流动性服务已结束','流动性服务已结算'][i],['Liquidity service started','Liquidity service ended','Liquidity service settled'][i])}</span></div>`).join('')}</div>`;
  }
  function activity(){
    const tab=S.ovTab||0;
    const tabs=[t('交易动态','Trades'),t('交易信号','Signals'),t('流动性','Liquidity')];
    const body=tab===0?`<div class="ov-empty">${icon('list','',22)}<b>${t('等待交易数据接入','Waiting for trade data')}</b><p>${t('已确认的预测市场成交记录将在这里按时间顺序展示','Confirmed prediction market trades will appear here in time order')}</p></div>`
      :tab===1?`<div class="ov-signals">${Engine.signalSet().map((m,i)=>U.signalRow(m,i)).join('')}</div>`:services();
    const link=[['#agent/execution',t('查看完整交易数据','View all trade data')],['#agent',t('查看全部信号','View all signals')],['#liquidity',t('查看流动性市场','Open Liquidity Marketplace')]][tab];
    return `<article class="panel ov-activity" data-card="ov-activity"><div class="panel-head"><div class="row">${icon('chart','',19)}<h2>Live Market Activity</h2></div><span class="demo-tag">${t('演示','DEMO')}</span></div><div class="ov-tabs" role="tablist">${tabs.map((l,i)=>`<button role="tab" aria-selected="${tab===i}" class="${tab===i?'active':''}" data-action="ov-tab" data-value="${i}">${l}</button>`).join('')}</div><div class="ov-activity-body" role="tabpanel">${body}</div><a class="ov-row-link" href="${link[0]}"><span>${link[1]}</span>${icon('external','',14)}</a></article>`;
  }
  function tokenomics(){
    const grid=[[t('初始发行总量','Initial supply'),'21,000,000','ABC'],[t('实时市场价格','Market price'),'—','USDC'],[t('累计销毁','Total burned'),'—','ABC'],[t('流通市值','Circulating market cap'),'—','USDC']];
    const rules=[['cpu',t('Agent 运行消耗','Agent usage'),t('项目代币直接用于智能体模型运行','The token pays directly for agent model usage')],['flame',t('交易税销毁','Trading tax burn'),t('买入 5%，卖出 5%','5% on buys, 5% on sells')],['refresh',t('回购与销毁','Buyback & burn'),t('Agent 托管费用的 50% 用于代币回购销毁','50% of agent custody fees buy back and burn the token')]];
    return `<section class="ov-section">${head('Tokenomics',t('项目代币用于 AI Agent 模型运行消耗，并通过交易税销毁及协议回购销毁机制，连接平台业务需求与代币经济体系','The project token pays for AI agent model usage, and links platform demand to the token economy through trading-tax burns and protocol buyback-and-burn'))}<article class="panel ov-token">${productHead('coins',t('项目代币','Project token'),`<span class="ov-pair"><span>Polygon</span><span>${t('代币名称待定','Name to be announced')}</span></span>`,'#tokenomics')}<div class="ov-token-grid">${grid.map(([l,v,u])=>`<div><span class="label">${l}</span><b>${v}</b><small>${u}</small></div>`).join('')}</div><div class="ov-rules">${rules.map(([ic,l,d])=>`<div class="ov-rule">${icon(ic,'muted',19)}<div><h3>${l}</h3><p>${d}</p></div></div>`).join('')}</div><a class="btn secondary block" href="#tokenomics">${t('探索代币经济','Explore Tokenomics')}${icon('arrow','',14)}</a></article></section>`;
  }
  function ecosystem(){
    const rows=[['candles','Polymarket',t('预测市场数据与交易执行','Prediction market data and execution'),'https://polymarket.com'],['hexagon','Polygon',t('链上资产与智能合约基础设施','Onchain assets and smart contract infrastructure'),'https://polygon.technology'],['swap','Uniswap',t('项目代币交易与流动性池','Token trading and liquidity pools'),'https://app.uniswap.org']];
    return `<section class="ov-section">${head('Ecosystem',t('以 Polygon 区块链为基础，连接预测市场数据、自动交易与去中心化流动性协议','Built on Polygon, connecting prediction market data, automated trading and decentralised liquidity protocols'))}<article class="panel ov-eco">${rows.map(([ic,n,d,href])=>`<a class="ov-eco-row" href="${href}" target="_blank" rel="noopener noreferrer">${icon(ic,'muted',20)}<div><h3>${n}</h3><p>${d}</p></div>${icon('external','muted',14)}</a>`).join('')}</article></section>`;
  }
  function security(){
    return `<section class="ov-section" id="ov-security">${head('Security & Transparency',t('通过链上交易记录、智能合约信息及公开技术资料，提高协议运行的可验证性','Onchain records, smart contract details and public technical documents make the protocol verifiable'))}<article class="panel ov-security"><div class="ov-sec-grid"><button data-action="more-view" data-value="contracts">${icon('code-file','muted',19)}<h3>${t('智能合约','Smart contracts')}</h3><p>${t('合约地址与权限信息','Addresses and permissions')}</p></button><button data-action="more-view" data-value="security">${icon('shield','muted',19)}<h3>${t('安全审计','Security audit')}</h3><p>${t('审计状态与公开报告','Audit status and reports')}</p></button></div>`
      +`<div class="ov-sec-rows"><div class="between"><span>${t('代币合约验证状态','Token contract verification')}</span><span class="muted">${t('待部署验证','Pending deployment')}</span></div><div class="between"><span>${t('安全审计报告','Security audit report')}</span><span class="muted">${t('待发布','Not yet published')}</span></div><button class="between" data-action="more-view" data-value="security"><span>${t('查看合约与安全资料','View contracts and security docs')}</span>${icon('external','',14)}</button></div></article></section>`;
  }
  function footer(){
    return `<footer class="ov-footer"><div class="row ov-brand"><img src="assets/mark.svg" alt=""><b>${U.brand}</b></div><p>${t('基于 Polymarket 的 AI 智能交易与预测市场流动性网络','AI trading and liquidity network for prediction markets, built on Polymarket')}</p>`
      +`<nav class="ov-footer-links" aria-label="${t('页脚导航','Footer')}"><a href="#whitepaper">${t('白皮书','Whitepaper')}</a><a href="#guide">${t('技术文档','Documentation')}</a><button data-action="more-view" data-value="contracts">${t('智能合约','Smart contracts')}</button><button class="ov-community" data-action="more-view" data-value="community" aria-label="${t('官方社区','Community')}"><span>${t('官方社区','Community')}</span>${['x-logo','send','chat'].map(ic=>`<span class="ov-social" aria-hidden="true">${icon(ic,'',14)}</span>`).join('')}</button></nav>`
      +`<small>© 2026 ${U.brand} ${t('保留所有权利','All rights reserved')}</small></footer>`;
  }
  function page(){
    return `<section class="ov-page" data-screen-label="Overview">${hero()}${stats()}${products()}${infrastructure()}<section class="ov-section">${activity()}</section>${tokenomics()}${ecosystem()}${security()}</section>`;
  }
  const actions={'ov-tab':v=>{const n=Number(v);if(![0,1,2].includes(n))return;S.ovTab=n;render({preserve:true})}};
  return {page,footer,actions};
})();
