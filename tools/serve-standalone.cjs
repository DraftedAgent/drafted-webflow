'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'site/dist');
process.env.DRAFTED_PREVIEW_SCENARIO ||= 'structured-context';
const {server:fixture}=require('./serve-editor-preview.cjs');
const coverage=require('../backend/cv-coverage.cjs').createHandler({model:require('../backend/cv-coverage-fixture.cjs').model,modelName:'synthetic-fixture-only'});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),p=url.pathname;
 res.setHeader('Content-Security-Policy',"default-src 'self'; connect-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; frame-src 'self' blob:; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'");
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='POST'&&p==='/preview-api/coverage'){req.setEncoding('utf8');let text='',size=0;for await(const c of req){size+=Buffer.byteLength(c);if(size>1000000){res.writeHead(413);return res.end();}text+=c.toString();}let input;try{input=JSON.parse(text);}catch{res.writeHead(400);return res.end();}const result=await coverage(input);res.writeHead(result.status,{'Content-Type':'application/json'});return res.end(JSON.stringify(result.body));}
 // Local simulation consumes bytes in memory and never forwards or stores audio.
 if(req.method==='POST'&&p==='/preview-api/transcribe'){
  let size=0;try{for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024){res.writeHead(413);res.end();return;}}}catch{return;}
  if(!size){res.writeHead(400);res.end();return;}
  await new Promise(resolve=>setTimeout(resolve,1500));res.writeHead(200,{'Content-Type':'application/json'});
  return res.end(JSON.stringify({ok:true,text:'Simulerat diktat för lokal granskning. This is a simulated transcript, not a recognition of your recording.'}));
 }
 if((req.method==='POST'&&['/preview-api/upload','/preview-api/rewrite','/preview-api/chat','/preview-api/export','/preview-api/jobcontext','/preview-api/tailor','/webflow-experience-discovery'].includes(p))||(req.method==='GET'&&p==='/preview-status'))return fixture.emit('request',req,res);
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
 const evidence=p.startsWith('/evidence/'),base=evidence?path.join(root,'output/pdf/standalone'):dist;
 const rel=evidence?p.slice('/evidence/'.length):p==='/'?'index.html':/^\/editor\/?$/.test(p)?'editor/index.html':p.slice(1);
 const file=path.resolve(base,rel);
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});return res.end('<h1>Page not found</h1><a href="/">Back to Drafted</a>');}
 const body=fs.readFileSync(file),type=types[path.extname(file)]||'application/octet-stream',compress=/html|javascript|css|json|svg/.test(type)&&(req.headers['accept-encoding']||'').includes('gzip');
 res.writeHead(200,{'Content-Type':type,...(compress?{'Content-Encoding':'gzip','Vary':'Accept-Encoding'}:{})});res.end(req.method==='HEAD'?undefined:compress?zlib.gzipSync(body):body);
});
server.listen(Number(process.env.PORT||8825),'127.0.0.1',()=>console.log(`Standalone Drafted, synthetic local backend: http://127.0.0.1:${server.address().port}/`));
