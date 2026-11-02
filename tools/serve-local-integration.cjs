'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),zlib=require('node:zlib');
const R=require('../site/integration/runtime.cjs'),dist=path.resolve(__dirname,'../site/integration-dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/vnd.microsoft.icon','.ttf':'font/ttf','.wasm':'application/wasm'};
function createServer({enabled=false}={}){
 if(typeof enabled!=='boolean')throw Error('Explicit boolean required');
 const dictation=require('../backend/dictation-local-gateway.cjs').create({enabled});
 const coverage=require('../backend/cv-coverage-gateway.cjs').create({enabled});
 const server=http.createServer((req,res)=>{
  const origin='http://127.0.0.1:'+server.address().port;
  if(req.headers.host!==new URL(origin).host){res.writeHead(403);return res.end('Use '+origin);}
  for(const [k,v]of Object.entries(R.headers(enabled)))res.setHeader(k,v);
  if(new URL(req.url,origin).pathname==='/api/coverage')return coverage.handle(req,res,origin);
  if(new URL(req.url,origin).pathname==='/api/dictation')return dictation.handle(req,res,origin);
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('No local backend or proxy in integration mode.');}
  const p=new URL(req.url,origin).pathname,rel=p==='/'?'index.html':/^\/editor\/?$/.test(p)?'editor/index.html':p.slice(1),file=path.resolve(dist,rel);
  if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});return res.end('<h1>Page not found</h1><a href="/">Back to Drafted</a>');}
  let body=fs.readFileSync(file);const type=types[path.extname(file)]||'application/octet-stream';
  if(p==='/local-config.js')body=Buffer.from(R.runtime(origin)+(coverage.available?"\nwindow.__DRAFTED_COVERAGE__=Object.freeze({enabled:true,endpoint:'/api/coverage',mode:'integration-live'});\n":'')+(dictation.available?"\nwindow.__DRAFTED_DICTATION__=Object.freeze({mode:'live',endpoint:'/api/dictation'});\n":''));
  if(path.extname(file)==='.html'&&enabled)body=Buffer.from(body.toString().replace('data-mode="integration-blocked"','data-mode="integration-live"').replace('Integration · spärrad','Integration · riktiga anrop').replace('Inga riktiga anrop tillåtna','Ditt CV skickas till n8n och AI').replace('<script src="/local-config.js">','<script>window.__DRAFTED_INTEGRATION_APPROVED__=true;</script><script src="/local-config.js">'));
  const compress=/html|javascript|css|json|svg/.test(type)&&(req.headers['accept-encoding']||'').includes('gzip');
  res.writeHead(200,{'Content-Type':type,...(compress?{'Content-Encoding':'gzip','Vary':'Accept-Encoding'}:{})});res.end(req.method==='HEAD'?undefined:compress?zlib.gzipSync(body):body);
 });return server;
}
if(require.main===module){const args=process.argv.slice(2);if(args.some(a=>a!=='--enable-real-backend'))throw Error('Unknown option');const enabled=args.includes('--enable-real-backend'),server=createServer({enabled});server.listen(8826,'127.0.0.1',()=>console.log(`${enabled?'REAL n8n/AI calls enabled — use only after owner approval':'Integration BLOCKED — no real calls'}: ${R.origin}/`));}
module.exports={createServer};
