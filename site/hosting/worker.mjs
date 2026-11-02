import Coverage from '../../webflow/src/cv-coverage-contract.js';
import {inspectWav} from '../../backend/dictation-wav.cjs';
// Open test gateway. No CVs, request bodies or credentials are stored.
const upstream = 'https://drafted.app.n8n.cloud';
const allowed = new Set(['webflow-upload-cv','webflow-editor-rewrite','webflow-chat-cv','webflow-export-pdf','webflow-jobcontext-extract','tailor-cv','webflow-experience-discovery'].map(x=>'/webhook/'+x));
const publicOrigin = 'https://getmedrafted.com';
const security = {
  'Cache-Control':'no-store', 'X-Robots-Tag':'noindex, nofollow, noarchive',
  'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff',
  'Content-Security-Policy':"default-src 'self'; connect-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; frame-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};
function response(body,status=200,headers={}) {return new Response(body,{status,headers:{...security,...headers}});}
function failure(message,status){return response(JSON.stringify({ok:false,error:message}),status,{'Content-Type':'application/json'});}
export default {async fetch(request,env){
  const origin=env.PUBLIC_ORIGIN||publicOrigin;
  const url=new URL(request.url);
  if(url.origin!==origin)return response('Not found',404);
  if(url.pathname.startsWith('/api/')){
    const path=url.pathname.slice(4),coverage=path==='/coverage',dictation=path==='/dictation';
    if((!allowed.has(path)&&!coverage&&!dictation)||url.search||request.method!=='POST')return failure('Request not allowed.',405);
    if(request.headers.get('Origin')!==origin)return failure('Invalid request origin.',403);
    if(env.LIVE_BACKEND!=='enabled')return failure('Real processing has not been enabled on this deployment.',503);
    const type=request.headers.get('Content-Type')||'';
    if((dictation?!/^audio\/wav(;|$)/i.test(type):coverage?!/^application\/json(;|$)/i.test(type):!/^(application\/json|multipart\/form-data)(;|$)/i.test(type)))return failure('Unsupported document request.',415);
    if((coverage&&!env.COVERAGE_GATEWAY_KEY)||(dictation&&!env.DICTATION_GATEWAY_KEY))return failure('This feature is not connected yet.',503);
    const limit=coverage?Coverage.LIMIT:dictation?3840044:15*1024*1024;
    // Bound actual bytes, not just the caller-supplied Content-Length.
    const reader=request.body?.getReader();if(!reader)return failure('Empty request.',400);
    let size=0;const chunks=[];
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();return failure(dictation?'Maximum recording is two minutes.':coverage?'Coverage input is too large.':'Maximum upload size is 15 MB.',413);}chunks.push(value);}
    const body=new Uint8Array(size);let offset=0;for(const c of chunks){body.set(c,offset);offset+=c.byteLength;}
    let coverageRequest;try{if(coverage){coverageRequest=JSON.parse(new TextDecoder().decode(body));await Coverage.validateRequest(coverageRequest);}if(dictation)inspectWav(body);}catch{return failure('Invalid feature input. Your existing work is unchanged.',400);}
    const headers={'Content-Type':type,'Origin':origin};let payload=body,route=path;
    if(coverage){route='/webhook/drafted-cv-coverage-v1';headers['X-Drafted-Coverage']=env.COVERAGE_GATEWAY_KEY;}
    if(dictation){route='/webhook/drafted-transcribe';headers['Content-Type']='application/json';headers['X-Drafted-Dictation']=env.DICTATION_GATEWAY_KEY;let audio;if(typeof body.toBase64==='function')audio=body.toBase64();else{const parts=[];for(let i=0;i<body.length;i+=32768)parts.push(String.fromCharCode(...body.subarray(i,i+32768)));audio=btoa(parts.join(''));}payload=JSON.stringify({audio});}
    const gate=env.TEST_BUDGET.get(env.TEST_BUDGET.idFromName('invited-test-round-1'));
    const ticket=crypto.randomUUID();
    const reservation=await gate.fetch(new Request('https://budget/reserve',{method:'POST',body:JSON.stringify({ticket})}));
    if(!reservation.ok)return failure(await reservation.text(),429);
    try{
      const result=await fetch(upstream+route,{method:'POST',headers,body:payload,redirect:'manual',signal:AbortSignal.timeout(180000)});
      if(result.status>=300&&result.status<400)return failure('Unexpected backend redirect. Contact the test organiser.',502);
      if(coverage||dictation){
        const reader=result.body?.getReader();if(!reader)return failure('Empty feature response.',502);let bytes=0,parts=[];while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>Coverage.LIMIT){await reader.cancel();return failure('Feature response was too large.',502);}parts.push(value);}const joined=new Uint8Array(bytes);let cursor=0;for(const p of parts){joined.set(p,cursor);cursor+=p.length;}
        let data;try{data=JSON.parse(new TextDecoder().decode(joined));if(!result.ok||data.ok!==true)throw Error('UPSTREAM_FAILED');if(coverage){if(data.coverageSchemaVersion!==Coverage.VERSION||data.operation!==coverageRequest.operation||data.requestId!==coverageRequest.requestId)throw Error('STALE_RESPONSE');await Coverage.validateResult(coverageRequest,data.result);}else if(typeof data.text!=='string'||!data.text.trim()||data.text.length>20000)throw Error('INVALID_TRANSCRIPT');}catch{return failure('The request could not be completed safely. Your existing work is unchanged.',502);}
        return response(JSON.stringify(coverage?data:{ok:true,text:data.text}),200,{'Content-Type':'application/json'});
      }
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
