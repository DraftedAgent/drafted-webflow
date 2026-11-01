// Invitation-only test gateway. No CVs, request bodies or credentials are stored.
const upstream = 'https://drafted.app.n8n.cloud';
const allowed = new Set(['webflow-upload-cv','webflow-editor-rewrite','webflow-chat-cv','webflow-export-pdf','webflow-jobcontext-extract','tailor-cv','webflow-experience-discovery'].map(x=>'/webhook/'+x));
const publicOrigin = 'https://thisismywork.app';
const security = {
  'Cache-Control':'no-store', 'X-Robots-Tag':'noindex, nofollow, noarchive',
  'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff',
  'Content-Security-Policy':"default-src 'self'; connect-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; frame-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};
function response(body,status=200,headers={}) {return new Response(body,{status,headers:{...security,...headers}});}
function failure(message,status){return response(JSON.stringify({ok:false,error:message}),status,{'Content-Type':'application/json'});}
async function digest(value){return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));}
async function authorized(request,env){
  if(!env.TEST_PASSWORD || env.TEST_PASSWORD.length<24)return false;
  let decoded='';try{const a=request.headers.get('Authorization')||'';if(!a.startsWith('Basic '))return false;decoded=atob(a.slice(6));}catch{return false;}
  const a=await digest(decoded),b=await digest('tester:'+env.TEST_PASSWORD);let diff=0;
  for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
export default {async fetch(request,env){
  const origin=env.PUBLIC_ORIGIN||publicOrigin;
  const url=new URL(request.url);
  if(url.origin!==origin)return response('Not found',404);
  if(!await authorized(request,env))return response('Drafted invitation required.',401,{'WWW-Authenticate':'Basic realm="Drafted invited testers", charset="UTF-8"'});
  if(url.pathname.startsWith('/api/')){
    const path=url.pathname.slice(4);
    if(!allowed.has(path)||url.search||request.method!=='POST')return failure('Request not allowed.',405);
    if(request.headers.get('Origin')!==origin)return failure('Invalid request origin.',403);
    if(env.LIVE_BACKEND!=='enabled')return failure('Real processing has not been enabled on this deployment.',503);
    const type=request.headers.get('Content-Type')||'';
    if(!/^(application\/json|multipart\/form-data)(;|$)/i.test(type))return failure('Unsupported document request.',415);
    // Bound actual bytes, not just the caller-supplied Content-Length.
    const reader=request.body?.getReader();if(!reader)return failure('Empty request.',400);
    let size=0;const chunks=[];
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>15*1024*1024){await reader.cancel();return failure('Maximum upload size is 15 MB.',413);}chunks.push(value);}
    const body=new Uint8Array(size);let offset=0;for(const c of chunks){body.set(c,offset);offset+=c.byteLength;}
    const gate=env.TEST_BUDGET.get(env.TEST_BUDGET.idFromName('invited-test-round-1'));
    const ticket=crypto.randomUUID();
    const reservation=await gate.fetch(new Request('https://budget/reserve',{method:'POST',body:JSON.stringify({ticket})}));
    if(!reservation.ok)return failure(await reservation.text(),429);
    try{
      const result=await fetch(upstream+path,{method:'POST',headers:{'Content-Type':type,'Origin':origin},body,redirect:'error',signal:AbortSignal.timeout(180000)});
      // Do not relay upstream cookies, credentials, redirects or CORS headers.
      return response(await result.arrayBuffer(),result.status,{'Content-Type':result.headers.get('Content-Type')||'application/json'});
    }catch{return failure('The analysis request was interrupted. Please retry explicitly if needed.',502);}
    finally{await gate.fetch(new Request('https://budget/release',{method:'POST',body:JSON.stringify({ticket})}));}
  }
  if(!['GET','HEAD'].includes(request.method))return response('Method not allowed',405);
  const assetUrl=new URL(request.url);
  if(assetUrl.pathname==='/')assetUrl.pathname='/index.html';
  if(assetUrl.pathname==='/editor'||assetUrl.pathname==='/editor/')assetUrl.pathname='/editor/index.html';
  const asset=await env.ASSETS.fetch(new Request(assetUrl,{method:request.method}));
  const headers=new Headers(asset.headers);for(const [k,v] of Object.entries(security))headers.set(k,v);
  return new Response(asset.body,{status:asset.status,headers});
}};

export class TestBudget {
  constructor(state){this.state=state;}
  async fetch(request){
    const {ticket}=await request.json();if(typeof ticket!=='string')return new Response('Invalid ticket',{status:400});
    const reserve=new URL(request.url).pathname==='/reserve';
    return this.state.storage.transaction(async tx=>{
      const now=Date.now(),data=await tx.get('budget')||{used:0,recent:[],leases:{}};
      data.recent=data.recent.filter(t=>t>now-60000);
      for(const [id,expiry] of Object.entries(data.leases))if(expiry<now)delete data.leases[id];
      if(reserve){
        if(data.used>=100)return new Response('The test round has reached its request limit. Contact the test organiser.',{status:429});
        if(Object.keys(data.leases).length>=2||data.recent.length>=20)return new Response('The test service is busy. Please wait before trying again.',{status:429});
        data.used++;data.recent.push(now);data.leases[ticket]=now+300000;
      }else delete data.leases[ticket];
      await tx.put('budget',data);return new Response('OK');
    });
  }
}
