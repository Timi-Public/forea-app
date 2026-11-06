/* Local profile editing. Optional contact details stay on this device. */
window.Account=(()=>{
  const key=()=> 'forea-profile-'+(S.walletAddress?.toLowerCase()||'guest');
  const palette=[['#edb45e','#996432'],['#92cbb8','#356d68'],['#a8b8e5','#586baf'],['#d5a8ca','#925d8b'],['#a7c77a','#5b783f'],['#c5b2e2','#7960a5'],['#e2a397','#a86151'],['#99c7df','#447c99']];
  let draft=null,draftKey='';
  // 002 rules: the avatar is assigned at random from the library and cannot be changed (fixed per wallet);
  // the nickname can change once per calendar month.
  const fixedAvatar=()=>S.walletAddress?Math.floor(Engine.hash(S.walletAddress.toLowerCase())*24):0;
  const monthKey=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  function profile(){
    try{const p=JSON.parse(localStorage.getItem(key())||'{}');return {nickname:String(p.nickname||U.brand+' Explorer').slice(0,24),phone:String(p.phone||'').slice(0,24),avatar:fixedAvatar(),nickMonth:String(p.nickMonth||'')}}catch{return {nickname:U.brand+' Explorer',phone:'',avatar:fixedAvatar(),nickMonth:''}}
  }
  function avatar(seed=profile().avatar){
    const [bg,ink]=palette[seed%palette.length],style=Math.floor(seed/8)%3;
    const face=style===0?`<path d="M6 13 3 4l10 6h6l10-6-3 11v10c-4 7-16 7-20 0Z" fill="${ink}"/><path d="m8 18 8 6 8-6v9c-4 4-12 4-16 0Z" fill="#f8e5ce"/><path d="m8 15 5 2-3 3m14-5-5 2 3 3" fill="#29382f"/><path d="m14 23 2 2 2-2" stroke="#29382f" stroke-width="2"/>`:style===1?`<rect x="5" y="9" width="22" height="19" rx="7" fill="${ink}"/><path d="M16 3v6M12 4h8" stroke="#f4f8f4" stroke-width="2"/><rect x="8" y="13" width="16" height="8" rx="4" fill="#e7f3ef"/><path d="M12 15v3m8-3v3M12 25h8" stroke="#29382f" stroke-width="2" stroke-linecap="round"/>`:`<path d="M5 13 8 4l7 6h2l7-6 3 9v11c-4 8-18 8-22 0Z" fill="${ink}"/><circle cx="11" cy="18" r="5" fill="#f0efdb"/><circle cx="21" cy="18" r="5" fill="#f0efdb"/><circle cx="12" cy="18" r="2" fill="#29382f"/><circle cx="20" cy="18" r="2" fill="#29382f"/><path d="m14 25 2-4 2 4Z" fill="#e7b150"/>`;
    return `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="16" fill="${bg}"/>${face}</svg>`;
  }
  function card(){const p=profile(),{t,esc}=U;return `<article class="panel personal-card"><div class="panel-head"><h1>Account</h1></div><a class="personal-link" href="#account/profile"><span class="personal-avatar">${avatar()}</span><div class="personal-summary"><div class="personal-name"><b>${esc(p.nickname)}</b>${p.phone?`<span>· ${esc(p.phone)}</span>`:''}</div><p>${S.walletAddress?U.esc(U.address()):t('访客','Guest')}</p><span class="personal-network">${icon('cube','',12)} Polygon <span>· ${S.connected?t('已连接','Connected'):t('未连接','Not connected')}</span></span></div>${icon('chevron','muted',17)}</a></article>`}
  function assetSummary(){
    Tokenomics.ensure();
    const walletUSDC=S.walletBalance,walletABC=S.tokenWalletBalance,projectABC=S.tokenProjectBalance;
    const agentUSDC=U.performance().cashBalance;
    const liquidityUSDC=S.services.filter(s=>!s.withdrawn).reduce((sum,s)=>{const info=U.serviceInfo(s);return sum+(info.status==='settled'?info.claimable:s.amount)},0);
    const walletValue=walletUSDC+Tokenomics.tokenValue(walletABC),projectValue=agentUSDC+liquidityUSDC+Tokenomics.tokenValue(projectABC);
    return {walletUSDC,walletABC,projectABC,agentUSDC,liquidityUSDC,walletValue,projectValue,total:walletValue+projectValue};
  }
  function assetsHidden(){try{return localStorage.getItem('forea-hide-assets')==='true'}catch{return !!S.hideAssets}}
  function portfolio(){
    const {t,money}=U,a=assetSummary(),hidden=assetsHidden();
    const value=(n,unit='USDC')=>hidden?'<span class="asset-mask">••••</span>':money(n)+' <small>'+unit+'</small>';
    const estimate=n=>hidden?'<span class="asset-mask">••••</span>':money(n);
    return `<article class="panel portfolio-card" data-card="my-portfolio"><div class="panel-head"><h2>My Portfolio</h2><button class="icon-btn" data-action="toggle-assets" aria-label="${hidden?t('显示资产','Show balances'):t('隐藏资产','Hide balances')}" aria-pressed="${hidden}">${icon(hidden?'eye-off':'eye','',19)}</button></div><div class="portfolio-total"><span class="label">${t('账户总资产估值','Total account value')}</span><strong>${estimate(a.total)}<small>USDC</small></strong></div><div class="portfolio-group"><div class="portfolio-group-head"><h3>${t('钱包资产','Wallet assets')}</h3><b>${value(a.walletValue)}</b></div><div class="portfolio-line"><span>USDC</span><b>${value(a.walletUSDC)}</b></div><div class="portfolio-line"><span>MAAT</span><b>${value(a.walletABC,'MAAT')}</b></div></div><div class="portfolio-group"><div class="portfolio-group-head"><h3>${t('合约中资产','In contracts')}</h3><b>${value(a.projectValue)}</b></div><div class="portfolio-line"><span>${t('Agent Trading 资金','Agent Trading funds')}</span><b>${value(a.agentUSDC)}</b></div><div class="portfolio-line"><span>${t('流动性服务锁定资金','Liquidity service locked funds')}</span><b>${value(a.liquidityUSDC)}</b></div><div class="portfolio-line"><span>MAAT</span><b>${value(a.projectABC,'MAAT')}</b></div></div></article>`;
  }
  function renderProfile(){
    const {t,esc}=U;if(!draft||draftKey!==key()){draft=profile();draftKey=key()}
    return `<section class="profile-page" data-screen-label="Personal profile"><div class="profile-page-heading"><a class="icon-btn" href="#account" aria-label="${t('返回账户','Back to account')}">${icon('chevron','back-icon',21)}</a><h1>${t('个人资料','Profile')}</h1></div><article class="panel profile-form"><div class="profile-avatar-editor"><span id="profile-avatar" class="personal-avatar large">${avatar(draft.avatar)}</span></div><label class="field-label" for="profile-nickname">${t('昵称','Nickname')}</label><input class="profile-input" id="profile-nickname" type="text" maxlength="24" value="${esc(draft.nickname)}" autocomplete="nickname" ${draft.nickMonth===monthKey()?'disabled':''}><p class="tiny muted profile-hint" data-row="nickname-rule">${draft.nickMonth===monthKey()?t(`本月已修改，下次可修改：${(()=>{const d=new Date();d.setMonth(d.getMonth()+1,1);return String(d.getMonth()+1).padStart(2,'0')+'-01'})()}`,'Changed this month. You can change it again next month'):t('昵称每个自然月可修改一次','You can change your nickname once a month')}</p><label class="field-label" for="profile-phone">${t('联系手机号','Contact phone')} <span class="quiet">${t('（选填）','(optional)')}</span></label><input class="profile-input" id="profile-phone" type="tel" maxlength="24" value="${esc(draft.phone)}" autocomplete="tel" placeholder="${t('含国家或地区区号','Include country code')}"><label class="field-label">${t('钱包地址','Wallet address')}</label><div class="profile-address"><span title="${esc(S.walletAddress||'')}">${S.walletAddress?esc(S.walletAddress.slice(0,10)+'…'+S.walletAddress.slice(-8)):t('尚未连接','Not connected')}</span><button class="icon-btn" data-action="copy-address" ${S.walletAddress?'':'disabled'} aria-label="${t('复制钱包地址','Copy wallet address')}">${icon('copy','',17)}</button></div><p id="profile-error" class="field-error" role="status"></p><button class="btn primary block" data-action="profile-save">${t('保存','Save')}</button></article></section>`;
  }
  function consumption(){
    Tokenomics.ensure();const {t,money}=U;
    return `<section data-screen-label="Agent consumption"><div class="profile-page-heading"><button class="icon-btn" data-action="back" data-value="tokenomics" aria-label="${t('返回','Back')}">${icon('chevron','back-icon',21)}</button><h1>${t('Agent 消耗详情','Agent consumption')}</h1></div><article class="panel"><div class="panel-head"><h2>MAAT</h2></div><div class="confirm-row"><span>${t('钱包 MAAT 余额','Wallet MAAT balance')}</span><b>${money(S.tokenWalletBalance)} MAAT</b></div><div class="confirm-row"><span>${t('项目 MAAT 余额','Project MAAT balance')}</span><b>${money(S.tokenProjectBalance)} MAAT</b></div><button class="btn secondary block" style="margin-top:20px" data-action="token-deposit">${t('充值 MAAT','Deposit MAAT')}</button></article><article class="panel consumption-records"><div class="panel-head"><h2>${t('消耗记录','Usage history')}</h2></div>${S.tokenConsumptionRecords.length?S.tokenConsumptionRecords.map(r=>`<div class="account-record"><div>Agent Trading<small>${U.stamp(r.time)} UTC+8</small></div><b>−${money(r.amount)} MAAT</b></div>`).join(''):`<p class="muted tiny">${t('暂无消耗记录','No usage history')}</p>`}</article></section>`;
  }
  const actions={
    'toggle-assets':()=>{S.hideAssets=!assetsHidden();try{localStorage.setItem('forea-hide-assets',String(S.hideAssets))}catch{}render({preserve:true})},
    'profile-save':()=>{
      const nickname=document.getElementById('profile-nickname')?.value.trim(),phone=document.getElementById('profile-phone')?.value.trim(),error=document.getElementById('profile-error');if(!error)return;
      if(!nickname){error.textContent=U.t('请输入昵称','Enter a nickname');return}
      if(phone&&!/^\+?[\d\s()-]{7,24}$/.test(phone)){error.textContent=U.t('请输入有效手机号','Enter a valid phone number');return}
      const old=profile(),changed=nickname!==old.nickname;if(changed&&old.nickMonth===monthKey()){error.textContent=U.t('昵称本月已修改过','Nickname already changed this month');return}
      try{localStorage.setItem(key(),JSON.stringify({nickname,phone,nickMonth:changed?monthKey():old.nickMonth}));draft=null;location.hash='account';toast(U.t('资料已保存','Profile saved'))}catch{error.textContent=U.t('保存失败，请重试','Save failed. Try again')}
    },
    'copy-address':async()=>{if(!S.walletAddress)return;try{await navigator.clipboard.writeText(S.walletAddress);toast(U.t('地址已复制','Address copied'))}catch{toast(U.t('复制失败，请长按地址复制','Copy failed. Press and hold the address to copy'))}}
  };
  function onInput(e){if(draft&&e.target.id==='profile-nickname')draft.nickname=e.target.value;if(draft&&e.target.id==='profile-phone')draft.phone=e.target.value}
  return {profile,avatar,card,portfolio,assetSummary,assetsHidden,renderProfile,consumption,actions,onInput};
})();
