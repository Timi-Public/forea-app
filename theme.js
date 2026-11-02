/* Apply the saved appearance before the first paint. Auto uses device local time. */
window.ForeaTheme=(()=>{
  const key='forea-theme-mode';
  const valid=mode=>['auto','light','dark'].includes(mode);
  const getMode=()=>{try{const mode=localStorage.getItem(key);return valid(mode)?mode:'auto'}catch{return 'auto'}};
  const resolve=(mode,hour=new Date().getHours())=>mode==='auto'?(hour>=7&&hour<19?'light':'dark'):(valid(mode)?mode:'light');
  const apply=mode=>{
    const theme=resolve(mode);
    document.documentElement.dataset.theme=theme;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=theme==='dark'?'#202823':'#f9faf9';
    return theme;
  };
  const save=mode=>{if(!valid(mode))return;try{localStorage.setItem(key,mode)}catch{}return apply(mode)};
  apply(getMode());
  return {getMode,resolve,apply,save};
})();
