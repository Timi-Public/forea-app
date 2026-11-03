/* Tokenomics presentation and demo-only interactions. No wallet approvals or transfers. */
window.Tokenomics=(()=>{
  const initialSupply=21000000;
  const demoRate=.0128;
  const demoImpact=.0012;
  const demoChartEnd=Date.UTC(2026,10,2,0,0);
  let pendingDeposit=false,pendingSwap=null;
  const ranges={
    '24H':[.0108,.011,.0106,.0112,.0118,.0115,.0119,.0123,.012,.0127,.0125,.0128],
    '7D':[.0098,.0103,.0097,.0105,.0102,.011,.0107,.0118,.0114,.0122,.012,.0128],
    '30D':[.009,.0088,.0096,.0101,.0095,.0102,.0109,.0106,.0117,.0122,.0118,.0128],
    'ALL':[.01,.0094,.0098,.0088,.0096,.0103,.01,.0113,.0108,.0118,.0124,.0128]
  };
  const allocations=[
    {zh:'生态激励',en:'Ecosystem',pct:40,color:'var(--accent)',releaseZh:'48 个月线性释放',releaseEn:'Linear over 48 months'},
    {zh:'流动性',en:'Liquidity',pct:25,color:'oklch(68% .11 175)',releaseZh:'上线时分批配置',releaseEn:'Allocated in stages at launch'},
    {zh:'团队',en:'Team',pct:20,color:'oklch(72% .09 230)',releaseZh:'锁定 12 个月，36 个月释放',releaseEn:'12-month cliff, 36-month vesting'},
    {zh:'储备',en:'Reserve',pct:15,color:'oklch(80% .08 90)',releaseZh:'按治理决议释放',releaseEn:'Released through governance'}
  ];
  function ensure(){
    if(!Number.isFinite(S.tokenWalletBalance))S.tokenWalletBalance=1000;
    if(!Number.isFinite(S.tokenProjectBalance))S.tokenProjectBalance=0;
    if(S.tokenSwapAmount===undefined)S.tokenSwapAmount=25;
    if(!Number.isFinite(S.tokenSlippage))S.tokenSlippage=.5;
    if(!S.tokenRange)S.tokenRange='24H';
    if(!S.tokenHistoryTab)S.tokenHistoryTab='burn';
    if(!Array.isArray(S.tokenConsumptionRecords))S.tokenConsumptionRecords=[];
  }
  const tokenMark=()=>`<span class="tk-mark">${icon('spark','',23)}</span>`;
  const demo=()=>`<span class="demo-tag">${U.t('演示','DEMO')}</span>`;
  function historyLabel(index){
    const days=({'24H':1,'7D':7,'30D':30,'ALL':90})[S.tokenRange];
    const date=new Date(demoChartEnd-days*86400000*(11-index)/11);
    return date.toLocaleString('en-GB',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'})+' UTC';
  }
  function chart(){
    const values=ranges[S.tokenRange],min=Math.min(...values)-.0005,max=Math.max(...values)+.0005;
    const points=values.map((v,i)=>[8+i*304/11,136-(v-min)/(max-min)*113]);
    const line=points.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const selected=Number.isInteger(S.tokenChartPoint)?S.tokenChartPoint:values.length-1;
    const p=points[selected]||points.at(-1);
    return `<div class="tk-chart-caption"><span id="token-chart-time">${historyLabel(selected)}</span><span id="token-chart-price">${U.money(values[selected]||values.at(-1),false,4)} USDC</span>${demo()}</div><div class="tk-chart" role="group" aria-label="${U.t('演示历史价格，滑动查看','Demo price history, slide to inspect')}"><svg viewBox="0 0 320 150" preserveAspectRatio="none" aria-hidden="true"><path d="M8 29H312M8 82H312M8 136H312" class="tk-chart-grid"></path><path d="M${line.replaceAll(' ',' L')} L312 150 L8 150Z" class="tk-chart-area"></path><polyline points="${line}" class="tk-chart-line"></polyline><line id="token-chart-guide" x1="${p[0]}" x2="${p[0]}" y1="8" y2="150" class="tk-chart-guide"></line><circle id="token-chart-dot" cx="${p[0]}" cy="${p[1]}" r="4" class="tk-chart-dot"></circle></svg><input id="token-chart-cursor" type="range" min="0" max="11" step="1" value="${selected}" aria-label="${U.t('查看历史价格','Inspect historical price')}"></div><div class="tk-range" role="tablist" aria-label="${U.t('价格时间范围','Price time range')}">${Object.keys(ranges).map(r=>`<button role="tab" aria-selected="${r===S.tokenRange}" class="${r===S.tokenRange?'active':''}" data-action="token-range" data-value="${r}">${r}</button>`).join('')}</div>`;
  }
  function marketCard(){
    const {t}=U;
    return `<article class="panel tk-market"><div class="tk-market-heading"><div class="row">${tokenMark()}<div><h2>${t('项目代币','Project token')} <span class="tk-symbol">ABC</span></h2></div></div><span class="tk-network">${icon('cube','',13)} Polygon</span></div><div class="tk-prices"><div><span class="label">${t('发行价格','Issue price')}</span><strong>— <small>USDC</small></strong></div><div><span class="label">${t('当前价格','Current price')}</span><strong>— <small>USDC</small></strong></div></div>${chart()}<div class="tk-market-source"><span>${t('数据来源','Source')} <a href="https://app.uniswap.org/" target="_blank" rel="noopener noreferrer">Uniswap ${icon('external','',10)}</a> · ${t('行情未发布','Market data unavailable')}</span><time>${t('更新','Updated')} —</time></div></article>`;
  }
  function metrics(){
    const {t}=U;
    return `<div class="tk-metrics">${[[t('流通市值','Circulating market cap'),'USDC'],[t('24H 成交额','24H volume'),'USDC'],[t('流通供应量','Circulating supply'),'ABC'],[t('流动性池规模','Pool liquidity'),'USDC'],[t('当前总供应量','Total supply'),'ABC'],[t('累计销毁量','Total burned'),'ABC']].map(([label,unit])=>`<article class="panel tk-metric"><span class="label">${label}</span><strong>—</strong><small>${unit}</small></article>`).join('')}</div>`;
  }
  function quote(){
    ensure();
    const n=Number(S.tokenSwapAmount),reverse=!!S.tokenSwapReverse;
    const balance=reverse?S.tokenWalletBalance:S.walletBalance;
    const withinBalance=Number.isFinite(n)&&Number.isFinite(balance)&&n>0&&n<balance;
    // Demo assumptions: ABC incurs a 5% token tax on both buy and sell.
    // Buy: USDC -> ABC after price impact -> token tax. Sell: token tax -> USDC after price impact.
    const amount=Number.isFinite(n)&&n>0?n:0;
    const taxableTokens=reverse?amount:amount/demoRate*(1-demoImpact);
    const tax=taxableTokens*.05,output=reverse?(amount-tax)*demoRate*(1-demoImpact):taxableTokens-tax;
    const minimum=output*(1-S.tokenSlippage/100);
    const valid=withinBalance&&Number.isFinite(output)&&Number.isFinite(tax)&&Number.isFinite(minimum);
    return {n,reverse,balance,valid,tax,output,minimum,taxUnit:'ABC',from:reverse?'ABC':'USDC',to:reverse?'USDC':'ABC'};
  }
  function swapMarkup(){
    ensure();const {t,money}=U,q=quote();
    const message=q.n>=q.balance?t('输入金额须小于钱包余额','Amount must be less than wallet balance'):q.n<0?t('请输入有效金额','Enter a valid amount'):'';
    return `<article class="panel tk-swap"><div class="panel-head"><h2>Quick Swap</h2><span class="tk-via">Uniswap · Polygon</span></div><div class="tk-swap-box"><div class="between label"><label for="token-swap-amount">${t('支付','You pay')}</label><span>${t('余额','Balance')} <span id="token-swap-balance">${money(q.balance)}</span></span></div><div class="tk-swap-value"><input id="token-swap-amount" type="number" inputmode="decimal" min="0" step="any" value="${S.tokenSwapAmount||''}" placeholder="0.00" aria-describedby="token-swap-error"><span class="tk-token-chip"><span class="token ${q.reverse?'':'usdc'}">${q.reverse?icon('spark','',14):'$'}</span>${q.from}</span></div></div><div class="tk-swap-switch"><button data-action="token-reverse" aria-label="${t('切换兑换方向','Reverse swap direction')}">${icon('swap','',21)}</button></div><div class="tk-swap-box"><div class="between label"><span>${t('预计获得','You receive')}</span><span>${t('余额','Balance')} ${money(q.reverse?S.walletBalance:S.tokenWalletBalance)}</span></div><div class="tk-swap-value"><strong id="token-swap-output">${money(q.output)}</strong><span class="tk-token-chip"><span class="token ${q.reverse?'usdc':''}">${q.reverse?'$':icon('spark','',14)}</span>${q.to}</span></div></div><p id="token-swap-error" class="field-error" role="status">${message}</p><div class="tk-swap-details"><div><span>${t('兑换率','Rate')}</span><b>1 ABC = 0.0128 USDC</b></div><div><span>${t('ABC 交易税','ABC transaction tax')}</span><b>5% <span id="token-swap-tax">(${money(q.tax)} ABC)</span></b></div><div><span>${t('价格影响','Price impact')}</span><b>0.12%</b></div><div><span>${t('最少获得','Minimum received')}</span><b id="token-swap-minimum">${money(q.minimum)} ${q.to}</b></div><div><span>${t('预计网络费','Estimated network fee')}</span><b>0.02 POL</b></div><div><span>${t('滑点容忍度','Slippage tolerance')}</span><button data-action="token-slippage">${S.tokenSlippage}% ${icon('settings','',12)}</button></div></div><button id="token-swap-submit" class="btn primary block" data-action="token-swap-review" ${q.valid?'':'disabled'}>${t('预览兑换','Preview swap')}${icon('arrow','',14)}</button><p class="tk-demo-note">${t('演示报价，不发起真实交易。','Demo quote. No real transaction is submitted.')}</p></article>`;
  }
  function consumption(){
    const {t,money}=U;
    return `<article class="panel tk-consumption"><div class="panel-head"><h2>Agent Token Consumption</h2>${demo()}</div><div class="tk-balance-row"><span>${t('我的 ABC 钱包余额','My ABC wallet balance')}</span><div><b>${money(S.tokenWalletBalance)} <small>ABC</small></b><button class="text-link" data-action="token-deposit">${t('充值','Deposit')}${icon('arrow','',12)}</button></div></div><div class="tk-balance-row"><span>${t('我的 ABC 项目余额','My ABC project balance')}</span><b>${money(S.tokenProjectBalance)} <small>ABC</small></b></div><button class="tk-full-link" data-action="token-consumption-details"><span>${t('查看 Agent 消耗详情','View Agent consumption')}</span>${icon('arrow','',15)}</button></article>`;
  }
  function buyback(){
    const {t}=U,isBurn=S.tokenHistoryTab==='burn';
    return `<article class="panel tk-burn"><div class="panel-head"><h2>Buyback &amp; Burn</h2>${icon('leaf','',20)}</div><div class="tk-burn-metrics"><div><span class="label">${t('初始发行总量','Initial supply')}</span><strong>21,000,000</strong><small>ABC</small></div><div><span class="label">${t('累计销毁数量','Total burned')}</span><strong>—</strong><small>ABC</small></div><div><span class="label">${t('当前总供应量','Current total supply')}</span><strong>—</strong><small>ABC</small></div></div><div class="tk-supply-label"><span>${t('当前供应量 / 累计销毁比例','Supply / Burned ratio')}</span><span>—</span></div><div class="tk-supply-track" aria-label="${t('销毁比例暂无数据','Burn ratio unavailable')}"></div><div class="tk-supply-label" data-row="buyback-source"><span>${t('回购资金来源','Buyback funding')}</span><span>${t(`Agent 托管费的 ${Math.round(U.custody.buyback*100)}%`,`${Math.round(U.custody.buyback*100)}% of agent custody fees`)}</span></div><div class="tk-history-tabs" role="tablist">${[['burn',t('最近销毁记录','Recent burns')],['buyback',t('最近回购记录','Recent buybacks')]].map(([id,label])=>`<button role="tab" aria-selected="${S.tokenHistoryTab===id}" class="${S.tokenHistoryTab===id?'active':''}" data-action="token-history" data-value="${id}">${label}</button>`).join('')}</div><div class="tk-history-columns"><span>${isBurn?t('销毁时间','Burn time'):t('回购时间','Buyback time')}</span><span>${t('数量 / 来源','Amount / Source')}</span><span>${t('链上记录','Explorer')}</span></div><div class="tk-history-empty">${icon('history','',24)}<span>${t('尚无链上数据','No onchain data available')}</span></div></article>`;
  }
  function allocation(){
    const {t,money}=U;
    let at=0;const stops=allocations.map(x=>{const s=`${x.color} ${at}% ${at+x.pct}%`;at+=x.pct;return s}).join(',');
    return `<article class="panel tk-allocation"><div class="panel-head"><h2>Token Allocation</h2>${demo()}</div><div class="tk-allocation-summary"><div class="tk-donut" style="background:conic-gradient(${stops})" role="img" aria-label="${allocations.map(x=>`${t(x.zh,x.en)} ${x.pct}%`).join(', ')}"><div><strong>21M</strong><small>ABC</small></div></div><div class="tk-legend">${allocations.map(x=>`<div><span><i style="background:${x.color}"></i>${t(x.zh,x.en)}</span><b>${x.pct}%</b></div>`).join('')}</div></div><div class="tk-release-head"><h3>${t('代币释放计划','Token release schedule')}</h3><span class="tiny muted">${t('演示方案','Illustrative plan')}</span></div><div class="tk-release-list">${allocations.map(x=>`<div class="tk-release-row"><div><span><i style="background:${x.color}"></i>${t(x.zh,x.en)}</span><b>${money(initialSupply*x.pct/100,false,0)} ABC</b></div><p>${t(x.releaseZh,x.releaseEn)}</p></div>`).join('')}</div></article>`;
  }
  function security(){
    const {t}=U;
    return `<article class="panel tk-security"><div class="panel-head"><h2>Contract &amp; Security</h2>${icon('shield','',20)}</div><dl><div><dt>${t('所属公链','Network')}</dt><dd>Polygon</dd></div><div class="tk-contract-row"><dt>${t('代币合约','Token contract')}</dt><dd><span>${t('尚未公布','Not announced')}</span><button class="icon-btn" disabled aria-label="${t('复制代币合约','Copy token contract')}">${icon('copy','',16)}</button></dd></div><div><dt>${t('合约验证','Source verification')}</dt><dd class="muted">${t('待确认','To be confirmed')}</dd></div><div><dt>${t('合约权限','Contract ownership')}</dt><dd class="muted">${t('待确认','To be confirmed')}</dd></div><div><dt>${t('安全审计','Security audit')}</dt><dd class="muted">${t('待确认','To be confirmed')}</dd></div></dl><div class="tk-audit-label">${t('审计报告','Audit report')}</div><div class="tk-audit-actions"><button class="btn secondary" disabled>${icon('book','',14)}${t('查看 PDF','View PDF')}</button><button class="btn secondary" disabled>${icon('external','',14)}${t('审计网址','Audit website')}</button></div><button class="tk-full-link" disabled><span>${t('在区块浏览器查看','View on block explorer')}</span>${icon('external','',15)}</button></article>`;
  }
  function renderPage(){
    ensure();
    return `<section class="tk-page" data-screen-label="Tokenomics"><div class="tk-page-title"><h1>Tokenomics</h1>${icon('layers','accent',24)}</div><div class="tk-stack">${marketCard()}${metrics()}${swapMarkup()}${consumption()}${buyback()}${allocation()}${security()}</div></section>`;
  }
  function deposit(){
    ensure();const {t,money}=U;
    pendingDeposit=true;
    sheet(t('充值 ABC','Deposit ABC'),`<div class="confirm-row"><span>${t('钱包余额','Wallet balance')}</span><b>${money(S.tokenWalletBalance)} ABC</b></div><div class="confirm-row"><span>${t('项目余额','Project balance')}</span><b>${money(S.tokenProjectBalance)} ABC</b></div><label class="field-label" for="token-deposit-amount">${t('充值数量','Amount')}</label><div class="amount-field"><input id="token-deposit-amount" type="number" inputmode="decimal" min="0" step="any" placeholder="0.00" value="${Math.min(100,S.tokenWalletBalance)||''}"><span>ABC</span></div><p id="token-deposit-error" class="field-error" role="status"></p><p class="tk-deposit-note">${t('Agent 从项目余额中扣除消耗。本次充值为演示。','Agent usage is deducted from your project balance. This deposit is a demo.')}</p><button class="btn primary block" data-action="token-deposit-confirm">${t('确认充值','Confirm deposit')}</button>`,'sheet','token-deposit');
  }
  function confirmDeposit(){
    if(!pendingDeposit||S.overlay!=='token-deposit')return;
    const input=document.getElementById('token-deposit-amount');if(!input)return;
    const n=Number(input.value),{t}=U;
    if(!Number.isFinite(n)||n<=0||n>S.tokenWalletBalance){const error=document.getElementById('token-deposit-error');if(error)error.textContent=t('请输入不超过钱包余额的有效数量','Enter an amount within your wallet balance');return}
    pendingDeposit=false;
    S.tokenWalletBalance=Number((S.tokenWalletBalance-n).toFixed(8));S.tokenProjectBalance=Number((S.tokenProjectBalance+n).toFixed(8));
    U.record('token-deposit',n,'ABC');closeOverlay();render({preserve:true});toast(t('已充值到项目余额（演示）','Deposited to project balance (demo)'));
  }
  function swapReview(){
    const q=quote(),{t,money}=U;if(!q.valid)return;
    pendingSwap={...q,account:S.account};
    sheet(t('确认兑换','Review swap'),`<div class="tk-swap-confirm"><strong>${money(q.n)} ${q.from}</strong>${icon('down','accent',23)}<strong>${money(q.output)} ${q.to}</strong></div><div class="confirm-row"><span>${t('ABC 交易税','ABC transaction tax')}</span><b>5% · ${money(q.tax)} ABC</b></div><div class="confirm-row"><span>${t('价格影响','Price impact')}</span><b>0.12%</b></div><div class="confirm-row"><span>${t('最少获得','Minimum received')}</span><b>${money(q.minimum)} ${q.to}</b></div><div class="confirm-row"><span>${t('预计网络费','Estimated network fee')}</span><b>0.02 POL</b></div><div class="info-box">${t('演示按 ABC 扣除 5% 交易税，预计获得已计入价格影响。网络费以 POL 单独支付，不发起真实交易。','The demo deducts a 5% ABC tax and includes price impact in the quote. Network fees are paid separately in POL. No real transaction is submitted.')}</div><button class="btn primary block" data-action="token-swap-confirm">${t('演示兑换','Simulate swap')}</button>`,'sheet','token-swap');
  }
  function swapConfirm(){
    if(!pendingSwap||S.overlay!=='token-swap')return;
    const q=quote();if(!q.valid||pendingSwap.account!==S.account||pendingSwap.n!==q.n||pendingSwap.reverse!==q.reverse||pendingSwap.output!==q.output)return;
    pendingSwap=null;
    if(q.reverse){S.tokenWalletBalance-=q.n;S.walletBalance+=q.output}else{S.walletBalance-=q.n;S.tokenWalletBalance+=q.output}
    S.walletBalance=Number(S.walletBalance.toFixed(8));S.tokenWalletBalance=Number(S.tokenWalletBalance.toFixed(8));
    U.record('swap',-q.n,q.from);closeOverlay();render({preserve:true});toast(U.t('兑换完成（演示）','Swap completed (demo)'));
  }
  function updateQuote(){
    const q=quote(),{t,money}=U;
    const output=document.getElementById('token-swap-output');if(output)output.textContent=money(q.output);
    const tax=document.getElementById('token-swap-tax');if(tax)tax.textContent=`(${money(q.tax)} ABC)`;
    const minimum=document.getElementById('token-swap-minimum');if(minimum)minimum.textContent=`${money(q.minimum)} ${q.to}`;
    const error=document.getElementById('token-swap-error');if(error)error.textContent=q.n>=q.balance?t('输入金额须小于钱包余额','Amount must be less than wallet balance'):q.n<0?t('请输入有效金额','Enter a valid amount'):'';
    const submit=document.getElementById('token-swap-submit');if(submit)submit.disabled=!q.valid;
  }
  function onInput(e){
    if(e.target.id==='token-swap-amount'){S.tokenSwapAmount=Number(e.target.value);updateQuote()}
    if(e.target.id==='token-deposit-amount'){const error=document.getElementById('token-deposit-error');if(error)error.textContent=''}
    if(e.target.id==='token-chart-cursor'){
      const i=Number(e.target.value);S.tokenChartPoint=i;const values=ranges[S.tokenRange],min=Math.min(...values)-.0005,max=Math.max(...values)+.0005,x=8+i*304/11,y=136-(values[i]-min)/(max-min)*113;
      document.getElementById('token-chart-time').textContent=historyLabel(i);document.getElementById('token-chart-price').textContent=U.money(values[i],false,4)+' USDC';
      const guide=document.getElementById('token-chart-guide');guide?.setAttribute('x1',x);guide?.setAttribute('x2',x);const dot=document.getElementById('token-chart-dot');dot?.setAttribute('cx',x);dot?.setAttribute('cy',y);
    }
  }
  const actions={
    'token-range':range=>{if(!ranges[range])return;S.tokenRange=range;S.tokenChartPoint=11;render({preserve:true})},
    'token-history':tab=>{if(!['burn','buyback'].includes(tab))return;S.tokenHistoryTab=tab;render({preserve:true})},
    'token-reverse':()=>{S.tokenSwapReverse=!S.tokenSwapReverse;S.tokenSwapAmount=0;render({preserve:true});document.getElementById('token-swap-amount')?.focus({preventScroll:true})},
    'token-slippage':()=>sheet(U.t('滑点容忍度','Slippage tolerance'),`<div class="tk-slippage">${[.1,.5,1].map(x=>`<button class="btn ${S.tokenSlippage===x?'primary':'secondary'}" data-action="token-set-slippage" data-value="${x}">${x}%</button>`).join('')}</div>`),
    'token-set-slippage':value=>{if(![.1,.5,1].includes(Number(value)))return;S.tokenSlippage=Number(value);closeOverlay();render({preserve:true})},
    'token-swap-review':swapReview,'token-swap-confirm':swapConfirm,'token-deposit':deposit,'token-deposit-confirm':confirmDeposit,
    'token-consumption-details':()=>{location.hash='account/consumption'}
  };
  return {render:renderPage,swapMarkup,actions,onInput,ensure,quote,tokenValue:amount=>amount*demoRate};
})();
