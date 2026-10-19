import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Check the built output, not the source directory: an omitted allowlist entry
// must fail the build instead of becoming a deployed 404.
export function assertPublicResources(directory,config,manifest){
  const root=fileURLToPath(directory),missing=[];
  const exists=url=>{
    const file=path.resolve(root,'.'+url);
    return file.startsWith(root)&&fs.existsSync(file)&&fs.statSync(file).isFile();
  };
  const check=(value,from='index.html')=>{
    if(!value||value.startsWith('#'))return;
    const url=new URL(value,'https://assets.invalid/'+from);
    if(url.origin!=='https://assets.invalid'||url.pathname.startsWith('/api/'))return;
    const pathname=decodeURIComponent(url.pathname);
    if(exists(pathname))return;
    const rule=config.rewrites.find(item=>item.source.endsWith(':path*')?pathname.startsWith(item.source.slice(0,-6)):item.source===pathname);
    if(!/\.[a-z0-9]+$/i.test(pathname)&&rule&&exists(rule.destination))return;
    missing.push(from+' -> '+pathname);
  };
  const walk=(folder,prefix='')=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()
    ?walk(path.join(folder,entry.name),prefix+entry.name+'/'):[prefix+entry.name]);
  for(const file of walk(root)){
    if(file.endsWith('.html'))for(const match of fs.readFileSync(path.join(root,file),'utf8').matchAll(/\b(?:src|href)=["']([^"']+)["']/g))check(match[1],file);
    if(file.endsWith('.css'))for(const match of fs.readFileSync(path.join(root,file),'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g))check(match[1],file);
  }
  for(const rule of config.rewrites)check(rule.destination,'vercel.json');
  for(const entry of Object.values(manifest.departments))check(entry.catalog,'clinical manifest');
  for(const file of [...Object.values(manifest.bodies),...Object.values(manifest.scripts)])check(file,'clinical manifest');
  if(missing.length)throw new Error('Missing public resources:\n'+[...new Set(missing)].join('\n'));
}
