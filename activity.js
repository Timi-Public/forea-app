/* Read-only public wallet history. Demo fund records are never used as chain activity. */
window.Activity=(()=>{
  const state={address:'',observed:'',preview:false,items:[],status:'idle',cursor:null,visible:5,type:'all',period:'all',search:'',generation:0};
  const types={all:['所有类型','All types'],swap:['兑换','Swap'],sent:['发送','Sent'],received:['接收','Received'],wrap:['封装','Wrap'],unwrap:['解封','Unwrap'],approve:['授权','Approval'],pool_create:['创建资金池','Pool created'],liquidity_add:['添加流动性','Liquidity added'],liquidity_remove:['移除流动性','Liquidity removed'],fee_claim:['领取费用','Fees claimed'],mint:['铸造','Mint'],contract:['合约交互','Contract interaction']};
  const valid=a=>/^0x[0-9a-f]{40}$/i.test(a||'');
  const short=a=>a?a.slice(0,6)+'…'+a.slice(-4):U.t('示例地址','Sample address');
  const label=type=>U.t(...(types[type]||types.contract));
  const status=r=>U.t(...({success:['已上链','Confirmed'],failed:['失败','Failed'],pending:['待确认','Pending']}[r.status]||['待确认','Pending']));
  // Leo 11-05: a swap shows both sides together (−100 USDC / +7,421.88 MAAT); amounts follow contract data once connected.
  const amount=r=>r.amounts?.length?r.amounts.map(a=>`<span class="${a.direction==='in'?'positive':''}">${a.direction==='in'?'+':'−'}${U.esc(Number(a.value).toLocaleString('en-US',{maximumFractionDigits:8}))} <small>${U.esc(a.symbol)}</small></span>`).join(''):'<span class="muted">—</span>';
  const time=r=>U.stamp(r.timestamp);
  // 走查 #62: one icon per activity type, same in the summary and the table.
  const kindIcon=type=>({received:'down',sent:'up',swap:'swap',approve:'shield'})[type]||'history';
  function reset(address=''){state.generation++;Object.assign(state,{address,preview:false,items:[],status:address?'unavailable':'idle',cursor:null,visible:5,type:'all',period:'all',search:''})}
  function identityChanged(){const address=S.walletAddress||'';if(state.observed!==address){state.observed=address;reset(address);if(address&&typeof window.ForeaActivityProvider?.list==='function')queueMicrotask(()=>load())}}
  function ensure(){identityChanged()}
  function example(){
    reset();state.preview=true;state.status='ready';const now=Date.now();
    state.items=[['received',500,'USDC',1],['sent',28,'MAAT',3],['swap',100,'USDC',6],['approve',0,'MAAT',10],['received',250,'MAAT',16],['sent',300,'USDC',28],['liquidity_add',1000,'USDC',48],['wrap',1,'POL',90],['liquidity_remove',200,'USDC',150],['fee_claim',12,'USDC',220],['mint',1,'NFT',400],['contract',0,'',900]].map(([type,value,symbol,hours],i)=>({id:'preview-'+i,timestamp:now-hours*3600000,type,status:'success',amounts:type==='swap'?[{value:String(value),symbol,direction:'out'},{value:(value/(Tokenomics.price||.0128)*.95).toFixed(2),symbol:'MAAT',direction:'in'}]:value?[{value:String(value),symbol,direction:['received','fee_claim','liquidity_remove'].includes(type)?'in':'out'}]:[],counterparty:'',hash:''}));
    render({preserve:true});
  }
  function normalize(records){
    return records.filter(r=>r&&r.chainId===137&&/^0x[0-9a-f]{64}$/i.test(r.hash||'')&&Number.isFinite(new Date(r.timestamp).getTime())).map(r=>({id:r.hash.toLowerCase(),hash:r.hash,timestamp:new Date(r.timestamp).getTime(),type:types[r.type]?r.type:'contract',status:['success','failed','pending'].includes(r.status)?r.status:'pending',counterparty:valid(r.counterparty)?r.counterparty:'',amounts:(r.amounts||[]).filter(a=>/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(String(a.value))&&['in','out'].includes(a.direction)).map(a=>({value:String(a.value),symbol:String(a.symbol||'TOKEN').slice(0,20),direction:a.direction}))}));
  }
  async function load(more=false){
    if(state.status==='loading'||!valid(state.address))return;
    const provider=window.ForeaActivityProvider;
    if(typeof provider?.list!=='function'){state.status='unavailable';render({preserve:true});return}
    const generation=state.generation,address=state.address;state.status='loading';render({preserve:true});
    try{const response=await provider.list({address,chainId:137,cursor:more?state.cursor:null});if(generation!==state.generation||address!==state.address)return;if(!Array.isArray(response.items))throw Error('Invalid history response');const merged=new Map((more?state.items:[]).map(r=>[r.id,r]));for(const r of normalize(response.items))merged.set(r.id,r);state.items=[...merged.values()].sort((a,b)=>b.timestamp-a.timestamp||a.id.localeCompare(b.id));state.cursor=response.nextCursor??null;state.status='ready';state.visible=Math.max(20,state.visible+20)}catch{if(generation===state.generation)state.status='error'}
    if(generation===state.generation)render({preserve:true});
  }
  function filtered(){const q=state.search.trim().toLowerCase(),since=state.period==='all'?0:Date.now()-Number(state.period)*86400000;return [...state.items].sort((a,b)=>b.timestamp-a.timestamp).filter(r=>(state.type==='all'||r.type===state.type)&&r.timestamp>=since&&(!q||(label(r.type)+' '+r.hash+' '+r.counterparty+' '+(r.amounts||[]).map(a=>a.symbol).join(' ')).toLowerCase().includes(q)))}
  function empty(){
    const {t}=U;
    if(state.status==='loading')return `<div class="activity-empty">${icon('refresh','accent',23)}<p>${t('正在读取钱包活动…','Loading wallet activity…')}</p></div>`;
    // 走查 #58: no history source is wired yet, so 'unavailable' is a calm empty state (no retry that can never succeed).
    if(state.status==='unavailable')return `<div class="activity-empty">${icon('history','',25)}<p>${t('暂无活动记录','No activity yet')}</p><div class="row">${valid(state.address)?`<a class="text-link" href="https://polygonscan.com/address/${state.address}" target="_blank" rel="noopener noreferrer">${t('在 PolygonScan 查看','View on PolygonScan')} ${icon('external','',12)}</a>`:''}</div></div>`;
    if(state.status==='error')return `<div class="activity-empty">${icon('history','',25)}<p>${t('暂时无法读取钱包活动','Wallet activity is currently unavailable')}</p><div class="row"><button class="text-link" data-action="activity-retry">${t('重试','Retry')}</button>${valid(state.address)?`<a class="text-link" href="https://polygonscan.com/address/${state.address}" target="_blank" rel="noopener noreferrer">PolygonScan ${icon('external','',12)}</a>`:''}</div></div>`;
    return `<div class="activity-empty">${icon('history','',25)}<p>${t('暂无公开活动','No public activity')}</p><button class="text-link" data-action="activity-preview">${t('查看示例','View sample')}</button></div>`;
  }
  function previewNote(){return state.preview?`<div class="activity-preview-note">${U.t('示例数据','Sample data')}<button data-action="activity-exit-preview">${U.t('退出','Exit')}</button></div>`:''}
  function summary(){
    ensure();const {t}=U,list=[...state.items].sort((a,b)=>b.timestamp-a.timestamp).slice(0,5);
    return `<article class="panel activity-summary"><div class="panel-head"><h2>Activity</h2><a class="text-link" href="#account/activity">${t('查看全部','View all')}${icon('chevron','',13)}</a></div>${previewNote()}${list.length?list.map(r=>`<div class="activity-row"><span class="activity-kind">${icon(kindIcon(r.type),'',20)}</span><div class="activity-row-copy"><b>${label(r.type)}</b><small>${time(r)} UTC+8 · ${state.preview?t('示例','Sample'):status(r)}</small></div><div class="activity-amount">${Account.assetsHidden()?'••••':amount(r)}</div>${r.hash?`<a class="activity-explorer" href="https://polygonscan.com/tx/${U.esc(r.hash)}" target="_blank" rel="noopener noreferrer" aria-label="${t('在区块浏览器查看','View on block explorer')}">${icon('external','',15)}</a>`:`<span class="activity-explorer" aria-hidden="true">${icon('external','',15)}</span>`}</div>`).join(''):empty()}<div class="activity-source">${state.preview?t('不计入资产','Not counted in balances'):t('Polygon · 钱包公开活动','Polygon · Public wallet activity')}</div></article>`;
  }
  function page(){
    ensure();const {t,esc}=U,list=filtered(),rows=state.preview?list.slice(0,state.visible):list;
    return `<section data-screen-label="Wallet activity"><div class="profile-page-heading"><a class="icon-btn" href="#account" aria-label="${t('返回账户','Back to account')}">${icon('chevron','back-icon',21)}</a><h1>${t('资金活动记录','Wallet activity')}</h1></div>${previewNote()}<div class="activity-filters"><label><span class="sr-only">${t('活动类型','Activity type')}</span><select id="activity-type">${Object.keys(types).map(type=>`<option value="${type}" ${state.type===type?'selected':''}>${label(type)}</option>`).join('')}</select></label><label><span class="sr-only">${t('时间范围','Time range')}</span><select id="activity-period">${[['all',t('全部时间','All time')],['1',t('24小时','24 hours')],['7',t('7天','7 days')],['30',t('30天','30 days')]].map(([v,l])=>`<option value="${v}" ${state.period===v?'selected':''}>${l}</option>`).join('')}</select></label></div><div class="activity-search">${icon('search','muted',17)}<input id="activity-search" type="search" placeholder="${t('搜索活动、代币或交易哈希','Search activity, token or hash')}" value="${esc(state.search)}"></div><div class="activity-swipe">${icon('chevron','back-icon',13)}${t('向左滑动查看更多','Swipe left to see more')}</div><div class="activity-scroll" role="region" tabindex="0" aria-label="${t('可横向滚动的活动记录','Horizontally scrollable activity table')}"><table class="activity-table"><thead><tr>${[t('时间（UTC+8）','Time (UTC+8)'),t('类型','Type'),t('金额','Amount'),t('地址','Address'),t('状态','Status'),t('链上记录','Explorer')].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td>${time(r)}</td><td><span class="row">${icon(kindIcon(r.type),'',16)}${label(r.type)}</span></td><td><div class="activity-amount">${Account.assetsHidden()?'••••':amount(r)}</div></td><td>${r.counterparty?`<a href="https://polygonscan.com/address/${r.counterparty}" target="_blank" rel="noopener noreferrer">${short(r.counterparty)} ${icon('external','',11)}</a>`:t('示例地址','Sample address')}</td><td><span class="activity-status ${r.status==='failed'?'negative':r.status==='pending'?'amber':''}">${state.preview?t('示例','Sample'):status(r)}</span></td><td>${r.hash?`<a href="https://polygonscan.com/tx/${r.hash}" target="_blank" rel="noopener noreferrer">${short(r.hash)} ${icon('external','',12)}</a>`:'—'}</td></tr>`).join('')}</tbody></table></div>${!rows.length?(state.items.length?`<div class="activity-empty"><p>${t('没有符合筛选条件的活动','No activity matches these filters')}</p><button class="text-link" data-action="activity-clear">${t('清除筛选','Clear filters')}</button></div>`:empty()):''}<div class="activity-list-footer"><span>${t('已显示','Showing')} ${rows.length} ${t('条','records')}</span>${(state.preview&&list.length>state.visible)||(!state.preview&&state.cursor)?`<button class="btn secondary small" data-action="activity-more" ${state.status==='loading'?'disabled':''}>${t('加载更多','Load more')}</button>`:''}</div>${!state.preview?`<button class="text-link activity-preview-entry" data-action="activity-preview">${t('查看示例','View sample')}</button>`:''}</section>`;
  }
  const actions={
    'activity-preview':()=>{example()},
    'activity-exit-preview':()=>{reset(S.walletAddress||'');render({preserve:true})},
    'activity-retry':()=>load(),
    'activity-more':()=>{if(state.preview){state.visible+=5;render({preserve:true})}else load(true)},
    'activity-clear':()=>{state.type='all';state.period='all';state.search='';state.visible=5;render({preserve:true})}
  };
  function onInput(e){if(e.target.id==='activity-search'){state.search=e.target.value;clearTimeout(window.activitySearchTimer);window.activitySearchTimer=setTimeout(()=>render({preserve:true,focus:'activity-search'}),120)}}
  function onChange(e){if(e.target.id==='activity-type'){state.type=e.target.value;state.visible=5;render({preserve:true})}if(e.target.id==='activity-period'){state.period=e.target.value;state.visible=5;render({preserve:true})}}
  return {state,summary,page,actions,onInput,onChange,identityChanged,load,normalize,filtered};
})();
