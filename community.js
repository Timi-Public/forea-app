/* Account 04 Community & Rewards · 05 Invite Friends.
   Levels, volumes, rewards and member counts are demo values: there is no referral contract or reward ledger yet.
   Months, progress and payout date follow the real calendar (UTC+8), so the card never goes stale.
   Total rewards are always the sum of the three reward lines. */
window.Community=(()=>{
  const demo={
    settled:{level:'G2',daily:186000,diff:1380,direct:720,fee:300,invites:18,members:126},
    current:{level:'G2',daily:68000,next:'G3',target:300000}
  };
  const payDay=5;
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  function period(){
    const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
    const days=new Date(p.year,p.month,0).getDate();
    return {month:p.month,last:p.month===1?12:p.month-1,day:p.day,days,left:days-p.day,paid:p.day>=payDay};
  }
  const monthName=m=>U.t(`${m}月`,months[m-1]);
  const payDate=m=>U.t(`${m}月${payDay}日`,`${months[m-1].slice(0,3)} ${payDay}`);
  const reward=n=>Account.assetsHidden()?'••••':U.money(n,false,0);
  const volume=n=>U.money(n,false,0);

  function card(){
    const {t}=U,p=period(),s=demo.settled,c=demo.current,total=s.diff+s.direct+s.fee;
    const payout=p.paid?t(`已发放 ${payDate(p.month)}`,`Paid ${payDate(p.month)}`):t(`待发放 ${payDate(p.month)}`,`Payout ${payDate(p.month)}`);
    const cell=(label,value,unit)=>`<div><span class="cm-label">${label}</span><b>${value}${unit?` <small>${unit}</small>`:''}</b></div>`;
    return `<article class="panel community-card" data-card="community"><div class="panel-head"><div class="row">${icon('users','',20)}<h2>Community & Rewards</h2><span class="demo-tag">${t('演示','DEMO')}</span></div></div>`
      +`<section class="cm-period"><div class="between"><h3>${monthName(p.last)}</h3><span class="cm-state">${icon('check','',13)}${t('已核定','Verified')}</span></div>`
      +`<div class="cm-main"><div class="cm-level"><b>${s.level}</b><span>${t('社区等级','Level')}</span></div><div class="cm-stack">`
      +`<div><span class="cm-label">${t('日均社区业绩','Daily community volume')}</span><strong>${volume(s.daily)} <small>USDC</small></strong></div>`
      +`<div><span class="cm-label">${t('总奖励','Total rewards')}</span><div class="cm-reward-line"><strong data-community="total">${reward(total)} <small>ABC</small></strong><span class="cm-payout">${payout}</span></div></div></div></div>`
      +`<div class="cm-grid three">${cell(t('社区级差奖励','Differential'),reward(s.diff),'ABC')}${cell(t('直属奖励','Direct'),reward(s.direct),'ABC')}${cell(t('托管手续费分成','Custody fee share'),reward(s.fee),'ABC')}</div>`
      +`<div class="cm-grid three counts">${cell(t('直属邀请人数','Direct invites'),t(`${s.invites} 人`,String(s.invites)))}${cell(t('社区总人数','Community members'),t(`${s.members} 人`,String(s.members)))}</div></section>`
      +`<section class="cm-period current"><div class="between"><h3>${monthName(p.month)}</h3><span class="cm-state live"><i></i>${t('考核中','In progress')}</span></div>`
      +`<div class="cm-main"><div class="cm-level plain"><b>${c.level}</b><span>${t('社区等级','Level')}</span></div><div class="cm-stack">`
      +`<div><span class="cm-label">${t('日均社区业绩','Daily community volume')}</span><strong>${volume(c.daily)} <small>USDC</small></strong></div>`
      +`<div><span class="cm-label">${t('下一等级','Next level')}</span><p class="cm-next"><b>${c.next}</b>${volume(c.target)} USDC</p></div></div></div>`
      +`<div><div class="between cm-progress-head"><span>${t('考核进度','Progress')}</span><b>${p.day} / ${p.days} ${t('天','days')}</b></div><div class="cm-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${p.days}" aria-valuenow="${p.day}"><span style="width:${(p.day/p.days*100).toFixed(1)}%"></span></div><p class="cm-left">${t(`剩余 ${p.left} 天`,`${p.left} days left`)}</p></div></section></article>`;
  }

  const inviteLink=()=>S.walletAddress?new URL('./?ref='+S.walletAddress,location.href).href:'';
  function invite(){
    const {t,esc}=U,link=inviteLink(),addr=S.walletAddress;
    const field=(ic,label,value,kind,empty)=>`<div class="iv-field"><span class="cm-label">${label}</span><div class="iv-value">${icon(ic,'',16)}${value?`<span class="iv-text">${esc(value)}</span><button class="icon-btn iv-copy" data-action="invite-copy" data-value="${kind}" aria-label="${t('复制','Copy')}">${icon('copy','',16)}</button>`:`<button class="text-link" data-action="wallet">${empty}</button>`}</div></div>`;
    return `<article class="panel invite-card" data-card="invite"><div class="panel-head"><div class="row">${icon('user-plus','',20)}<h2>Invite Friends</h2></div><button class="icon-btn" data-action="invite-share" aria-label="${t('分享邀请链接','Share invite link')}" ${link?'':'disabled'}>${icon('share','',18)}</button></div>`
      +`<p class="iv-desc">${t('通过邀请链接、钱包地址或二维码海报邀请新用户，建立邀请关系','Invite new users with your link, wallet address or QR poster')}</p>`
      +field('link',t('专属邀请链接','Your invite link'),link,'link',t('连接钱包后生成','Connect wallet to generate'))
      +field('wallet',t('邀请人钱包地址','Inviter wallet address'),addr&&addr.slice(0,10)+'…'+addr.slice(-8),'address',t('连接钱包后显示','Connect wallet to show'))
      +`<div class="iv-actions"><button class="btn secondary" disabled>${icon('qr','',16)}${t('邀请海报','Invite poster')}</button><button class="btn outline" data-action="invite-manage">${icon('users','',16)}${t('邀请管理','Manage invites')}</button></div></article>`;
  }

  async function copy(text){try{await navigator.clipboard.writeText(text);toast(U.t('已复制','Copied'))}catch{toast(U.t('复制失败，请长按复制','Copy failed. Long-press to copy'))}}
  const actions={
    'invite-copy':kind=>{const v=kind==='link'?inviteLink():S.walletAddress;if(v)copy(v)},
    'invite-share':async()=>{const url=inviteLink();if(!url)return;if(navigator.share){try{await navigator.share({title:U.brand,url})}catch{}}else copy(url)},
    'invite-manage':()=>toast(U.t('邀请管理即将开放','Invite management is coming soon'))
  };
  return {card,invite,actions,period,demo};
})();
