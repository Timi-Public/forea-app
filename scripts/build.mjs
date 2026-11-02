import {cp,mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const dist=path.join(root,'dist');
await mkdir(dist,{recursive:true});
for(const file of ['index.html','app.html','review.html','styles.css','theme.js','app.js','pages.js','icons.js','README.md','assets']){
  await cp(path.join(root,file),path.join(dist,file),{recursive:true});
}
await mkdir(path.join(dist,'data'),{recursive:true});
for(const file of ['market-snapshot.json','sources.json'])await cp(path.join(root,'data',file),path.join(dist,'data',file));
await writeFile(path.join(dist,'.nojekyll'),'');
const hash=createHash('sha256');
for(const file of ['theme.js','app.js','pages.js','icons.js','styles.css'])hash.update(await readFile(path.join(root,file)));
const buildId=hash.digest('hex').slice(0,12);
const app=(await readFile(path.join(dist,'app.html'),'utf8')).replace(/(src|href)="(theme\.js|app\.js|pages\.js|icons\.js|styles\.css)(?:\?[^\"]*)?"/g,(_,attr,file)=>`${attr}="${file}?v=${buildId}"`);
await writeFile(path.join(dist,'app.html'),app);
const index=(await readFile(path.join(dist,'index.html'),'utf8')).replace("phone.src='app.html'+location.search",`phone.src='app.html?build=${buildId}'+(location.search?'&'+location.search.slice(1):'')`).replaceAll('href="app.html#',`href="app.html?build=${buildId}#`);
await writeFile(path.join(dist,'index.html'),index);
await writeFile(path.join(dist,'review.html'),(await readFile(path.join(dist,'review.html'),'utf8')).replaceAll('app.html?',`app.html?build=${buildId}&`));
console.log('Built static mobile app in dist/');
