import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{TestBudget} from '../site/hosting/worker.mjs';
const origin='https://getmedrafted.com', password='synthetic-test-password-123456789';
function storage(){const map=new Map();let queue=Promise.resolve();const tx={get:async k=>structuredClone(map.get(k)),put:async(k,v)=>map.set(k,structuredClone(v))};return {...tx,transaction:fn=>{const p=queue.then(()=>fn(tx));queue=p.catch(()=>{});return p;}};}
function environment(){const db=storage(),budget=new TestBudget({storage:db});let assetPath='';return {LIVE_BACKEND:'enabled',TEST_PASSWORD:password,TEST_BUDGET:{idFromName:x=>x,get:()=>budget},ASSETS:{fetch:async r=>{assetPath=new URL(r.url).pathname;return new Response('<html>app</html>');}},db,path:()=>assetPath};}
const auth={Authorization:'Basic '+btoa('tester:'+password)};
function request(path='/',headers={}){return new Request(origin+path,{headers});}
function api(extra={}){return new Request(origin+'/api/webhook/webflow-chat-cv',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...extra},body:'{"message":"synthetic"}'});}
test('anonymous home/assets/editor are open, wrong host closed',async()=>{
 const env=environment();for(const path of ['/','/editor','/drafted-editor.js']){const r=await worker.fetch(request(path,{}),env);assert.equal(r.status,200);assert.equal(r.headers.get('WWW-Authenticate'),null);}
 assert.equal((await worker.fetch(new Request('https://other.example/'),env)).status,404);
 assert.equal((await worker.fetch(request('/',{}),{...env,TEST_PASSWORD:''})).status,200);
});
test('direct routes resolve real HTML and never bypass worker security',async()=>{
 const env=environment();for(const [url,path] of [['/','/index.html'],['/editor','/editor/index.html'],['/editor/','/editor/index.html']]){
 const result=await worker.fetch(request(url),env);assert.equal(result.status,200);assert.equal(env.path(),path);assert.equal(result.headers.get('Cache-Control'),'no-store');assert.match(result.headers.get('Content-Security-Policy'),/connect-src 'self';/);
 }
});
test('rejects foreign origins, unapproved paths, methods and oversized bodies before spending budget',async()=>{
 const env=environment();assert.equal((await worker.fetch(api({Origin:'https://evil.example'}),env)).status,403);
 assert.equal((await worker.fetch(request('/api/webhook/not-allowed'),env)).status,405);
 assert.equal((await worker.fetch(api({'Content-Type':'text/plain'}),env)).status,415);
 const large=new Request(origin+'/api/webhook/webflow-upload-cv',{method:'POST',headers:{Origin:origin,'Content-Type':'multipart/form-data; boundary=test'},body:new Uint8Array(15*1024*1024+1)});
 assert.equal((await worker.fetch(large,env)).status,413);assert.equal(await env.db.get('budget'),undefined);
});
test('forwards exact request only to existing n8n, strips credentials, counts once, never retries',async()=>{
 const env=environment(),previous=globalThis.fetch;let calls=0;
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://drafted.app.n8n.cloud/webhook/webflow-chat-cv');assert.deepEqual(Object.keys(options.headers).sort(),['Content-Type','Origin']);assert.equal(new TextDecoder().decode(options.body),'{"message":"synthetic"}');assert.equal(options.redirect,'manual');return new Response('{"ok":true}',{headers:{'Set-Cookie':'private=1','Content-Type':'application/json'}});};
 try{const result=await worker.fetch(api(),env);assert.equal(result.status,200);assert.equal(result.headers.get('Set-Cookie'),null);assert.equal(calls,1);assert.equal((await env.db.get('budget')).used,1);assert.deepEqual((await env.db.get('budget')).leases,{});
 globalThis.fetch=async()=>{calls++;throw Error('network');};assert.equal((await worker.fetch(api(),env)).status,502);assert.equal(calls,2);assert.equal((await env.db.get('budget')).used,2);
 }finally{globalThis.fetch=previous;}
});
test('persistent atomic budget limits concurrency, rate, and cumulative spend across restarts',async()=>{
 const db=storage();let gate=new TestBudget({storage:db});const call=(route,ticket)=>gate.fetch(new Request('https://budget/'+route,{method:'POST',body:JSON.stringify({ticket})}));
 const results=await Promise.all(['a','b','c'].map(t=>call('reserve',t)));assert.deepEqual(results.map(r=>r.status),[200,200,429]);
 await call('release','a');await call('release','b');let data=await db.get('budget');data.used=100;await db.put('budget',data);
 gate=new TestBudget({storage:db});assert.equal((await call('reserve','d')).status,429);
 data.used=10;data.recent=Array(20).fill(Date.now());await db.put('budget',data);assert.equal((await call('reserve','e')).status,429);
 assert.equal((await db.get('budget')).used,10);
});

test('anonymous visitors/new tabs share the same persistent budget and kill switch',async()=>{
 const env=environment(),oldFetch=globalThis.fetch,ids=[];let calls=0;
 env.TEST_BUDGET.idFromName=id=>{ids.push(id);return id;};
 globalThis.fetch=async()=>{calls++;return new Response('{"ok":true}');};
 try{
  assert.equal((await worker.fetch(api(),{...env,LIVE_BACKEND:'disabled'})).status,503);assert.equal(calls,0);assert.equal(await env.db.get('budget'),undefined);
  await env.db.put('budget',{used:99,recent:[],leases:{}});
  assert.equal((await worker.fetch(api({'Cookie':'tab=first'}),env)).status,200);
  const newVisitor={...env,TEST_BUDGET:{idFromName:env.TEST_BUDGET.idFromName,get:()=>new TestBudget({storage:env.db})}};
  assert.equal((await worker.fetch(api(),newVisitor)).status,429);
  assert.equal((await worker.fetch(api({'Cookie':'tab=new','Authorization':'Basic unrelated'}),newVisitor)).status,429);
  assert.equal(calls,1);assert.equal((await env.db.get('budget')).used,100);assert.deepEqual([...new Set(ids)],['invited-test-round-1']);
 }finally{globalThis.fetch=oldFetch;}
});
