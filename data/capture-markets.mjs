// Public Polymarket snapshot for a clearly labelled design prototype.
// No user identifiers, wallet addresses, private credentials, orders, or writes.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {writeFile} from 'node:fs/promises';
const run = promisify(execFile);
const dir = new URL('./', import.meta.url);
const sources = [];
async function read(url) {
  if (!['gamma-api.polymarket.com','clob.polymarket.com','data-api.polymarket.com'].includes(new URL(url).hostname)) throw new Error('Unexpected host');
  const {stdout} = await run('curl',['-fsS','--max-time','25',url],{maxBuffer:12*1024*1024});
  const value=JSON.parse(stdout);
  sources.push({url,fetchedAt:new Date().toISOString()});
  return value;
}
async function saveImage(m){
  const url=m.image||m.icon||m.events?.[0]?.image||m.events?.[0]?.icon;if(!url)return null;const ext=(new URL(url).pathname.match(/\.(png|jpe?g|webp)$/i)?.[1]||'png').toLowerCase().replace('jpeg','jpg');const file='assets/market-'+m.id+'.'+ext;
  await run('curl',['-fsSL','--max-time','25','-o',new URL('../'+file,dir).pathname,url]);return file;
}
const arr = v => Array.isArray(v) ? v : typeof v === 'string' ? JSON.parse(v) : [];
const now=Date.now();
const horizon=now+7*86400000; // keep the review sample open for at least a week
const openEvents=await read('https://gamma-api.polymarket.com/events/pagination?limit=1&active=true&closed=false');
const eligibleEvents=await read('https://gamma-api.polymarket.com/events/pagination?limit=1&active=true&closed=false&liquidity_min=100000');
const candidates=[];
for(const offset of [0,100,200,300,400])candidates.push(...await read('https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=100&offset='+offset+'&order=volume24hr&ascending=false'));
const used=new Set();
const selected=candidates.filter(m=>{
  const outcomes=arr(m.outcomes), prices=arr(m.outcomePrices).map(Number), event=m.events?.[0];
  if (!m.active||m.closed||!m.acceptingOrders||!m.enableOrderBook||Number(m.liquidityNum)<50000||outcomes.length!==2||outcomes[0]?.toLowerCase()!=='yes'||outcomes[1]?.toLowerCase()!=='no'||prices[0]<0.02||prices[0]>0.98||!(Date.parse(m.endDate)>=horizon)) return false;
  const key=event?.id||m.id;
  if (used.has(key)) return false;
  used.add(key);return true;
}).slice(0,12);
const markets=[];
for (const m of selected) {
  let tags=[];
  try { tags=await read('https://gamma-api.polymarket.com/markets/'+encodeURIComponent(m.id)+'/tags'); } catch {}
  markets.push({id:m.id,question:m.question,slug:m.slug,eventSlug:m.events?.[0]?.slug||m.slug,eventTitle:m.events?.[0]?.title||m.question,conditionId:m.conditionId,clobTokenIds:arr(m.clobTokenIds),outcomes:arr(m.outcomes),outcomePrices:arr(m.outcomePrices).map(Number),liquidity:Number(m.liquidityNum),liquidityNum:Number(m.liquidityNum),volume24hr:Number(m.volume24hr||0),volume:Number(m.volumeNum||m.volume||0),image:m.image,icon:m.icon,tags:tags.map(t=>({id:t.id,label:t.label,slug:t.slug})),active:m.active,closed:m.closed,acceptingOrders:m.acceptingOrders,endDate:m.endDate,updatedAt:m.updatedAt,spread:Number.isFinite(Number(m.spread))?Number(m.spread):null,bestBid:Number.isFinite(Number(m.bestBid))?Number(m.bestBid):null,bestAsk:Number.isFinite(Number(m.bestAsk))?Number(m.bestAsk):null,oneDayPriceChange:Number.isFinite(Number(m.oneDayPriceChange))?Number(m.oneDayPriceChange):null,localImage:await saveImage(m),fetchedAt:new Date().toISOString(),sourceUrl:'https://polymarket.com/event/'+(m.events?.[0]?.slug||m.slug),eligibility:'prototype-threshold-only'});
}
const orderBooks=[];const trades=[];const errors=[];
for (const market of markets.slice(0,3)) {
  try {
    const tokenId=market.clobTokenIds[0];
    const b=await read('https://clob.polymarket.com/book?token_id='+encodeURIComponent(tokenId));
    orderBooks.push({conditionId:market.conditionId,marketId:market.id,question:market.question,tokenId,outcome:'Yes',timestamp:b.timestamp,hash:b.hash,bids:b.bids.map(x=>({price:Number(x.price),size:Number(x.size)})).sort((a,b)=>b.price-a.price).slice(0,12),asks:b.asks.map(x=>({price:Number(x.price),size:Number(x.size)})).sort((a,b)=>a.price-b.price).slice(0,12),tickSize:b.tick_size,minOrderSize:b.min_order_size,lastTradePrice:b.last_trade_price,fetchedAt:new Date().toISOString()});
  } catch(e) { errors.push({kind:'orderbook',marketId:market.id,message:e.message.slice(0,180)}); }
  try {
    const ts=await read('https://data-api.polymarket.com/trades?market='+encodeURIComponent(market.conditionId)+'&limit=8');
    trades.push(...ts.map(t=>({conditionId:market.conditionId,marketId:market.id,question:market.question,timestamp:t.timestamp,side:t.side,outcome:t.outcome,price:Number(t.price),size:Number(t.size),notional:Number(t.price)*Number(t.size),transactionHash:t.transactionHash,source:'Polymarket public market trades, not PolyAgent account trades',fetchedAt:new Date().toISOString()})));
  } catch(e) { errors.push({kind:'trades',marketId:market.id,message:e.message.slice(0,180)}); }
}
const snapshot={schemaVersion:1,kind:'public-market-snapshot',fetchedAt:new Date().toISOString(),scope:'A bounded sample of at most 12 distinct events, selected from the first 500 active markets ordered by volume24hr; not all Polymarket markets.',selection:{queryLimit:500,minimumLiquidity:50000,minimumYesProbability:0.02,maximumYesProbability:0.98,requiresFutureEndDate:true,minimumDaysOpen:7,oneMarketPerEvent:true},summary:{sampleMarketCount:markets.length,sampleVolume24hr:markets.reduce((s,m)=>s+m.volume24hr,0),sampleLiquidity:markets.reduce((s,m)=>s+m.liquidity,0),globalMarketCount:null,globalEventCount:Number(openEvents.pagination?.totalResults)||null,eligibleEventCount:Number(eligibleEvents.pagination?.totalResults)||null,eligibleEventRule:'open events with Gamma liquidity_min=100000',globalTradeCount24h:null},markets,orderBooks,trades,errors};
snapshot.book=orderBooks[0]||null;
snapshot.markets.forEach(m=>{m.tokenIds=m.clobTokenIds;m.prices=m.outcomePrices;m.tagLabels=m.tags.map(t=>t.label);});
snapshot.trades.forEach(t=>{t.title=t.question;});
await writeFile(new URL('market-snapshot.json',dir),JSON.stringify(snapshot,null,2)+'\n');
await writeFile(new URL('sources.json',dir),JSON.stringify({checkedAt:snapshot.fetchedAt,docs:{discovery:'https://docs.polymarket.com/market-data/discover-markets',markets:'https://docs.polymarket.com/api-reference/markets/list-markets',search:'https://docs.polymarket.com/api-reference/search/search-markets-events-and-profiles',orderBook:'https://docs.polymarket.com/api-reference/market-data/get-order-book',publicTradesLegacy:'https://docs.polymarket.com/api-reference/core/get-trades-for-a-user-or-markets',dataApiV2:'https://docs.polymarket.com/api-reference/data-api/overview'},fieldNotes:{liquidityNum:'Gamma numeric market liquidity field. A screening proxy; not a verified executable depth at a given price.',volume24hr:'Per-market trailing 24h volume, not global platform volume.',outcomePrices:'Per-outcome Gamma quoted market prices. Display as market-implied percentages, not model forecasts.',book:'CLOB per-token bids/asks; book hash is not a transaction hash. Not a list of executed orders.',trades:'Public Data API v1 legacy endpoint used for this snapshot. transactionHash may link to polygonscan.com/tx/. Trades belong to public market participants, not PolyAgent.',globalTradeCount24h:'Unavailable in bounded snapshot. Do not infer from the latest 8 trades or invent.',eligibility:'Prototype threshold 50,000 applied to liquidityNum is a design assumption only, not a confirmed product or service approval.',tags:'Official market tags endpoint, not guessed categories.'},requests:sources},null,2)+'\n');
console.log(JSON.stringify({fetchedAt:snapshot.fetchedAt,markets:markets.length,orderBooks:orderBooks.length,trades:trades.length,errors,questions:markets.map(x=>x.question)},null,2));
