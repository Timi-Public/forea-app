import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=new URL('..',import.meta.url).pathname;
const data=JSON.parse(fs.readFileSync(path.join(root,'data/market-snapshot.json'),'utf8'));
assert(data.markets.length>=9,'At least 9 market samples required');
for(const market of data.markets){
  assert(market.prices.length===2&&market.prices.every(p=>p>=0&&p<=1),'Binary market probabilities must be valid');
  assert(fs.existsSync(path.join(root,market.localImage)),'Local market image is required');
}
for(const trade of data.trades)assert(/^0x[0-9a-f]{64}$/i.test(trade.transactionHash),'Valid public trade hash required');
for(const file of ['index.html','app.html','review.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
    const link=match[1];if(link.includes('${')||/^(https?:|data:)/.test(link))continue;
    assert(fs.existsSync(path.join(root,link)),`${file}: missing ${link}`);
  }
}
console.log(`Source checks passed: ${data.markets.length} markets, ${data.trades.length} public trades, local assets present.`);
