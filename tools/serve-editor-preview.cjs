'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {createHandler}=require('../backend/experience-discovery.cjs'),{fixtureModel}=require('../backend/discovery-fixture-provider.cjs');
const sourceFixture=['sources','sources-n8n'].includes(process.env.DRAFTED_PREVIEW_SCENARIO)?require('../tests/fixtures/tailor-sources.cjs'):null;
const sourceDiscovery=sourceFixture&&createHandler({model:async data=>{calls.push({operation:data.operation,synthetic:true});return sourceFixture.discovery(data);}});
const sourceDefault=sourceFixture&&require('../backend/tailor-sources.cjs').createHandler({model:sourceFixture.model});
const sourceCodeHarness=sourceFixture&&process.env.DRAFTED_PREVIEW_SCENARIO==='sources-n8n'&&require('../tests/helpers/tailor-workflow-harness.cjs').createHarness({model:input=>require('../tests/helpers/tailor-workflow-harness.cjs').response(sourceFixture.model(input))});
const sourceTailor=sourceFixture&&(request=>sourceCodeHarness&&request&&typeof request==='object'&&!Array.isArray(request)?sourceCodeHarness(request):sourceDefault(request));
const repo=path.resolve(__dirname,'..'),calls=[];
const blocks=[{blockId:'summary-1',type:'summary',label:'Profil',order:1,text:'Jag har arbetat i ett digitalt produktteam.'},{blockId:'experience-1',type:'experience',label:'Erfarenhet',order:10,text:'Intervjuade fem användare och sammanställde deras synpunkter.',employer:'Exempelstudion',title:'Produktspecialist',startDate:'2022',endDate:'2024'}];
const jobContext={roleTitle:'Produktspecialist',seniority:'mid',surfaces:['app'],tone:'balanced',topPriorities:[{signal:'Prioritera arbetet och planera nästa leverans med utvecklare',weight:5},{signal:'Förstå användarnas behov genom intervjuer',weight:4},{signal:'Arbeta tillsammans med designers och utvecklare',weight:3}],mustHave:[],successMetrics:[],keywords:['product','planning','priority','delivery','research','interviews','collaboration','team','development','communication']};
const envelope=(b=blocks)=>({ok:true,blocksSchemaVersion:'1.0',cvVersionId:'preview-cv-1',cvTitle:'Alex Exempel',summaryOfChanges:'',blocks:b,rewrittenCv:b.map(b=>b.text).join('\n'),rewrittenCvLegacy:b.map(b=>b.text).join('\n')});
const paginationFixtures=require('../tests/fixtures/cv-pagination.cjs');
const pdfFixtures=require('../tests/fixtures/cv-pdf.cjs');
const pdfFixture=pdfFixtures[process.env.DRAFTED_PREVIEW_PDF_CASE]||null;
const headerFixtures=require('../tests/fixtures/cv-header.cjs');
const headerFixture=headerFixtures.cases[process.env.DRAFTED_PREVIEW_HEADER_CASE];
const paginationFixture=headerFixture||pdfFixture||(['short','multi','long'].includes(process.env.DRAFTED_PREVIEW_CV)?paginationFixtures[process.env.DRAFTED_PREVIEW_CV]:null);
const paginationDiscovery=paginationFixture&&createHandler({model:async data=>data.operation==='plan'?{topics:[]}:fixtureModel(data)});
const outcomeFixture=process.env.DRAFTED_PREVIEW_SCENARIO==='outcomes'?require('../tests/fixtures/discovery-outcomes.cjs'):null;
const outcomeDiscovery=outcomeFixture&&createHandler({model:async data=>{calls.push({operation:data.operation,conversationLanguage:data.request.conversationLanguage,synthetic:true});return outcomeFixture.model(data);}});
const discovery=createHandler({model:async data=>{calls.push({operation:data.operation,conversationLanguage:data.request.conversationLanguage,synthetic:true});const sv=data.request.conversationLanguage==='sv';if(data.operation==='plan')return {topics:[{key:'planning',question:sv?'Har du hjälpt ett team att prioritera arbetet och planera en leverans?':'Have you helped a team prioritize work and plan a delivery?',signalRefs:[{field:'topPriorities',index:0}],support:'unclear',evidence:[]},{key:'interviews',question:sv?'Har du pratat med användare?':'Have you talked with users?',signalRefs:[{field:'topPriorities',index:1}],support:'clear',evidence:[{blockId:'experience-1',quote:'Intervjuade fem användare och sammanställde deras synpunkter.'}]},{key:'collaboration',question:sv?'Har du arbetat tillsammans med designers och utvecklare?':'Have you worked with designers and developers?',signalRefs:[{field:'topPriorities',index:2}],support:'unclear',evidence:[]}]};return fixtureModel(data);}});
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),pathname=url.pathname;
 res.setHeader('Content-Security-Policy',"default-src 'self'; connect-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-src 'self' blob:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'");res.setHeader('Cache-Control','no-store');
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 if(req.method==='GET'&&pathname==='/preview-status')return json(200,{synthetic:true,externalModelCalls:0,tailorProvider:process.env.DRAFTED_PREVIEW_SCENARIO==='sources-n8n'?'prepared-code-local-simulation':'synthetic-fixture',calls});
 if(req.method==='POST'){
  req.setEncoding('utf8');
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1000000)return json(413,{error:'Preview input too large'});}
  if(pathname==='/webflow-experience-discovery'){let r;try{r=JSON.parse(body);}catch{return json(400,{error:'invalid JSON'});}const result=await (sourceDiscovery||paginationDiscovery||outcomeDiscovery||discovery)(r);return json(result.status,result.body);}
  calls.push({operation:pathname,synthetic:true});
  if(pathname==='/preview-api/rewrite'&&sourceFixture){const input=JSON.parse(body),next=structuredClone(input.blocks);next.find(b=>b.blockId==='project-1').text+='\nManual edit';return json(200,{...envelope(next),cvTitle:input.cvTitle||'Alex Example',cvVersionId:input.cvVersionId});}
  if(pathname==='/preview-api/rewrite'&&headerFixture){const updated=structuredClone(headerFixture);updated.blocks.find(b=>b.type==='summary').text+='\nSynthetic header verification edit.';return json(200,headerFixtures.envelope(updated));}
  if(pathname==='/preview-api/upload')return json(200,sourceFixture?{...envelope(sourceFixture.blocks),cvTitle:'Alex Example'}:paginationFixture?paginationFixtures.envelope(paginationFixture):outcomeFixture?{...envelope(outcomeFixture.blocks),cvTitle:'Sara Example'}:envelope());
  if(pathname==='/preview-api/jobcontext')return json(200,{ok:true,jobContextSchemaVersion:'1.0',jobContext:sourceFixture?.jobContext||outcomeFixture?.jobContext||jobContext});
  if(pathname==='/preview-api/tailor'&&sourceTailor){
    let input;try{input=JSON.parse(body);}catch{const error=await sourceTailor(null);return json(error.status,error.body);}
    if(!input||typeof input!=='object'||Array.isArray(input)){const error=await sourceTailor(null);return json(error.status,error.body);}
    const typed=('sourcesSchemaVersion' in input||'sourceContext' in input);
    const request=typed?input:{...input,sourcesSchemaVersion:'1.0',sourceContext:{contextRevision:'preview-before-plan',roundId:'preview-before-plan',questions:[],answers:[],applications:[]}};
    const result=await sourceTailor(request);return json(result.status,!typed&&result.body.ok?require('../webflow/src/tailor-sources.js').withoutReceipt(result.body):result.body);
  }
  // Explicit synthetic transition demo, never an external Tailor proxy.
  if(pathname==='/preview-api/tailor'&&process.env.DRAFTED_PREVIEW_SCENARIO==='transition'){
    const input=JSON.parse(body),next=structuredClone(input.blocks);
    const block=next.find(b=>b.type==='summary');if(block)block.text='Erfarenhet av arbete i ett digitalt produktteam.';
    return json(200,{...envelope(next),cvTitle:input.cvTitle,cvVersionId:'preview-tailor-1'});
  }
  // Unrelated external operations are safely blocked in the preview rather than faked as success.
  return json(503,{ok:false,contractError:{code:'LOCAL_PREVIEW_ONLY',message:'This action is outside the local discovery preview.'}});
 }
 if(req.method!=='GET')return json(404,{error:'Not found'});
 if(req.method==='GET'&&pathname==='/webflow/preview/editor-fixture.js'){const script=fs.readFileSync(path.join(repo,'webflow/preview/editor-fixture.js'),'utf8');res.writeHead(200,{'Content-Type':'text/javascript'});return res.end(script.replace("tailor:'/preview-api/tailor'","tailor:'/preview-api/tailor',tailorSources:"+!!sourceFixture));}
 const target=path.resolve(repo,'.'+(pathname==='/'?'/webflow/preview/editor.html':pathname));if(!target.startsWith(repo+path.sep))return json(404,{error:'Not found'});
 fs.readFile(target,(e,data)=>{if(e)return json(404,{error:'Not found'});res.writeHead(200,{'Content-Type':target.endsWith('.html')?'text/html; charset=utf-8':target.endsWith('.css')?'text/css':(/\.m?js$/.test(target))?'text/javascript':target.endsWith('.wasm')?'application/wasm':'application/octet-stream'});res.end(data);});
});
server.listen(Number(process.env.PORT||8771),'127.0.0.1',()=>console.log(`Whole editor, local synthetic preview: http://127.0.0.1:${server.address().port}/`));
module.exports={server};
