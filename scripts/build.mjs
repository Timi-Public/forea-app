import {cp,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const dist=path.join(root,'dist');
await mkdir(dist,{recursive:true});
for(const file of ['index.html','app.html','review.html','styles.css','app.js','pages.js','icons.js','README.md','assets']){
  await cp(path.join(root,file),path.join(dist,file),{recursive:true});
}
await mkdir(path.join(dist,'data'),{recursive:true});
for(const file of ['market-snapshot.json','sources.json'])await cp(path.join(root,'data',file),path.join(dist,'data',file));
await writeFile(path.join(dist,'.nojekyll'),'');
console.log('Built static mobile app in dist/');
