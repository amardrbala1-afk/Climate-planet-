import {readFile,writeFile} from 'node:fs/promises';
const path=new URL('../data/',import.meta.url);
const seed=JSON.parse(await readFile(new URL('cities-seed.json',path),'utf8'));
const url='https://raw.githubusercontent.com/lmfmaier/cities-json/master/cities500.json';
const needed=new Set(['SY','JO','LB','PS']);
let rows;
try{
 const response=await fetch(url,{signal:AbortSignal.timeout(45000),headers:{'User-Agent':'planet-of-climate-site-builder'}});
 if(!response.ok) throw new Error(`status ${response.status}`);
 const source=await response.json();
 if(!Array.isArray(source))throw new Error('Unexpected cities data format');
 const normalized=source.filter(c=>needed.has(c.country)&&Number.isFinite(Number(c.lat))&&Number.isFinite(Number(c.lon))).sort((a,b)=>Number(b.pop||0)-Number(a.pop||0));
 const result=[...seed];
 for(const c of normalized){
  if(result.length>=1000)break;
  // Use geodetic proximity and transliterated names to suppress duplicate seed localities.
  const lat=Number(c.lat),lon=Number(c.lon),name=String(c.name||'').trim();
  if(!name)continue;
  if(result.some(p=>p.country===c.country&&(p.name.toLowerCase()===name.toLowerCase()||(Math.abs(p.lat-lat)<.01&&Math.abs(p.lon-lon)<.01))))continue;
  result.push({id:`geo-${c.id}`,name,country:c.country,lat,lon,pop:Number(c.pop||0),source:'GeoNames'});
 }
 if(result.length<900)throw new Error(`Dataset yielded only ${result.length} unique places`);
 rows=result.slice(0,1000);
 console.log(`City catalogue updated to ${rows.length} actual locations from GeoNames (CC BY 4.0).`);
}catch(e){
 console.warn(`GeoNames import unavailable: ${e.message}. Using bundled ${seed.length} real named places. Re-run npm run cities once online.`);
 try{const existing=JSON.parse(await readFile(new URL('cities.json',path),'utf8'));rows=existing.length>=seed.length?existing:seed}catch{rows=seed}
}
await writeFile(new URL('cities.json',path),JSON.stringify(rows,null,0),'utf8');
