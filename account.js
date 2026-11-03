/* Local profile editing. Optional contact details stay on this device. */
window.Account=(()=>{
  const key=()=> 'forea-profile-'+(S.walletAddress?.toLowerCase()||'guest');
  const palette=[['#edb45e','#996432'],['#92cbb8','#356d68'],['#a8b8e5','#586baf'],['#d5a8ca','#925d8b'],['#a7c77a','#5b783f'],['#c5b2e2','#7960a5'],['#e2a397','#a86151'],['#99c7df','#447c99']];
  let draft=null,draftKey='';
  function profile(){
    try{const p=JSON.parse(localStorage.getItem(key())||'{}');return {nickname:String(p.nickname||U.brand+' Explorer').slice(0,24),phone:String(p.phone||'').slice(0,24),avatar:Number.isInteger(p.avatar)?Math.abs(p.avatar)%24:0}}catch{return {nickname:U.brand+' Explorer',phone:'',avatar:0}}
  }
  function avatar(seed=profile().avatar){
    const [bg,ink]=palette[seed%palette.length],style=Math.floor(seed/8)%3;
    const face=style===0?`<path d="M6 13 3 4l10 6h6l10-6-3 11v10c-4 7-16 7-20 0Z" fill="${ink}"/><path d="m8 18 8 6 8-6v9c-4 4-12 4-16 0Z" fill="#f8e5ce"/><path d="m8 15 5 2-3 3m14-5-5 2 3 3" fill="#29382f"/><path d="m14 23 2 2 2-2" stroke="#29382f" stroke-width="2"/>`:style===1?`<rect x="5" y="9" width="22" height="19" rx="7" fill="${ink}"/><path d="M16 3v6M12 4h8" stroke="#f4f8f4" stroke-width="2"/><rect x="8" y="13" width="16" height="8" rx="4" fill="#e7f3ef"/><path d="M12 15v3m8-3v3M12 25h8" stroke="#29382f" stroke-width="2" stroke-linecap="round"/>`:`<path d="M5 13 8 4l7 6h2l7-6 3 9v11c-4 8-18 8-22 0Z" fill="${ink}"/><circle cx="11" cy="18" r="5" fill="#f0efdb"/><circle cx="21" cy="18" r="5" fill="#f0efdb"/><circle cx="12" cy="18" r="2" fill="#29382f"/><circle cx="20" cy="18" r="2" fill="#29382f"/><path d="m14 25 2-4 2 4Z" fill="#e7b150"/>`;
    return `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="16" fill="${bg}"/>${face}</svg>`;
  }
  function card(){const p=profile(),{t,esc}=U;return `<article class="panel personal-card"><div class="panel-head"><h1>Account</h1><a class="icon-btn" href="#account/profile" aria-label="${t('编辑资料','Edit profile')}">${icon('settings','',19)}</a></div><a class="personal-link" href="#account/profile"><span class="personal-avatar">${avatar()}</span><div class="personal-summary"><div class="personal-name"><b>${esc(p.nickname)}</b><span>· ${esc(p.phone||t('未填写手机号','No phone'))}</span></div><p>${S.walletAddress?U.esc(U.address()):t('访客','Guest')}</p><span class="personal-network">${icon('cube','',12)} Polygon <span>· ${S.connected?t('已连接','Connected'):t('未连接','Not connected')}</span></span></div>${icon('chevron','muted',17)}</a></article>`}
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
    return `<article class="panel portfolio-card" data-card="my-portfolio"><div class="panel-head"><h2>My Portfolio</h2><button class="icon-btn" data-action="toggle-assets" aria-label="${hidden?t('显示资产','Show balances'):t('隐藏资产','Hide balances')}" aria-pressed="${hidden}">${icon(hidden?'eye-off':'eye','',19)}</button></div><div class="portfolio-total"><span class="label">${t('账户总资产估值','Total account value')}</span><strong>${estimate(a.total)}<small>USDC</small></strong></div><div class="portfolio-subtotals"><div><span class="label">${t('钱包资产','Wallet assets')}</span><b>${value(a.walletValue)}</b></div><div><span class="label">${t('项目内资产','Project assets')}</span><b>${value(a.projectValue)}</b></div></div><div class="portfolio-group"><h3>${t('钱包资产','Wallet assets')}</h3><div class="portfolio-line"><span>USDC</span><b>${value(a.walletUSDC)}</b></div><div class="portfolio-line"><span>${t('项目代币','Project token')}</span><b>${value(a.walletABC,'MAAT')}</b></div></div><div class="portfolio-group"><h3>${t('项目内资产','Project assets')}</h3><div class="portfolio-line"><span>${t('Agent Trading 资金','Agent Trading funds')}</span><b>${value(a.agentUSDC)}</b></div><div class="portfolio-line"><span>${t('流动性服务锁定资金','Liquidity service collateral')}</span><b>${value(a.liquidityUSDC)}</b></div><div class="portfolio-line"><span>${t('项目代币','Project token')}</span><b>${value(a.projectABC,'MAAT')}</b></div></div><div class="portfolio-source"><span>${t('演示资产','Demo balances')}</span><span>${t('估值单位','Valued in')} USDC</span></div></article>`;
  }
  function renderProfile(){
    const {t,esc}=U;if(!draft||draftKey!==key()){draft=profile();draftKey=key()}
    return `<section class="profile-page" data-screen-label="Personal profile"><div class="profile-page-heading"><a class="icon-btn" href="#account" aria-label="${t('返回账户','Back to account')}">${icon('chevron','back-icon',21)}</a><h1>${t('个人资料','Profile')}</h1></div><article class="panel profile-form"><div class="profile-avatar-editor"><span id="profile-avatar" class="personal-avatar large">${avatar(draft.avatar)}</span><button class="text-link" data-action="profile-random">${icon('refresh','',14)}${t('随机头像','Random avatar')}</button></div><label class="field-label" for="profile-nickname">${t('昵称','Nickname')}</label><input class="profile-input" id="profile-nickname" type="text" maxlength="24" value="${esc(draft.nickname)}" autocomplete="nickname"><label class="field-label" for="profile-phone">${t('联系手机号','Contact phone')} <span class="quiet">${t('（选填）','(optional)')}</span></label><input class="profile-input" id="profile-phone" type="tel" maxlength="24" value="${esc(draft.phone)}" autocomplete="tel" placeholder="+86"><label class="field-label">${t('钱包地址','Wallet address')}</label><div class="profile-address"><span>${S.walletAddress?esc(S.walletAddress):t('尚未连接','Not connected')}</span><button class="icon-btn" data-action="copy-address" ${S.walletAddress?'':'disabled'} aria-label="${t('复制钱包地址','Copy wallet address')}">${icon('copy','',17)}</button></div><p class="profile-privacy">${t('资料仅保存在当前设备。','Profile details are saved on this device only.')}</p><p id="profile-error" class="field-error" role="status"></p><button class="btn primary block" data-action="profile-save">${t('保存','Save')}</button></article></section>`;
  }
  function consumption(){
    Tokenomics.ensure();const {t,money}=U;
    return `<section data-screen-label="Agent consumption"><div class="profile-page-heading"><a class="icon-btn" href="#account" aria-label="${t('返回账户','Back to account')}">${icon('chevron','back-icon',21)}</a><h1>${t('Agent 消耗详情','Agent consumption')}</h1></div><article class="panel"><div class="panel-head"><h2>${t('项目代币','Project token')}</h2><span class="demo-tag">${t('演示','DEMO')}</span></div><div class="confirm-row"><span>${t('钱包余额','Wallet balance')}</span><b>${money(S.tokenWalletBalance)} MAAT</b></div><div class="confirm-row"><span>${t('项目可用余额','Available project balance')}</span><b>${money(S.tokenProjectBalance)} MAAT</b></div><button class="btn secondary block" style="margin-top:20px" data-action="token-deposit">${t('充值 MAAT','Deposit MAAT')}</button></article><article class="panel consumption-records"><div class="panel-head"><h2>${t('消耗记录','Usage history')}</h2></div>${S.tokenConsumptionRecords.length?S.tokenConsumptionRecords.map(r=>`<div class="account-record"><div>Agent Trading<small>${new Date(r.time).toLocaleString(S.lang==='zh'?'zh-CN':'en-GB')}</small></div><b>−${money(r.amount)} MAAT</b></div>`).join(''):`<p class="muted tiny">${t('暂无消耗记录','No usage history')}</p>`}</article></section>`;
  }
  const actions={
    'toggle-assets':()=>{S.hideAssets=!assetsHidden();try{localStorage.setItem('forea-hide-assets',String(S.hideAssets))}catch{}render({preserve:true})},
    'profile-random':()=>{if(!draft)draft=profile();let next;do{next=Math.floor(Math.random()*24)}while(next===draft.avatar);draft.avatar=next;const el=document.getElementById('profile-avatar');if(el)el.innerHTML=avatar(next)},
    'profile-save':()=>{
      const nickname=document.getElementById('profile-nickname')?.value.trim(),phone=document.getElementById('profile-phone')?.value.trim(),error=document.getElementById('profile-error');if(!error)return;
      if(!nickname){error.textContent=U.t('请输入昵称','Enter a nickname');return}
      if(phone&&!/^\+?[\d\s()-]{7,24}$/.test(phone)){error.textContent=U.t('请输入有效手机号','Enter a valid phone number');return}
      try{localStorage.setItem(key(),JSON.stringify({nickname,phone,avatar:draft.avatar}));draft=null;location.hash='account';toast(U.t('资料已保存','Profile saved'))}catch{error.textContent=U.t('无法保存，请检查设备存储设置','Unable to save. Check device storage settings')}
    },
    'copy-address':async()=>{if(!S.walletAddress)return;try{await navigator.clipboard.writeText(S.walletAddress);toast(U.t('地址已复制','Address copied'))}catch{toast(U.t('复制失败，请长按地址复制','Copy failed. Press and hold the address to copy'))}}
  };
  function onInput(e){if(draft&&e.target.id==='profile-nickname')draft.nickname=e.target.value;if(draft&&e.target.id==='profile-phone')draft.phone=e.target.value}
  return {profile,avatar,card,portfolio,assetSummary,assetsHidden,renderProfile,consumption,actions,onInput};
})();
