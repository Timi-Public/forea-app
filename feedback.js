/* Review annotations for invited reviewers only. Without a valid ?fb= key nothing renders.
   Notes are stored in a private service (not this public repo); this file only holds the client. */
window.Feedback=(()=>{
  const API='https://maat-feedback.ai-factory.workers.dev';
  const KEY='forea-fb-key';
  const t=(zh,en)=>window.U?U.t(zh,en):zh;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const statusLabel=s=>({open:t('待改','Open'),done:t('已改','Done'),discuss:t('要讨论','Discuss'),closed:t('已确认','Closed')})[s]||s;
  const statusTone=s=>({open:'amber',done:'',discuss:'purple',closed:'gray'})[s]||'gray';
  let rules=null,rulesLoading=false,ruleFilter='all';
  let key='',me='',notes=[],open=false,scope='page',mode=null,draft=null,showPins=true,timer=null,root,pins,screenPins;

  const page=()=>(location.hash.slice(1)||'home').split('?')[0];
  const main=()=>document.getElementById('main');
  const version=()=>(document.querySelector('script[src*="app.js"]')?.getAttribute('src').match(/v=([^&]+)/)||[])[1]||'dev';
  const context=()=>({route:page(),lang:window.S?.lang,theme:window.S?.theme,width:innerWidth,height:innerHeight,version:version(),scene:new URLSearchParams(location.search).get('scene'),state:window.S?{agentState:S.agentState,agentTab:S.agentTab,liquidityTab:S.liquidityTab,ovTab:S.ovTab,connected:!!S.walletAddress}:{},scroll:main()?.scrollTop||0,ua:navigator.userAgent.slice(0,160)});
  const when=ms=>{const d=new Date(ms),p=n=>String(n).padStart(2,'0');return `${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`};

  async function call(path,opts={}){
    const res=await fetch(API+path,{...opts,headers:{'content-type':'application/json','x-fb-key':key,...(opts.headers||{})}});
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw Object.assign(new Error(body.error||res.status),{status:res.status});
    return body;
  }
  const toast=msg=>{if(typeof window.toast==='function')window.toast(msg)};

  /* ---------- where a note points ---------- */
  function anchorOf(el){
    if(!el||el===document.body)return null;
    const path=[];let n=el;
    while(n&&n.nodeType===1&&n.id!=='app'&&path.length<6){
      let seg=n.tagName.toLowerCase();
      if(n.dataset.card)seg+=`[data-card="${n.dataset.card}"]`;else if(n.dataset.row)seg+=`[data-row="${n.dataset.row}"]`;else if(n.dataset.action)seg+=`[data-action="${n.dataset.action}"]`;
      else{const sib=[...(n.parentElement?.children||[])].filter(x=>x.tagName===n.tagName);if(sib.length>1)seg+=`:nth-of-type(${sib.indexOf(n)+1})`}
      path.unshift(seg);n=n.parentElement;
    }
    return {selector:path.join(' > '),text:(el.innerText||'').trim().slice(0,160)};
  }
  // rect in content coordinates of #main when the box sits in the scroll area, otherwise in screen coordinates
  const frame=()=>document.getElementById('app')?.getBoundingClientRect()||{left:0,top:0,width:innerWidth,height:innerHeight,right:innerWidth,bottom:innerHeight};
  const clip=(r,b)=>{const left=Math.max(r.left,b.left),top=Math.max(r.top,b.top),right=Math.min(r.right,b.right),bottom=Math.min(r.bottom,b.bottom);return right-left<8||bottom-top<8?null:{left,top,right,bottom,width:right-left,height:bottom-top}};
  function place(r){
    const m=main(),mr=m?.getBoundingClientRect(),nav=document.querySelector('.mobile-nav')?.getBoundingClientRect();
    const area=mr&&{left:mr.left,right:mr.right,top:mr.top,bottom:Math.min(mr.bottom,innerHeight,nav&&nav.height?nav.top:Infinity)};
    const cx=r.left+r.width/2,cy=r.top+r.height/2;
    const inMain=area&&cy>=area.top&&cy<=area.bottom&&!document.elementsFromPoint(cx,cy).some(e=>e.closest?.('.mobile-nav,.topbar,header'));
    if(inMain){const c=clip(r,area)||r;return {space:'main',x:c.left-mr.left,y:c.top-mr.top+m.scrollTop,w:c.width,h:c.height,mw:mr.width}}
    const f=frame(),c=clip(r,f)||r;return {space:'screen',x:c.left-f.left,y:c.top-f.top,w:c.width,h:c.height,mw:f.width};
  }
  function syncFrame(){const f=frame();for(const el of [root,screenPins])if(el)el.style.cssText=`left:${f.left}px;top:${f.top}px;width:${f.width}px;height:${f.height}px`}

  /* ---------- pins ---------- */
  function drawPins(){
    pins?.remove();screenPins&&(screenPins.innerHTML='');
    if(!key||!showPins)return;
    const m=main();if(!m)return;
    const list=notes.filter(n=>n.page===page()&&n.status!=='closed'&&n.data?.box);
    if(!list.length)return;
    if(getComputedStyle(m).position==='static')m.style.position='relative';
    pins=document.createElement('div');pins.className='fb-pins';
    for(const n of list){
      const b=n.data.box,W=b.space==='main'?m.clientWidth:frame().width,k=b.mw?W/b.mw:1;
      const x=Math.max(0,Math.min(W-24,b.x*k)),w=Math.max(24,Math.min(W-x,b.w*k-(x-b.x*k)));
      const el=document.createElement('button');el.type='button';el.className='fb-pin '+n.status;el.dataset.fbNote=n.id;
      el.style.cssText=`left:${x}px;top:${Math.max(0,b.y)}px;width:${w}px;height:${Math.max(24,b.h)}px`;
      el.innerHTML=`<span>${n.id}</span>`;el.setAttribute('aria-label',t('批注 ','Note ')+n.id);
      (b.space==='main'?pins:screenPins).appendChild(el);
    }
    m.appendChild(pins);
  }

  /* ---------- panel ---------- */
  function panelHTML(){
    const list=(scope==='page'?notes.filter(n=>n.page===page()):notes);
    const pageCount=notes.filter(n=>n.page===page()&&n.status!=='closed').length;
    return `<div class="fb-head"><h2>${t('批注','Notes')}</h2><span class="fb-me">${esc(me)}</span><button class="fb-x" data-fb="close" aria-label="${t('关闭','Close')}">✕</button></div>
      <div class="fb-actions"><button data-fb="box">${t('圈出来','Circle')}</button><button data-fb="text">${t('改文字','Edit text')}</button><button data-fb="page">${t('整页说明','Page note')}</button></div>
      <a class="fb-rules-link" href="#rules" data-fb="close">${t('规则文档','Rules')}</a>
      <div class="fb-scope"><button data-fb="scope" data-v="page" class="${scope==='page'?'on':''}">${t('本页','This page')} ${pageCount}</button><button data-fb="scope" data-v="all" class="${scope==='all'?'on':''}">${t('全部','All')} ${notes.filter(n=>n.status!=='closed').length}</button><label class="fb-toggle"><input type="checkbox" data-fb="pins" ${showPins?'checked':''}>${t('显示框','Show boxes')}</label></div>
      <div class="fb-list">${list.length?list.map(n=>`<article class="fb-item" data-fb="go" data-id="${n.id}">
        <div class="fb-meta"><b>#${n.id}</b><span>${esc(n.author)}</span><span>${when(n.created_at)}</span>${scope==='all'?`<span class="fb-page">${esc(n.page)}</span>`:''}<span class="badge ${statusTone(n.status)}">${statusLabel(n.status)}</span></div>
        ${n.kind==='text'?`<p class="fb-diff"><del>${esc(n.old_text)}</del><ins>${esc(n.new_text)}</ins></p>`:''}
        ${n.body?`<p>${esc(n.body)}</p>`:''}
        ${n.reply?`<p class="fb-reply">${esc(n.replied_by||'')}：${esc(n.reply)}</p>`:''}
        ${n.status==='done'?`<div class="fb-item-actions"><button data-fb="status" data-id="${n.id}" data-v="closed">${t('确认','Confirm')}</button><button data-fb="status" data-id="${n.id}" data-v="open">${t('没改好','Reopen')}</button></div>`:''}
      </article>`).join(''):`<p class="fb-empty">${scope==='page'?t('这一页还没有批注','No notes on this page yet'):t('还没有批注','No notes yet')}</p>`}</div>`;
  }
  function renderUI(){
    if(!root)return;syncFrame();
    const count=notes.filter(n=>n.page===page()&&n.status!=='closed').length;
    root.innerHTML=`<button class="fb-fab" data-fb="toggle" aria-expanded="${open}">${window.icon?icon('chat','',19):''}${t('批注','Notes')}${count?`<span>${count}</span>`:''}</button>${open&&!mode&&!draft?`<section class="fb-panel" role="dialog" aria-label="${t('批注','Notes')}">${panelHTML()}</section>`:''}${mode?`<div class="fb-hint"><span>${mode==='box'?t('拖动框出要改的地方','Drag a box around what needs changing'):t('点一段文字','Tap the text to change')}</span><button data-fb="cancel">${t('取消','Cancel')}</button></div>`:''}${draft?composeHTML():''}`;
    if(mode==='box')root.insertAdjacentHTML('beforeend','<div class="fb-capture"><div class="fb-rect" hidden></div></div>');
    if(draft?.rect){const f=frame(),r=clip(draft.rect,f)||draft.rect;root.insertAdjacentHTML('beforeend',`<div class="fb-rect" style="left:${r.left-f.left}px;top:${r.top-f.top}px;width:${r.width}px;height:${r.height}px"></div>`)}
    root.querySelector('.fb-compose textarea')?.focus();
  }
  function composeHTML(){
    const d=draft;
    return `<section class="fb-compose" role="dialog" aria-label="${t('写批注','Write a note')}">
      <h3>${d.module?t('补一条规则','Add a rule')+'（'+esc(d.moduleTitle)+'）':d.kind==='box'?t('这里要怎么改','What should change here'):d.kind==='text'?t('改成','Change to'):t('整页说明','Page note')}</h3>
      ${d.kind==='text'?`<p class="fb-old">${t('原文','Original')}：${esc(d.old)}</p><textarea data-fb-input="new" rows="3">${esc(d.old)}</textarea><textarea data-fb-input="body" rows="2" placeholder="${t('补充说明（可选）','Extra note (optional)')}"></textarea>`:`<textarea data-fb-input="body" rows="${d.kind==='page'?6:3}" placeholder="${d.module?t('规则名称和具体数值，比如：撤单时长 4 小时','Rule and value, e.g. exit phase 4 hours'):d.kind==='page'?t('这一页整体的修改要求','What should change on this page'):t('写一句要改什么','Say what should change')}"></textarea>`}
      <p class="fb-error" role="status"></p>
      <div class="fb-compose-actions"><button data-fb="discard">${t('取消','Cancel')}</button><button class="primary" data-fb="send">${t('发送','Send')}</button></div>
    </section>`;
  }

  /* ---------- flows ---------- */
  async function refresh(){
    try{notes=(await call('/notes')).notes||[]}catch(e){if(e.status===401)return disable()}
    renderUI();drawPins();
  }
  function startText(e){
    const el=e.target.closest('#app *');if(!el||el.closest('.fb-root'))return;
    // pick the smallest element that carries visible text
    let target=el;while(target&&!(target.innerText||'').trim())target=target.parentElement;
    if(!target)return;
    e.preventDefault();e.stopImmediatePropagation();
    const r=target.getBoundingClientRect();
    draft={kind:'text',el:target,old:(target.innerText||'').trim(),original:target.children.length?null:target.textContent,rect:r,box:place(r),anchor:anchorOf(target)};
    mode=null;renderUI();
  }
  function restorePreview(){if(draft?.el&&draft.original!=null)draft.el.textContent=draft.original}
  async function send(){
    const box=root.querySelector('.fb-compose'),err=box.querySelector('.fb-error'),btn=box.querySelector('[data-fb=send]');
    const body=box.querySelector('[data-fb-input=body]')?.value.trim()||'',nw=box.querySelector('[data-fb-input=new]')?.value.trim();
    if(draft.kind==='text'?(nw===draft.old&&!body):!body){err.textContent=t('先写下要改什么','Write what should change first');return}
    btn.disabled=true;err.textContent='';
    try{
      const {note}=await call('/notes',{method:'POST',body:JSON.stringify({page:page(),kind:draft.kind,body,old:draft.kind==='text'?draft.old:undefined,new:draft.kind==='text'?nw:undefined,data:{...context(),box:draft.box||null,anchor:draft.anchor||null,module:draft.module||null}})});
      const wasRule=!!draft.module;restorePreview();notes.unshift(note);draft=null;open=!wasRule;scope='page';renderUI();drawPins();if(wasRule&&page()==='rules'&&typeof render==='function')render({preserve:true});toast(t('批注已发送','Note sent'));
    }catch(e){btn.disabled=false;err.textContent=e.status===401?t('批注链接已失效','This review link is no longer valid'):t('发送失败，请检查网络后重试','Could not send. Check your connection and try again')}
  }
  async function setStatus(id,status){
    try{const {note}=await call('/notes/'+id,{method:'PATCH',body:JSON.stringify({status})});notes=notes.map(n=>n.id===note.id?note:n);renderUI();drawPins()}catch{toast(t('更新失败，请重试','Update failed, try again'))}
  }
  function focusNote(id){
    const n=notes.find(x=>x.id===id);if(!n)return;
    const go=()=>{drawPins();const pin=document.querySelector(`[data-fb-note="${id}"]`);if(pin){if(n.data?.box?.space==='main'){const m=main();m.scrollTo({top:Math.max(0,n.data.box.y-120),behavior:'smooth'})}pin.classList.add('flash');setTimeout(()=>pin.classList.remove('flash'),1600)}};
    open=false;renderUI();
    if(n.page!==page()){location.hash=n.page;setTimeout(go,450)}else go();
  }

  /* ---------- rules page ---------- */
  function rulesPage(){
    const head=`<div class="tk-page-title"><h1>${t('规则文档','Rules')}</h1></div>`;
    if(!key||!me)return `<section class="fb-rules" data-screen-label="Rules">${head}<p class="fb-rules-locked">${t('规则文档只对项目成员开放','Rules are available to project members only')}</p></section>`;
    if(!rules){loadRules();return `<section class="fb-rules" data-screen-label="Rules">${head}<p class="fb-rules-locked">${t('正在加载','Loading')}</p></section>`}
    const st=rules.statuses,all=rules.modules.flatMap(m=>m.rules),count=k=>all.filter(r=>r[2]===k).length;
    const tone={set:'',product:'purple',demo:'amber',open:'gray'};
    const chips=[['all',t('全部','All')+' '+all.length],...['open','demo','product','set'].map(k=>[k,st[k]+' '+count(k)])];
    const added=id=>notes.filter(n=>n.page==='rules'&&n.data?.module===id&&!['done','closed'].includes(n.status));
    return `<section class="fb-rules" data-screen-label="Rules">${head}
      <p class="fb-rules-sub">${t('更新于','Updated')} ${esc(rules.updated)}</p>
      <div class="fb-rules-filter" role="group">${chips.map(([k,l])=>`<button data-fb="rule-filter" data-v="${k}" class="${ruleFilter===k?'on':''}" aria-pressed="${ruleFilter===k}">${esc(l)}</button>`).join('')}</div>
      ${rules.modules.map(m=>{const rows=m.rules.filter(r=>ruleFilter==='all'||r[2]===ruleFilter),extra=added(m.id);if(!rows.length&&!extra.length&&ruleFilter!=='all')return '';
        return `<article class="panel fb-rule-module" data-module="${m.id}"><div class="panel-head"><h2>${esc(m.title)}</h2><button data-fb="rule-add" data-module="${m.id}" data-title="${esc(m.title)}">${t('补一条','Add')}</button></div>
          ${rows.map(r=>`<div class="fb-rule"><div><h3>${esc(r[0])}</h3><p>${esc(r[1])}</p><small>${esc(r[3])}</small></div><span class="badge ${tone[r[2]]}">${esc(st[r[2]])}</span></div>`).join('')}
          ${extra.map(n=>`<div class="fb-rule added"><div><h3>${esc(n.author)} ${when(n.created_at)}</h3><p>${esc(n.body)}</p></div><span class="badge amber">${t('待整理','To file')}</span></div>`).join('')}
        </article>`}).join('')}
    </section>`;
  }
  async function loadRules(){
    if(rulesLoading)return;rulesLoading=true;
    try{rules=(await call('/docs/rules')).doc.body}catch{rules={updated:'—',statuses:{},modules:[]}}
    rulesLoading=false;if(page()==='rules'&&typeof render==='function')render({preserve:true});
  }
  if(window.Pages)Pages.rules=rulesPage;

  /* ---------- events ---------- */
  function onClick(e){
    if(mode==='text'&&!e.target.closest('.fb-root')){startText(e);return}
    const pin=e.target.closest('[data-fb-note]');if(pin){e.preventDefault();e.stopImmediatePropagation();open=true;scope='page';renderUI();root.querySelector(`.fb-item[data-id="${pin.dataset.fbNote}"]`)?.scrollIntoView({block:'nearest'});return}
    const el=e.target.closest('[data-fb]');if(!el||!el.closest('.fb-root,.fb-rules'))return;
    e.stopImmediatePropagation();
    const a=el.dataset.fb,id=Number(el.dataset.id);
    if(a==='toggle'){open=!open;mode=null;if(draft){restorePreview();draft=null}renderUI();if(open)refresh()}
    else if(a==='close'){open=false;renderUI()}
    else if(a==='box'||a==='text'){mode=a;renderUI()}
    else if(a==='page'){draft={kind:'page'};renderUI()}
    else if(a==='cancel'){mode=null;open=true;renderUI()}
    else if(a==='discard'){restorePreview();draft=null;open=true;renderUI()}
    else if(a==='send')send();
    else if(a==='scope'){scope=el.dataset.v;renderUI()}
    else if(a==='status'){setStatus(id,el.dataset.v)}
    else if(a==='go'&&!e.target.closest('button'))focusNote(id);
    else if(a==='rule-add'){draft={kind:'page',module:el.dataset.module,moduleTitle:el.dataset.title};open=false;renderUI()}
    else if(a==='rule-filter'){ruleFilter=el.dataset.v;if(typeof render==='function')render({preserve:true})}
  }
  function onInput(e){
    if(e.target.dataset?.fb==='pins'){showPins=e.target.checked;drawPins();return}
    if(e.target.dataset?.fbInput==='new'&&draft?.el&&draft.original!=null)draft.el.textContent=e.target.value;
  }
  let start=null;
  function onDown(e){if(mode!=='box'||!e.target.closest('.fb-capture'))return;e.preventDefault();start={x:e.clientX,y:e.clientY};e.target.setPointerCapture?.(e.pointerId)}
  function onMove(e){if(!start)return;const r=root.querySelector('.fb-capture .fb-rect');r.hidden=false;const x=Math.min(start.x,e.clientX),y=Math.min(start.y,e.clientY);const f=frame();r.style.cssText=`left:${x-f.left}px;top:${y-f.top}px;width:${Math.abs(e.clientX-start.x)}px;height:${Math.abs(e.clientY-start.y)}px`}
  function onUp(e){
    if(!start)return;
    let x=Math.min(start.x,e.clientX),y=Math.min(start.y,e.clientY),w=Math.abs(e.clientX-start.x),h=Math.abs(e.clientY-start.y);start=null;
    if(w<12&&h<12){x-=22;y-=22;w=44;h=44}
    const rect={left:x,top:y,width:w,height:h,right:x+w,bottom:y+h};
    root.querySelector('.fb-capture')?.remove();
    const under=document.elementFromPoint(x+w/2,y+h/2);
    draft={kind:'box',rect,box:place(rect),anchor:anchorOf(under)};mode=null;renderUI();
  }
  function disable(){key='';try{localStorage.removeItem(KEY)}catch{}root?.remove();pins?.remove();screenPins?.remove();root=null}

  async function init(){
    const q=new URLSearchParams(location.search),k=q.get('fb');
    try{if(k)localStorage.setItem(KEY,k);key=k||localStorage.getItem(KEY)||''}catch{key=k||''}
    if(k){q.delete('fb');history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:'')+location.hash)}
    if(!key)return;
    try{me=(await call('/me')).name}catch(e){if(e.status===401)disable();else{key='';}return}
    root=document.createElement('div');root.className='fb-root';document.body.appendChild(root);
    screenPins=document.createElement('div');screenPins.className='fb-pins screen';document.body.appendChild(screenPins);
    document.body.classList.add('fb-on');syncFrame();addEventListener('resize',()=>{syncFrame();drawPins()});
    if(page()==='rules'&&typeof render==='function')render({preserve:true});
    addEventListener('click',onClick,true);addEventListener('input',onInput,true);
    addEventListener('pointerdown',onDown,true);addEventListener('pointermove',onMove,true);addEventListener('pointerup',onUp,true);
    addEventListener('keydown',e=>{if(e.key==='Escape'&&(mode||draft)){e.stopImmediatePropagation();restorePreview();mode=null;draft=null;open=true;renderUI()}},true);
    addEventListener('hashchange',()=>{renderUI();setTimeout(drawPins,60)});
    new MutationObserver(()=>{if(!document.querySelector('#main > .fb-pins'))drawPins()}).observe(document.getElementById('app'),{childList:true});
    await refresh();
    timer=setInterval(()=>{if(!document.hidden)refresh()},60000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  return {refresh,get notes(){return notes},get me(){return me}};
})();
