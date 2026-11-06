/* OKX identity connection only. This prototype never signs or sends transactions. */
window.OKXIdentity=(()=>{
  const stateFields=['walletBalance','capital','amount','agentState','elapsed','startedAt','services','records','tokenWalletBalance','tokenProjectBalance','tokenCycleUsed','tokenConsumptionRecords','custody','custodyFee'];
  const cache=new Map();let provider=null,busy=false,handlers=null;
  const validAddress=a=>/^0x[\da-f]{40}$/i.test(a||'');
  const activeKey=()=>S.walletAddress?.toLowerCase()||'guest';
  const fresh=()=>({walletBalance:3250,capital:0,amount:1000,agentState:'inactive',elapsed:0,startedAt:Date.now(),services:[],records:[],tokenWalletBalance:1000,tokenProjectBalance:0,tokenCycleUsed:0,tokenConsumptionRecords:[],custody:null,custodyFee:0});
  function identity(address,chain){
    const next=validAddress(address)?address:'';
    if(activeKey()!==(next.toLowerCase()||'guest')){
      cache.set(activeKey(),Object.fromEntries(stateFields.map(k=>[k,S[k]])));
      Object.assign(S,cache.get(next.toLowerCase()||'guest')||fresh());
    }
    S.walletAddress=next;S.walletChainId=chain?Number(chain):null;S.connected=!!next&&S.walletChainId===137;
    Activity.identityChanged();
    if(D)render({preserve:true});
  }
  function unbind(){if(provider&&handlers&&provider.removeListener){for(const [name,fn] of Object.entries(handlers))provider.removeListener(name,fn)}handlers=null}
  function bind(p){
    if(provider===p&&handlers)return;
    unbind();provider=p;
    handlers={
      accountsChanged:accounts=>{const next=accounts?.[0]||'';identity(next,S.walletChainId);closeOverlay();if(!next)toast(U.t('钱包已断开','Wallet disconnected'))},
      chainChanged:chain=>{identity(S.walletAddress,chain);closeOverlay();if(Number(chain)!==137)toast(U.t('请切换至 Polygon 网络','Switch to Polygon network'))},
      disconnect:()=>{identity('',null);closeOverlay();toast(U.t('钱包已断开','Wallet disconnected'))}
    };
    for(const [name,fn] of Object.entries(handlers))p.on?.(name,fn);
  }
  function view(){
    const {t,esc}=U;
    sheet(t('连接钱包','Connect wallet'),`${S.walletAddress?`<div class="wallet-status">${icon('wallet','accent',21)}<div><code>${esc(S.walletAddress)}</code><small>OKX Wallet · ${S.walletChainId===137?'Polygon':t('请切换至 Polygon','Switch to Polygon')}</small></div></div>`:''}<button class="wallet-choice" data-action="okx-connect"><span class="wallet-mark okx">OKX</span><span>OKX Wallet<small>Polygon</small></span>${icon('chevron','muted',17)}</button><p id="wallet-error" class="wallet-error" role="status"></p>${S.walletAddress?`<button class="btn outline block" data-action="disconnect">${t('断开连接','Disconnect')}</button>`:`<button class="btn outline block" data-action="close">${t('继续浏览','Continue browsing')}</button>`}`,'sheet','wallet');
  }
  async function connect(testProvider){
    if(busy)return;
    const p=testProvider||(window.okxwallet?.request?window.okxwallet:window.ethereum?.isOkxWallet?window.ethereum:null);
    if(!p){const error=document.getElementById('wallet-error');if(error)error.textContent=U.t('请在 OKX Wallet 内打开，或安装 OKX Wallet 插件后重试','Open this page in OKX Wallet, or install the OKX Wallet extension and retry');return}
    busy=true;const button=document.querySelector('[data-action="okx-connect"]');if(button){button.disabled=true;button.setAttribute('aria-busy','true')}
    try{
      const accounts=await p.request({method:'eth_requestAccounts'});
      if(!validAddress(accounts?.[0]))throw new Error('empty-account');
      let chain=await p.request({method:'eth_chainId'});
      if(Number(chain)!==137){await p.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x89'}]});chain=await p.request({method:'eth_chainId'})}
      if(Number(chain)!==137)throw new Error('wrong-chain');
      bind(p);
      const latest=await p.request({method:'eth_accounts'});
      if(!validAddress(latest?.[0]))throw new Error('empty-account');
      const latestChain=await p.request({method:'eth_chainId'});
      if(Number(latestChain)!==137)throw new Error('wrong-chain');
      identity(latest[0],latestChain);closeOverlay();toast(U.t('OKX Wallet 已连接 · Polygon','OKX Wallet connected · Polygon'));
    }catch(error){
      const message=error.code===4001?U.t('已取消连接','Connection cancelled'):error.message==='wrong-chain'?U.t('请在 OKX Wallet 中切换至 Polygon','Switch to Polygon in OKX Wallet'):error.code===-32002?U.t('请在钱包中确认连接请求','Confirm the pending request in your wallet'):U.t('连接失败，请检查 OKX Wallet 后重试','Connection failed. Check OKX Wallet and retry');
      const el=document.getElementById('wallet-error');if(el)el.textContent=message;else toast(message);
    }finally{busy=false;if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy')}}
  }
  function disconnect(){unbind();provider=null;identity('',null);closeOverlay();toast(U.t('已断开连接','Disconnected'))}
  return {view,connect,disconnect};
})();
