'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'site/dist');
process.env.DRAFTED_PREVIEW_SCENARIO ||= 'structured-context';
const {server:fixture}=require('./serve-editor-preview.cjs');
const coverage=require('../backend/cv-coverage.cjs').createHandler({model:require('../backend/cv-coverage-fixture.cjs').model,modelName:'synthetic-fixture-only'});
const selectionProvider=require('../backend/cv-selection.cjs');
const selectionMode=process.env.DRAFTED_SELECTION_PROVIDER||'simulated';
if(!['simulated','openai'].includes(selectionMode))throw Error('UNKNOWN_SELECTION_PROVIDER');
if(selectionMode==='openai'&&process.env.DRAFTED_EXTERNAL_MODEL_APPROVAL!=='cv-selection-local-approved')throw Error('EXTERNAL_MODEL_APPROVAL_REQUIRED');
if(selectionMode==='openai'&&!process.env.OPENAI_API_KEY)throw Error('OPENAI_API_KEY_REQUIRED');
const selectionModel=selectionMode==='openai'?require('../backend/openai-cv-provider.cjs').createProvider({apiKey:process.env.OPENAI_API_KEY,approved:true,maxCalls:6}):selectionProvider.fixture;
// Source-answer integration is a separate, explicitly enabled provider. Never
// silently route user answers to the fixture or spend a selection-only budget.
const tailorMode=process.env.DRAFTED_TAILOR_PROVIDER||'simulated';
const revisionMode=process.env.DRAFTED_REVISION_PROVIDER||'simulated';
if(!['simulated','public-gateway'].includes(revisionMode))throw Error('UNKNOWN_REVISION_PROVIDER');
if(!['simulated','openai'].includes(tailorMode))throw Error('UNKNOWN_TAILOR_PROVIDER');
if(tailorMode==='openai'&&process.env.DRAFTED_TAILOR_MODEL_APPROVAL!=='tailoring-local-approved')throw Error('TAILOR_MODEL_APPROVAL_REQUIRED');
if(tailorMode==='openai'&&!process.env.OPENAI_API_KEY)throw Error('OPENAI_API_KEY_REQUIRED');
const tailorModel=tailorMode==='openai'?require('../backend/openai-cv-provider.cjs').createProvider({apiKey:process.env.OPENAI_API_KEY,approved:true,maxCalls:6}):null;
const realTailor=tailorModel&&require('../backend/tailor-integration.cjs').createHandler({model:(input,prompt)=>tailorModel({input,prompt})});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf','.wasm':'application/wasm','.png':'image/png','.ico':'image/vnd.microsoft.icon','.jpg':'image/jpeg','.mp4':'video/mp4'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),p=url.pathname;
 if(req.method==='POST'&&p==='/preview-api/tailor'&&realTailor){
  req.setEncoding('utf8');let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1000000){res.writeHead(413);return res.end();}}
  let input;try{input=JSON.parse(body);}catch{res.writeHead(400);return res.end();}
  const result=await realTailor(input);
  res.writeHead(result.status,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify(result.body));
 }
 if(req.method==='POST'&&p==='/preview-api/cv-selection'){
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1000000){res.writeHead(413);return res.end();}}
  let input;try{input=JSON.parse(body);}catch{res.writeHead(400);return res.end();}
  const result=await selectionProvider.createHandler({model:selectionModel})(input);
  res.writeHead(result.status,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify({...result.body,providerMode:selectionMode}));
 }
 if(req.method==='POST'&&p==='/preview-api/tailor-revise'){
  req.setEncoding('utf8');let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>2000000){res.writeHead(413);return res.end();}}
  let input;try{input=JSON.parse(body);}catch{res.writeHead(400);return res.end();}
  if(revisionMode==='public-gateway'){
   if(req.headers.origin!==`http://127.0.0.1:${server.address().port}`){res.writeHead(403,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:false,error:'Local editor origin required.'}));}
   try{
    const upstream=await fetch('https://getmedrafted.com/api/webhook/tailor-cv',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://getmedrafted.com'},body:JSON.stringify(input),signal:AbortSignal.timeout(100000)});
    res.writeHead(upstream.status,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(await upstream.text());
   }catch{res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:false,error:'Real revision gateway unavailable. No automatic retry.'}));}
  }
  const revision=require('../backend/tailor-section-revision.cjs'),result=await revision.createHandler({model:revision.fixture})(input);
  res.writeHead(result.status,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify(result.body));
 }

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
 if(p==='/local-config.js'){res.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'});return res.end(fs.readFileSync(file,'utf8')+'\nwindow.__DRAFTED_REVISION_LIVE__='+String(revisionMode==='public-gateway')+';');}
 const body=fs.readFileSync(file),type=types[path.extname(file)]||'application/octet-stream',compress=/html|javascript|css|json|svg/.test(type)&&(req.headers['accept-encoding']||'').includes('gzip');
 res.writeHead(200,{'Content-Type':type,...(compress?{'Content-Encoding':'gzip','Vary':'Accept-Encoding'}:{})});res.end(req.method==='HEAD'?undefined:compress?zlib.gzipSync(body):body);
});
server.listen(Number(process.env.PORT||8825),'127.0.0.1',()=>console.log(`Standalone Drafted, synthetic local backend: http://127.0.0.1:${server.address().port}/`));
