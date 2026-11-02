/* Review prototype. OKX reads identity only; no approvals, signatures or fund transactions. */
var D;
var params = new URLSearchParams(location.search);
var S = {
  lang:localStorage.getItem('forecast-design-lang')||'zh',
  themeMode:ForeaTheme.getMode(),theme:ForeaTheme.resolve(ForeaTheme.getMode()),
  route:'home',agentTab:0,liquidityTab:0,monitorTab:'positions',
  connected:false,walletAddress:'',walletChainId:null,accountSub:'',tokenCycleUsed:0,account:0,walletBalance:3250.00,capital:1000,amount:1000,
  agentState:params.get('scene')||'inactive',elapsed:14643,startedAt:Date.now(),
  category:'all',topic:'',tradeFilter:'all',tapePaused:false,tapeOldest:false,search:'',marketPage:0,bookMarket:'',
  swapAmount:25,swapReverse:false,slippage:.5,showSlippage:false,
  services:[],records:[],accountCache:{},overlay:null,selectedMarket:null
};
if(S.agentState==='inactive'){S.capital=0;S.elapsed=0}
if(S.agentState==='cancelling')S.elapsed=9043;
if(S.agentState==='resuming')S.elapsed=183;
if(S.agentState==='stopped')S.elapsed=0;
var U = {
  t:(zh,en)=>S.lang==='zh'?zh:en,
  esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  money:(n,compact=false,digits=2)=>Number(n).toLocaleString('en-US',compact?{notation:'compact',maximumFractionDigits:2}:{minimumFractionDigits:digits,maximumFractionDigits:digits}),
  badge:(label,tone='')=>`<span class="badge ${tone}"><span class="dot"></span>${label}</span>`,
  accountBalance:i=>i===S.account?S.walletBalance:(S.accountCache[i]?.walletBalance??(i===0?3250:850)),
  record:(label,amount,unit='USDC')=>S.records.unshift({label,amount,unit,time:Date.now()}),
  address:()=>S.walletAddress?S.walletAddress.slice(0,6)+'…'+S.walletAddress.slice(-4):U.t('访客','Guest'),
  avatar:()=>Account.avatar(),
  wave:()=>`<svg class="wave-field" viewBox="0 0 600 450" fill="none" aria-hidden="true">${Array.from({length:26},(_,i)=>`<path d="M-30 ${60+i*13} C100 ${220+i*8}, 180 ${-40+i*11}, 300 ${110+i*10} S470 ${390-i*6}, 660 ${120+i*8}" stroke="currentColor" stroke-width=".7" opacity="${.22+i*.018}"></path>`).join('')}</svg>`,
  captureTime:()=>new Date(D.fetchedAt).toLocaleString('en-GB',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Kuala_Lumpur'})+' UTC+8',
  fullCapture:()=>new Date(D.fetchedAt).toLocaleString('en-GB',{hour12:false,timeZone:'Asia/Kuala_Lumpur'})+' UTC+8',
  clockTime:ms=>new Date(ms).toLocaleTimeString('en-GB',{hour12:false,timeZone:'Asia/Kuala_Lumpur'}),
  source:(kind,time)=>`<div class="source"><a href="#sources">${icon('globe','',11)}Polymarket · ${U.t('行情快照','Data snapshot')}${icon('external','',10)}</a><span>${U.t('更新于','Updated')} ${time?new Date(time).toLocaleString('en-GB',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Kuala_Lumpur'})+' UTC+8':U.captureTime()}</span></div>`,
  tabs:(zh,en,current,action)=>`<div class="tabs" role="tablist">${zh.map((x,i)=>`<button role="tab" aria-selected="${i===current}" class="${i===current?'active':''}" data-action="${action}" data-value="${i}">${U.t(x,en[i])}</button>`).join('')}</div>`,
  pending:(title,desc,ic='layers',cta='',action='')=>`<div class="panel"><div class="empty"><div class="empty-icon">${icon(ic,'',29)}</div><h2>${title}</h2><p>${desc}</p>${cta?`<button class="btn primary" data-action="${action}">${cta}${icon('arrow','',15)}</button>`:`<span class="badge gray">${U.t('暂未开放','Not available yet')}</span>`}</div></div>`,
  metric:(label,value,unit,ic,foot)=>`<article class="metric-card"><div class="between"><span class="label">${label}</span><span class="metric-icon">${icon(ic)}</span></div><div class="num">${value}<small>${unit}</small></div>${foot?`<p class="foot">${foot}</p>`:''}</article>`,
  category:m=>{const tags=m.tagLabels.join(' ').toLowerCase();return /crypto|bitcoin/.test(tags)?'crypto':/sport|soccer/.test(tags)?'sports':/geopolitics|france|iran/.test(tags)?'world':'politics'},
  categoryLabel:c=>({all:U.t('全部','All'),politics:U.t('政治','Politics'),crypto:U.t('加密货币','Crypto'),sports:U.t('体育','Sports'),world:U.t('世界','World')})[c]||c,
  eligible:m=>m.liquidity>=100000,
  performance:()=>{const gross=S.capital>0 ? 0.34 : 0,tokenCost=S.capital>0 ? Tokenomics.tokenValue(S.tokenCycleUsed) : 0,net=Number((gross-tokenCost).toFixed(8));return {gross,tokenCost,net,equity:S.capital+net,cashBalance:S.capital+gross,grossPct:S.capital?gross/S.capital*100:0,netPct:S.capital?net/S.capital*100:0}},
  pct:n=>(n>=0?'+':'')+n.toFixed(3)+'%',
  filteredMarkets:()=>{const raw=S.search.trim().toLowerCase();const alias={'比特币':'bitcoin','参议院':'senate','英超':'premier league','中期选举':'midterms','中期':'midterms','法国选举':'french','法国':'france','政治':'politics','体育':'sports','加密货币':'crypto','民主党':'democratic','共和党':'republican'};const q=alias[raw]||raw;const list=q?D.markets.filter(m=>(m.question+' '+m.tagLabels.join(' ')+' '+U.categoryLabel(U.category(m))).toLowerCase().includes(q)):U.featured().filter(U.eligible).slice(0,9);return list.filter(m=>S.category==='all'||U.category(m)===S.category)},
  featured:()=>[0,7,6,1,9,3,5,8,2,4,10,11].map(i=>D.markets[i]).filter(Boolean),
  thumb:m=>m.localImage?`<img class="market-thumb" src="${U.esc(m.localImage)}" alt="" loading="lazy">`:`<span class="market-thumb">${icon(U.category(m)==='crypto'?'coins':U.category(m)==='sports'?'shield':'globe','',20)}</span>`,
  marketCard:(m,compact=false)=>{
    const book=D.orderBooks.find(b=>b.marketId===m.id);
    const spread=book?(book.asks[0].price-book.bids[0].price).toFixed(3)+' USD':'—';
    return `<article class="panel market-card"><div class="between market-card-topline"><span class="market-category">${U.categoryLabel(U.category(m))}</span><span class="market-snapshot-label">Polymarket · ${U.t('快照','Snapshot')}</span></div><div class="top">${U.thumb(m)}<h3 class="title" title="${U.esc(m.question)}">${U.esc(m.question)}</h3></div><div class="market-quotes"><div><span class="positive">YES ${U.t('参考价格','reference')}</span><strong>${Number(m.prices[0]).toFixed(3)}</strong><small>${(m.prices[0]*100).toFixed(1)}% ${U.t('隐含概率','implied')}</small></div><div><span class="negative">NO ${U.t('参考价格','reference')}</span><strong>${Number(m.prices[1]).toFixed(3)}</strong><small>${(m.prices[1]*100).toFixed(1)}% ${U.t('隐含概率','implied')}</small></div></div><div class="market-detail-grid"><div><span>${U.t('24H 成交额','24H volume')}</span><b>$${U.money(m.volume24hr,true)}</b></div><div><span>${U.t('当前盘口流动性','Market liquidity')}</span><b>$${U.money(m.liquidity,true)}</b></div><div><span>YES ${U.t('买卖价差','spread')}</span><b>${spread}</b></div><div><span>${U.t('盘口交易状态','Market status')}</span><b class="positive">${U.t('开放交易','Trading open')}</b></div></div>${compact?`<a class="text-link" href="https://polymarket.com/event/${U.esc(m.eventSlug||m.slug)}" target="_blank" rel="noopener noreferrer">${U.t('查看预测事件','View market')}${icon('external','',12)}</a>`:U.eligible(m)?`<button class="btn secondary block" data-action="apply" data-value="${m.id}">${U.t('查看盘口并申请服务','Review market & apply')}${icon('arrow','',13)}</button>`:`<div class="unsupported">${icon('lock','',12)} ${U.t('暂不支持申请','Service unavailable')}</div>`}</article>`;
  },
  serviceInfo:s=>{const duration=12*3600000,elapsed=Math.max(0,Date.now()-(s.startedAt||Date.now())),remaining=Math.max(0,duration-elapsed),status=s.status==='active'&&remaining===0?'ended':s.status;return {status,label:status==='active'?U.t('服务中','Active'):status==='ended'?U.t('已结束，待结算','Ended, pending settlement'):U.t('已结算','Settled'),tone:status==='active'?'':status==='ended'?'amber':'purple',progress:Math.min(100,elapsed/duration*100),time:status==='active'?`${String(Math.floor(remaining/3600000)).padStart(2,'0')}H ${String(Math.floor(remaining%3600000/60000)).padStart(2,'0')}M`:status==='ended'?'12H / 12H':U.t('服务已结算','Settled')}},
  model:(m,i)=>Math.min(.99,Math.max(.01,m.prices[0]+[-.032,.027,.045][i%3])),
  signalRow:(m,i)=>{const p=U.model(m,i);return `<div class="signal-row"><div class="signal-top">${U.thumb(m)}<h3 class="signal-title" title="${U.esc(m.question)}">${U.esc(m.question)}</h3><time>${U.captureTime().split(' ')[0]}</time></div><div class="signal-probs"><span class="muted">${U.t('交易方向','Direction')}</span><div class="prob-header"><span class="yes-label">YES</span></div><div class="prob-header"><span class="no-label">NO</span></div><span class="muted">${U.t('隐含概率','Implied probability')}</span><span class="value">${(m.prices[0]*100).toFixed(1)}%</span><span class="value">${(m.prices[1]*100).toFixed(1)}%</span><span class="muted">${U.t('模型估计概率','Model estimate')}</span><span class="value accent">${(p*100).toFixed(1)}%</span><span class="value accent">${((1-p)*100).toFixed(1)}%</span></div><div class="between"><span class="score"><span class="muted">${U.t('模型信号评分','Signal score')}</span><span class="score-bar"><span style="width:${[86,79,91][i]}%"></span></span><b>${[86,79,91][i]}<span class="quiet"> / 100</span></b></span></div></div>`},
  positionRow:(m,i)=>`<div class="position-row"><div class="between"><span class="${['yes','no','hold'][i]}-label">${['YES','NO',U.t('观望','WATCH')][i]}</span><span class="risk ${i===1?'mid':''}">${U.t('风险','Risk')}: ${i===1?U.t('中','Medium'):U.t('低','Low')}</span></div><p class="title" style="margin-top:9px">${U.esc(m.question)}</p><div class="position-data"><div class="probs"><span>${U.t('市场','Market')} <b class="${i===1?'negative':'positive'}">${(m.prices[i===1?1:0]*100).toFixed(1)}%</b></span><span>${U.t('模型','Model')} <b class="accent">${((i===1?1-U.model(m,i):U.model(m,i))*100).toFixed(1)}%</b></span></div></div></div>`,
  tradeRows:(trades)=>trades.map(tr=>`<div class="position-row"><p class="title">${U.esc(tr.question)}</p><div class="position-data"><span class="${tr.outcome==='Yes'?'yes':'no'}-label">${U.esc(tr.outcome.toUpperCase())}</span><span class="muted">${U.clockTime(tr.timestamp*1000)}</span><b>${U.money(tr.notional)} USD</b><a class="accent" target="_blank" rel="noopener noreferrer" href="https://polygonscan.com/tx/${U.esc(tr.transactionHash)}">${icon('external','',12)}</a></div></div>`).join(''),
  agentState:()=>{
    const t=U.t;
    const elapsed=S.elapsed+Math.floor((Date.now()-S.startedAt)/1000);
    const clock=n=>`${String(Math.floor(n/3600)).padStart(2,'0')}H ${String(Math.floor(n%3600/60)).padStart(2,'0')}M ${String(n%60).padStart(2,'0')}S`;
    const states={
      inactive:{label:t('未激活','Inactive'),tone:'gray',primary:t('开始运行','Start running'),primaryIcon:'play',period:'8H / '+t('周期','cycle'),progress:0,time:'00H 00M 00S'},
      running:{label:t('运行中','Running'),tone:'',primary:t('运行中','Running'),primaryIcon:'pulse',period:'8H / '+t('周期','cycle'),progress:Math.min(100,elapsed/28800*100),time:clock(Math.min(elapsed,28800))},
      cancelling:{label:t('撤单中','Cancelling'),tone:'amber',primary:t('继续运行','Continue running'),primaryIcon:'play',period:'3–5H / '+t('退出','exit'),progress:Math.min(100,elapsed/14400*100),time:t('撤单中：','Exit: ')+clock(elapsed)},
      resuming:{label:t('恢复中','Resuming'),tone:'amber',primary:t('正在恢复运行','Resuming execution'),primaryIcon:'refresh',period:'5–10M / '+t('恢复','resume'),progress:Math.min(100,elapsed/600*100),time:clock(elapsed)},
      stopped:{label:t('已停止','Stopped'),tone:'gray',primary:t('继续运行','Continue running'),primaryIcon:'play',period:t('本周期已结束','Cycle complete'),progress:100,time:'08H 00M 00S'}
    };return states[S.agentState]||states.running;
  }
};
function header(){
  const {t}=U;
  const nav=[
    ['home',t('总览','Home'),'grid',t('总览','Overview')],
    ['agent',t('智能交易','Agent'),'agent',t('智能交易','Agent Trading')],
    ['tokenomics',t('代币','Token'),'layers',t('代币经济','Tokenomics')],
    ['liquidity',t('流动性','Liquidity'),'drop',t('流动性市场','Liquidity Marketplace')],
    ['account',t('资产','Assets'),'wallet',t('我的资产','Portfolio')]
  ];
  return `<div class="preview-bar"><b>${t('交互原型','PROTOTYPE')}</b><span>${t('非实盘 · Polymarket 快照','Demo · Polymarket snapshot')}</span><button data-action="review">${t('预览设置','Preview settings')}</button></div><header class="topbar"><div class="top-inner"><a href="#home" class="brand" aria-label="Forea Home"><img src="assets/mark.svg" alt=""><span>forea</span></a><nav class="desktop-nav" aria-label="${t('主导航','Main navigation')}">${nav.map(([r,l,ic,full])=>`<a href="#${r}" class="${S.route===r?'active':''}" aria-label="${full}" ${S.route===r?'aria-current="page"':''}>${full}</a>`).join('')}</nav><div class="tools"><button class="language" data-action="language" aria-label="${t('切换语言','Switch language')}">${icon('globe','',15)}${S.lang==='zh'?'中':'EN'}${icon('down','down',10)}</button><button class="icon-btn theme-btn" data-action="theme" aria-label="${t('外观设置','Appearance')}">${icon(S.themeMode==='auto'?'clock':S.theme==='dark'?'moon':'sun','',18)}</button><button class="wallet-btn" data-action="wallet">${S.connected?'<span class="chain-dot"></span>':icon('wallet','',15)}${S.walletAddress?U.address():t('连接钱包','Connect')}</button><button class="avatar" data-action="account" aria-label="${t('我的账户','My Account')}">${U.avatar()}</button><button class="icon-btn top-menu" data-action="menu" aria-label="${t('更多菜单','More menu')}">${icon('menu','',16)}</button></div></div></header><nav class="mobile-nav" aria-label="${t('主导航','Main navigation')}">${nav.map(([r,l,ic,full])=>`<a href="#${r}" class="${S.route===r?'active':''}" aria-label="${full}" ${S.route===r?'aria-current="page"':''}>${icon(ic)}<span class="nav-label">${l}</span></a>`).join('')}<button class="swap-fab" data-action="open-swap" aria-label="${t('兑换','Swap')}">${icon('swap')}</button></nav>`;
}
function footer(){return `<footer class="footer"><span>© 2026 Forea · ${U.t('产品设计原型','Product design prototype')}</span><div class="footer-links"><a href="#whitepaper">${U.t('白皮书','Whitepaper')}</a><a href="#sources">${U.t('数据来源','Data sources')}</a><a href="#guide">${U.t('使用指南','Quick guide')}</a></div></footer>`}
function render(options={}){
  if(!D)return;
  const y=document.getElementById('main')?.scrollTop||0;
  S.theme=ForeaTheme.apply(S.themeMode);
  document.documentElement.lang=S.lang==='zh'?'zh-CN':'en';
  document.body.classList.toggle('review-mode',params.has('embed'));
  const fn=Pages[S.route]||Pages.home;
  document.title=({home:'Overview',agent:'Agent Trading',liquidity:'Liquidity Marketplace',tokenomics:'Tokenomics',account:'Portfolio',swap:'Swap',whitepaper:'Whitepaper',guide:'Quick Guide',sources:'Data Sources'})[S.route]+' · Forea';
  document.getElementById('app').innerHTML=header()+`<main id="main" class="main">${fn()}${footer()}</main><button class="to-top" data-action="top" aria-label="${U.t('返回顶部','Back to top')}">${icon('up','',18)}</button><button class="review-fab" data-action="review">${icon('settings','',11)}${U.t('设计验收','Design review')}</button>`;
  if(options.preserve)document.getElementById('main').scrollTop=y;
  if(options.focus){const el=document.getElementById(options.focus);el?.focus({preventScroll:true});if(el?.type==='search')el.setSelectionRange(el.value.length,el.value.length)}
  updateScroll();
}
function route(){
  const [path,sub]=location.hash.replace('#','').split('/');
  S.route=['agent','liquidity','tokenomics','account','swap','whitepaper','sources','guide'].includes(path)?path:'home';
  if(S.route==='agent')S.agentTab=sub==='execution'?2:sub==='analysis'?1:sub==='monitoring'?3:0;
  if(S.route==='liquidity')S.liquidityTab=sub==='services'?1:0;
  S.accountSub=S.route==='account'&&['profile','consumption'].includes(sub)?sub:'';
  closeOverlay();render();document.getElementById('main')?.scrollTo(0,0);
}
function toast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('show'),3500)}
function closeOverlay(){clearTimeout(window.languageCloseTimer);document.getElementById('overlay').innerHTML='';document.body.style.overflow='';if(S.overlay){document.querySelector(`[data-action="${S.overlay}"]`)?.focus({preventScroll:true})}S.overlay=null}
function sheet(title,body,kind='sheet',name=''){
  const {t}=U;
  S.overlay=name;
  document.getElementById('overlay').innerHTML=kind==='drawer'?`<div class="scrim" data-dismiss="true"><section class="drawer" role="dialog" aria-modal="true" aria-label="${title}" tabindex="-1"><div class="drawer-head"><h2>${title}</h2><button class="icon-btn" data-action="close" aria-label="${t('关闭','Close')}">${icon('close')}</button></div>${body}</section></div>`:`<div class="sheet-wrap" data-dismiss="true"><section class="sheet" role="dialog" aria-modal="true" aria-label="${title}" tabindex="-1"><div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-action="close" aria-label="${t('关闭','Close')}">${icon('close')}</button></div>${body}</section></div>`;
  document.body.style.overflow='hidden';document.querySelector('[role="dialog"]')?.focus();
}
function settingsPopover(kind,title,content){
  closeOverlay();
  const anchor=document.querySelector('.topbar [data-action="'+kind+'"]');
  const bodyTop=document.body.getBoundingClientRect().top;
  const top=anchor?Math.min(anchor.getBoundingClientRect().bottom-bodyTop+7,innerHeight-210):75;
  S.overlay=kind;
  document.getElementById('overlay').innerHTML=`<div class="settings-layer" data-dismiss="true"><section class="settings-popover" role="dialog" aria-modal="true" aria-label="${title}" tabindex="-1" style="top:${top}px"><div class="settings-title">${title}</div>${content}</section></div>`;
  document.querySelector('.settings-popover')?.focus();
}
function languageMenu(){const {t}=U;settingsPopover('language',t('语言','Language'),[['zh','简体中文'],['en','English']].map(([code,label])=>`<button class="settings-option ${S.lang===code?'selected':''}" aria-pressed="${S.lang===code}" data-action="set-language" data-value="${code}"><span>${label}</span>${S.lang===code?icon('check','',16):''}</button>`).join(''))}
function themeMenu(){const {t}=U;settingsPopover('theme',t('外观','Appearance'),[['auto',t('自动','Auto'),'clock'],['light',t('浅色','Light'),'sun'],['dark',t('深色','Dark'),'moon']].map(([mode,label,ic])=>`<button class="settings-option ${S.themeMode===mode?'selected':''}" aria-pressed="${S.themeMode===mode}" data-action="set-theme" data-value="${mode}"><span class="row">${icon(ic,'',17)}${label}</span>${S.themeMode===mode?icon('check','',16):''}</button>`).join(''))}
function wallet(){OKXIdentity.view()}
function review(){const {t}=U;sheet(t('设计验收','Design review'),`<p class="tiny muted">${t('手机 App 设计验收。先逐页查看，再切换状态检查按钮和资金流程。','Mobile app design review. Review screens, then inspect states and fund actions.')}</p><div class="review-list">${[['home','Overview'],['agent','Agent Trading / 总览'],['agent/execution','Agent Trading / 交易执行'],['agent/analysis','智能分析 / 待补'],['agent/monitoring','引擎监控 / 待补'],['liquidity','Liquidity / 市场发现'],['liquidity/services','Liquidity / 我的服务'],['tokenomics','Tokenomics'],['account','我的账户'],['swap','独立兑换'],['whitepaper','白皮书'],['sources','数据与来源']].map(([h,l])=>`<a class="review-item" href="#${h}"><span>${l}</span>${icon('arrow','accent',13)}</a>`).join('')}</div><div class="menu-group-label">${t('MY AGENT 状态','MY AGENT STATES')}</div><div class="scene-controls">${['inactive','running','cancelling','resuming','stopped'].map((x,i)=>`<button data-action="scene" data-value="${x}" class="${S.agentState===x?'active':''}">${t(['未激活','运行中','撤单中','恢复中','已停止'][i],['Inactive','Running','Cancelling','Resuming','Stopped'][i])}</button>`).join('')}</div><div class="menu-group-label">${t('全局状态','GLOBAL STATES')}</div><div class="scene-controls"><button data-action="wallet">${t('钱包 / 切换账户','Wallet / Switch account')}</button><button data-action="theme">${t('明暗主题','Light / Dark')}</button><button data-action="language">中文 / English</button><button data-action="maintenance">${t('引擎维护提示','Maintenance message')}</button></div><div class="data-note">${t('实盘功能未接入。收益、模型、引擎和服务为演示；行情保留抓取日期。已完成中英界面，繁中、越南语、韩语尚未制作。','Live execution is not connected. Account, model, engine and service data are demos. Market captures retain timestamps. Chinese and English are ready; Traditional Chinese, Vietnamese and Korean are pending.')}</div><a class="btn secondary block" href="review.html" target="_blank">${t('打开全部页面画板','Open the screen board')}${icon('external','',13)}</a>`,'drawer','review')}
function menu(){const {t}=U;sheet(t('更多','More'),`<div class="menu-group-label">${t('了解项目','ABOUT')}</div>${[['whitepaper','book',t('白皮书','Whitepaper')],['guide','leaf',t('使用指南','Quick guide')],['sources','globe',t('数据与来源','Data & sources')]].map(([r,ic,l])=>`<a class="menu-link" href="#${r}">${icon(ic)}<span>${l}</span>${icon('chevron','muted',14)}</a>`).join('')}`,'drawer','menu')}
function participate(){const {t}=U;sheet(t('选择参与方式','Choose how to participate'),`<p>${t('使用 USDC 参与，项目代币用于模型额度。','Participate with USDC. Project tokens provide model allowance.')}</p><div class="participation-choice"><div class="row">${icon('agent','accent',24)}<div><h3>Agent Trading</h3><span class="tiny muted">20–1,000 USDC · 8H</span></div></div><p>${t('使用 USDC，自动交易预测事件的 YES / NO 份额（演示）。','Use USDC to trade YES / NO shares in prediction events automatically (demo).')}</p><p class="choice-term">${t('运行与退出期间资金锁定；完全停止后可提出。','Withdrawal stays locked during the run and exit phases.')}</p><button class="btn primary block" data-action="choose-agent">${t('投入 USDC，启动 Agent','Allocate USDC to Agent')}${icon('arrow','',14)}</button></div><div class="participation-choice"><div class="row">${icon('drop','accent',24)}<div><h3>Liquidity Marketplace</h3><span class="tiny muted">1,000–5,000 USDC · 12H</span></div></div><p>${t('选择预测事件，用 USDC 担保申请盘口流动性服务（演示）。','Choose an event and use USDC collateral to request order-book liquidity support (demo).')}</p><p class="choice-term">${t('服务费：担保资金的 4%。','Service fee: 4% of collateral.')}</p><button class="btn secondary block" data-action="choose-liquidity">${t('选择事件，申请服务','Choose an event & apply')}${icon('arrow','',14)}</button></div><button class="text-link" data-action="funding">${icon('wallet','',14)}${t('还没有 USDC？先准备资金','Need USDC? Prepare funds first')}</button>`)}
function funding(){const {t}=U;sheet(t('准备 USDC','Prepare USDC'),`<p>${t('使用 Polygon 钱包中的 USDC 参与。','Participate using USDC in your Polygon wallet.')}</p><div class="funding-balance"><span>${t('演示钱包余额','Demo wallet balance')}</span><strong>${U.money(S.walletBalance)} <small>USDC</small></strong></div><ol class="funding-steps"><li><b>${t('连接 Polygon 钱包','Connect a Polygon wallet')}</b><span>${t('钱包地址即账户。','Your wallet address is your account.')}</span></li><li><b>${t('准备钱包中的 USDC','Have USDC in your wallet')}</b><span>${t('请确认 USDC 位于 Polygon 网络。','Make sure your USDC is on Polygon.')}</span></li><li><b>${t('选择产品并确认投入','Choose a product & amount')}</b><span>${t('Agent 投入 20–1,000 USDC；流动性服务先选事件，再投入担保资金。','Agent allocation is 20–1,000 USDC. Liquidity service starts by choosing an event.')}</span></li></ol><div class="info-box">${t('演示加金不涉及真实资金。','Adding demo funds does not move real money.')}</div><button class="btn primary block" data-action="demo-top-up">${t('演示加金 +1,000 USDC','Add 1,000 demo USDC')}</button><button class="btn outline block" style="margin-top:10px" data-action="participate">${t('选择产品','Choose a product')}${icon('arrow','',14)}</button>`)}
function consumeDemoToken(reset=true){Tokenomics.ensure();S.tokenProjectBalance=Number((S.tokenProjectBalance-1).toFixed(8));S.tokenCycleUsed=reset?1:S.tokenCycleUsed+1;S.tokenConsumptionRecords.unshift({amount:1,time:Date.now()});U.record('model-use',-1,'ABC')}
function requestTokenFunding(){sheet(U.t('充值项目代币','Deposit project tokens'),`<p>${U.t('本次演示运行需 1 ABC，从项目余额扣除。','This demo run uses 1 ABC from your project balance.')}</p><button class="btn primary block" style="margin-top:20px" data-action="token-deposit">${U.t('充值 ABC','Deposit ABC')}</button>`)}
function startReview(){Tokenomics.ensure();if(S.tokenProjectBalance<1){requestTokenFunding();return}const {t}=U;const val=Number(S.amount);if(!Number.isFinite(val)||val<20||val>1000)return toast(t('请输入 20–1,000 USDC','Enter 20–1,000 USDC'));if(val>S.walletBalance)return toast(t('演示账户余额不足','Insufficient demo balance'));sheet(t('确认运行','Confirm run'),`<p>${t('本次为演示运行，不扣划真实资金。','This is a demo run. No real funds are moved.')}</p><div style="margin-top:20px">${[[t('本次资金','Allocation'),U.money(val)+' USDC'],[t('运行周期','Run cycle'),'8H'],[t('撤单阶段','Exit phase'),'3–5H'],[t('本次演示消耗','Demo usage'),'1 ABC']].map(([a,b])=>`<div class="confirm-row"><span>${a}</span><b>${b}</b></div>`).join('')}</div><div class="confirm-actions"><button class="btn secondary" data-action="close">${t('返回修改','Go back')}</button><button class="btn primary" data-action="start-demo">${t('开始运行','Start run')}${icon('play','',14)}</button></div>`,'sheet','agent-start')}
function apply(id){const {t}=U;const m=D.markets.find(m=>m.id===id);if(!m||!U.eligible(m))return toast(t('该市场暂不支持申请','This market is not eligible'));S.selectedMarket=id;sheet(t('申请流动性服务','Liquidity service request'),`<div class="row" style="align-items:flex-start">${U.thumb(m)}<p class="tiny">${U.esc(m.question)}</p></div><label class="field-label" for="service-amount">${t('流动性担保资金','Liquidity collateral')}</label><div class="amount-field"><input id="service-amount" type="number" min="1000" max="5000" value="1000"><span>USDC</span></div><p class="field-error" id="service-error"></p><div class="confirm-row"><span>${t('服务周期','Service term')}</span><b>12H</b></div><div class="confirm-row"><span>${t('服务费','Service fee')}</span><b>4% · <span id="service-fee">40.00</span> USDC</b></div><div class="confirm-row"><span>${t('到期返还','Amount returned')}</span><b><span id="service-return">960.00</span> USDC</b></div><div class="info-box">${t('到期返还金额已扣除服务费。本次为演示申请。','The returned amount is net of the service fee. This request is a demo.')}</div><button class="btn primary block" data-action="confirm-service">${t('提交演示申请','Submit demo request')}${icon('arrow','',14)}</button>`,'sheet','service-apply')}
function updateScroll(){const el=document.querySelector('.to-top'),area=document.getElementById('main');el?.classList.toggle('visible',area&&area.scrollHeight>area.clientHeight*3&&area.scrollTop>area.clientHeight*.8)}
function scene(name){S.agentState=name;S.capital=name==='inactive'?0:1000;S.elapsed=({inactive:0,running:14643,cancelling:9043,resuming:183,stopped:0})[name]||0;S.startedAt=Date.now();closeOverlay();if(location.hash!=='#agent')location.hash='agent';else{S.agentTab=0;render()}}
const actions = {
  menu,review,wallet,
  'okx-connect':()=>OKXIdentity.connect(),
  reload:()=>location.reload(),
  close:closeOverlay,
  account:()=>location.hash='account',
  'open-swap':()=>location.hash='swap',
  participate:()=>participate(),
  funding:()=>funding(),
  'demo-top-up':()=>{S.walletBalance+=1000;U.record('demo-funding',1000);closeOverlay();render({preserve:true});toast(U.t('已添加 1,000 USDC（演示）','Added 1,000 USDC (demo)'));},
  'choose-agent':()=>{closeOverlay();location.hash='agent';if(S.route==='agent'){S.agentTab=0;render();document.getElementById('agent-amount')?.focus()}},
  'choose-liquidity':()=>{closeOverlay();location.hash='liquidity';S.liquidityTab=0;render();setTimeout(()=>document.getElementById('market-explore')?.scrollIntoView({behavior:'smooth',block:'start'}),60)},
  'explore-markets':()=>document.getElementById('market-explore')?.scrollIntoView({behavior:'smooth',block:'start'}),
  top:()=>document.getElementById('main')?.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}),
  theme:()=>{if(S.overlay==='theme')closeOverlay();else themeMenu()},
  'set-theme':v=>{S.themeMode=v;S.theme=ForeaTheme.save(v);closeOverlay();render({preserve:true})},
  language:()=>{if(S.overlay==='language')closeOverlay();else languageMenu()},
  'set-language':v=>{if(!['zh','en'].includes(v))return;S.lang=v;localStorage.setItem('forecast-design-lang',v);render({preserve:true});languageMenu();window.languageCloseTimer=setTimeout(()=>{if(S.overlay==='language')closeOverlay()},2000)},
  reserved:()=>sheet(U.t('第五入口，先保留。','The fifth slot stays open.'),`<p>${U.t('新的功能入口正在规划中，后续版本会公布更多信息。','A new feature is being planned. More information will be available in a future version.')}</p><button class="btn primary block" style="margin-top:20px" data-action="close">${U.t('知道了','Got it')}</button>`),
  'agent-tab':v=>{S.agentTab=Number(v);const sub=['','/analysis','/execution','/monitoring'][S.agentTab];history.replaceState(null,'','#agent'+sub);render({preserve:true})},
  'liquidity-tab':v=>{S.liquidityTab=Number(v);history.replaceState(null,'','#liquidity'+(S.liquidityTab?'/services':''));render({preserve:true})},
  'monitor-tab':v=>{S.monitorTab=v;render({preserve:true})},
  'agent-max':()=>{S.amount=Math.min(1000,S.walletBalance);render({preserve:true})},
  'agent-primary':()=>{Tokenomics.ensure();if(S.agentState==='inactive')return startReview();if(['cancelling','stopped'].includes(S.agentState)&&S.tokenProjectBalance<1)return requestTokenFunding();if(S.agentState==='cancelling'){consumeDemoToken(false);S.agentState='resuming';S.elapsed=0;S.startedAt=Date.now();render({preserve:true});toast(U.t('正在恢复运行','Resuming execution'));}else if(S.agentState==='stopped'){consumeDemoToken();S.agentState='running';S.elapsed=0;S.startedAt=Date.now();render({preserve:true});toast(U.t('已开始新周期（演示）','New cycle started (demo)'))}},
  'start-demo':()=>{const n=Number(S.amount);if(S.overlay!=='agent-start'||!Number.isFinite(n)||n<20||n>1000||n>S.walletBalance||S.tokenProjectBalance<1)return;consumeDemoToken();S.capital=n;S.walletBalance-=n;U.record('agent-start',-n);S.agentState='running';S.elapsed=0;S.startedAt=Date.now();closeOverlay();render();toast(U.t('已开始运行（演示）','Run started (demo)'))},
  withdraw:()=>{if(S.agentState!=='stopped'||!S.capital)return;sheet(U.t('提出资金','Withdraw funds'),`<p>${U.t('将可提出余额返回演示钱包。','Return the available balance to your demo wallet.')}</p><div class="confirm-row" style="margin-top:18px"><span>${U.t('返回金额','Amount')}</span><b>${U.money(U.performance().cashBalance)} USDC</b></div><div class="confirm-row"><span>${U.t('演示账户','Demo account')}</span><b>${U.address()}</b></div><div class="confirm-actions"><button class="btn secondary" data-action="close">${U.t('取消','Cancel')}</button><button class="btn primary" data-action="confirm-withdraw">${U.t('确认提出','Confirm withdrawal')}</button></div>`)},
  'confirm-withdraw':()=>{if(S.agentState!=='stopped'||!S.capital)return;U.record('agent-withdraw',U.performance().cashBalance);S.walletBalance+=U.performance().cashBalance;S.capital=0;S.agentState='inactive';S.elapsed=0;closeOverlay();render();toast(U.t('已返回演示钱包','Returned to demo wallet'))},
  scene,
  disconnect:()=>OKXIdentity.disconnect(),
  topic:v=>{S.topic=v;S.search=v;S.category='all';S.marketPage=0;render({preserve:true})},
  'trade-filter':v=>{S.tradeFilter=v;render({preserve:true})},
  'tape-pause':()=>{S.tapePaused=!S.tapePaused;render({preserve:true})},
  'tape-sort':()=>{S.tapeOldest=!S.tapeOldest;render({preserve:true})},
  filter:v=>{S.category=v;S.marketPage=0;render({preserve:true})},
  'market-page':v=>{const max=Math.max(0,Math.ceil(U.filteredMarkets().length/3)-1);const desired=v==='next'?S.marketPage+1:v==='prev'?S.marketPage-1:Number(v);S.marketPage=Math.max(0,Math.min(max,desired));render({preserve:true})},
  apply,
  'service-intro':()=>sheet(U.t('流动性服务规则','Liquidity service terms'),`<p>${U.t('选择市场后，确认担保金额与服务费用。','Choose a market, then review collateral and fees.')}</p><div class="info-box">${U.t('担保资金：1,000–5,000 USDC<br>服务周期：12 小时<br>服务费：担保资金的 4%<br>到期返还：扣除服务费后的担保资金','Collateral: 1,000–5,000 USDC<br>Service term: 12 hours<br>Service fee: 4% of collateral<br>Amount returned: collateral after the service fee')}</div><button class="btn primary block" data-action="close">${U.t('返回选择市场','Choose a market')}</button>`),
  'clear-search':()=>{S.search='';S.topic='';S.category='all';S.marketPage=0;render({preserve:true})},
  'confirm-service':()=>{if(S.overlay!=='service-apply')return;const n=Number(document.getElementById('service-amount')?.value);const err=document.getElementById('service-error');if(!Number.isFinite(n)||n<1000||n>5000){err.textContent=U.t('请输入 1,000–5,000 USDC','Enter 1,000–5,000 USDC');return}if(n>S.walletBalance){err.textContent=U.t('余额不足，请调整金额或准备 USDC。','Insufficient balance. Adjust the amount or prepare USDC.');return}S.services.unshift({id:String(1043+S.services.length),marketId:S.selectedMarket,status:'active',amount:n,startedAt:Date.now()});S.walletBalance-=n;U.record('service-apply',-n);closeOverlay();location.hash='liquidity/services';S.liquidityTab=1;render();toast(U.t('演示申请已提交','Demo request submitted'))},
  'service-detail':v=>{const s=S.services.find(s=>s.id===v);if(!s)return;sheet(U.t('服务详情','Service details')+' #'+s.id,`<p>${U.esc(D.markets.find(m=>m.id===s.marketId)?.question||'')}</p><div style="margin-top:20px">${[[U.t('状态','Status'),U.serviceInfo(s).label],[U.t('担保资金','Collateral'),U.money(s.amount)+' USDC'],[U.t('服务费用','Service fee'),U.money(s.amount*.04)+' USDC'],[U.t('期末可返','End-of-term collateral'),U.money(s.amount*.96)+' USDC']].map(([a,b])=>`<div class="confirm-row"><span>${a}</span><b>${b}</b></div>`).join('')}</div><div class="info-box">${U.t('演示记录，无真实资金交易。','Demo record. No real funds were moved.')}</div><button class="btn secondary block" data-action="close">${U.t('关闭','Close')}</button>`)},
  'service-history':()=>sheet(U.t('服务活动规则','Service activity rules'),`<p>${U.t('每笔服务按“已开始 → 已结束 → 已结算”顺序推进；同一笔服务不能在开始前结束或结算。时间线按事件时间倒序，只展示过去时间。当前三条是不同服务的示例状态。','Each service follows started → ended → settled. End and settlement times cannot precede its start. Activity is ordered newest first and uses past timestamps. The current three entries represent separate example services.')}</p><button class="btn primary block" data-action="close" style="margin-top:20px">${U.t('知道了','Got it')}</button>`),
  chapter:v=>document.getElementById(v)?.scrollIntoView({behavior:'smooth'}),
  maintenance:()=>sheet(U.t('引擎维护中','Engine maintenance'),`<p>${U.t('维护期间暂时无法发起新任务，现有资金与持仓可继续查看。','New tasks are unavailable during maintenance. Existing balances and positions remain visible.')}</p><div class="info-box">${U.badge(U.t('维护中','Maintenance'),'amber')}<p style="margin-top:10px">${U.t('维护期间不可开始新任务，已有任务状态以实际后台为准。','New tasks are unavailable during maintenance. Existing state must follow the backend.')}</p></div><button class="btn secondary block" data-action="close">${U.t('返回','Back')}</button>`)
};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');
  if(el&&!el.disabled){e.preventDefault();(actions[el.dataset.action]||Tokenomics.actions[el.dataset.action]||Account.actions[el.dataset.action])?.(el.dataset.value);return}
  if(e.target.dataset.dismiss)closeOverlay();
  if(e.target.closest('#overlay a[href^="#"]')){const href=e.target.closest('a').getAttribute('href');closeOverlay();if(location.hash===href){route()}}
});
document.addEventListener('input',e=>{
  Tokenomics.onInput(e);Account.onInput(e);
  if(e.target.id==='agent-amount')S.amount=Number(e.target.value);
  if(e.target.id==='service-amount'){const n=Number(e.target.value);document.getElementById('service-fee').textContent=U.money(n*.04);document.getElementById('service-return').textContent=U.money(n*.96);document.getElementById('service-error').textContent=''}
  if(e.target.id==='market-search'){S.search=e.target.value;S.marketPage=0;clearTimeout(window.searchTimer);window.searchTimer=setTimeout(()=>render({preserve:true,focus:'market-search'}),150)}
});
document.addEventListener('change',e=>{if(e.target.id==='book-market'){S.bookMarket=e.target.value;render({preserve:true});document.querySelector('.book-detail')?.setAttribute('open','')}if(e.target.id==='tape-market'){S.tapeMarket=e.target.value;render({preserve:true})}});
document.addEventListener('scroll',updateScroll,true);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeOverlay();
  if(e.key==='Tab'&&document.querySelector('[role="dialog"]')){const dialog=document.querySelector('[role="dialog"]');const nodes=[...dialog.querySelectorAll('button,a,input,select,[tabindex]')].filter(n=>!n.disabled);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();last?.focus()}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog)){e.preventDefault();first?.focus()}}
  if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){const el=document.getElementById('market-search');if(el){e.preventDefault();el.focus()}}
});
window.addEventListener('hashchange',route);
window.addEventListener('scroll',updateScroll,{passive:true});
var mobile=innerWidth<=760;
window.addEventListener('resize',()=>{const next=innerWidth<=760;if(next!==mobile){mobile=next;render({preserve:true})}});
setInterval(()=>{
  for(const s of S.services){const info=U.serviceInfo(s);const clock=document.querySelector('[data-service-clock="'+s.id+'"]');const fill=document.querySelector('[data-service-fill="'+s.id+'"]');if(clock)clock.textContent=info.time;if(fill)fill.style.width=info.progress+'%'}
  const current=U.agentState();const clock=document.getElementById('agent-clock');if(clock){clock.textContent=current.time;const fill=document.querySelector('.my-agent .progress>span');if(fill)fill.style.width=current.progress+'%'}
  if(S.agentState==='running'&&S.elapsed+(Date.now()-S.startedAt)/1000>=28800){S.agentState='cancelling';S.elapsed=0;S.startedAt=Date.now();render({preserve:true})}
  if(S.agentState==='resuming'&&S.elapsed+(Date.now()-S.startedAt)/1000>=600){S.agentState='running';S.elapsed=0;S.startedAt=Date.now();render({preserve:true})}
  if(S.agentState==='cancelling'&&S.elapsed+(Date.now()-S.startedAt)/1000>=14400){S.agentState='stopped';S.elapsed=0;S.startedAt=Date.now();render({preserve:true})}
},1000);
function refreshAutoTheme(){if(S.themeMode==='auto'&&ForeaTheme.resolve('auto')!==S.theme){S.theme=ForeaTheme.apply('auto');render({preserve:true})}}
setInterval(refreshAutoTheme,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAutoTheme()});
for(const [id,interval,base,range] of [['latency',5000,120,70],['queued',15000,62,35],['blocked',10000,30,20]])setInterval(()=>{const el=document.getElementById(id);if(el)el.textContent=Math.round(base+Math.sin(Date.now()/interval)*range)},interval);
document.getElementById('app').innerHTML=`<div class="loading-state">FOREA<div class="skeleton"></div><p>${U.t('正在加载行情…','Loading markets…')}</p></div>`;
fetch('data/market-snapshot.json').then(r=>{if(!r.ok)throw new Error('Snapshot unavailable');return r.json()}).then(data=>{
  D=data;S.bookMarket=D.orderBooks[0].marketId;Tokenomics.ensure();
  if(S.agentState!=='inactive'){S.tokenProjectBalance=875;S.tokenCycleUsed=125;S.tokenConsumptionRecords=[{amount:125,time:Date.now()-3600000}]}

  S.services=params.get('scene')&&params.get('scene')!=='inactive'?[{id:'1042',marketId:D.markets[0].id,status:'active',amount:1500,startedAt:Date.now()-(12*60-392)*60000},{id:'1036',marketId:D.markets[1].id,status:'settled',amount:1000,startedAt:Date.now()-13*3600000}]:[];
  S.records=params.get('scene')&&params.get('scene')!=='inactive'?[{label:'agent-start',amount:-1000,unit:'USDC',time:Date.parse('2026-11-02T02:28:00Z')},{label:'service-apply',amount:-1500,unit:'USDC',time:Date.parse('2026-11-02T00:52:00Z')},{label:'model-use',amount:-125,unit:'ABC',time:Date.parse('2026-11-02T06:32:00Z')}]:[];
  route();
 }).catch(err=>{document.getElementById('app').innerHTML=`<div class="loading-state"><h1>Forea</h1><p>${U.t('行情暂时无法加载，请重试。','Market data could not be loaded. Please try again.')}</p><button class="btn secondary" data-action="reload" style="margin-top:20px">${U.t('重新加载','Reload')}</button></div>`;console.error(err)});
