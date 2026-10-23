'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {createHandler}=require('../backend/experience-discovery.cjs'),{fixtureModel}=require('../backend/discovery-fixture-provider.cjs');
const pdfRenderer=require('../backend/cv-pdf.cjs').createPdfRenderer();
const repo=path.resolve(__dirname,'..'),calls=[];
const blocks=[{blockId:'summary-1',type:'summary',label:'Profil',order:1,text:'Jag har arbetat i ett digitalt produktteam.'},{blockId:'experience-1',type:'experience',label:'Erfarenhet',order:10,text:'Intervjuade fem användare och sammanställde deras synpunkter.',employer:'Exempelstudion',title:'Produktspecialist',startDate:'2022',endDate:'2024'}];
const jobContext={roleTitle:'Produktspecialist',seniority:'mid',surfaces:['app'],tone:'balanced',topPriorities:[{signal:'Prioritera arbetet och planera nästa leverans med utvecklare',weight:5},{signal:'Förstå användarnas behov genom intervjuer',weight:4},{signal:'Arbeta tillsammans med designers och utvecklare',weight:3}],mustHave:[],successMetrics:[],keywords:['product','planning','priority','delivery','research','interviews','collaboration','team','development','communication']};
const envelope=(b=blocks)=>({ok:true,blocksSchemaVersion:'1.0',cvVersionId:'preview-cv-1',cvTitle:'Alex Exempel',summaryOfChanges:'',blocks:b,rewrittenCv:b.map(b=>b.text).join('\n'),rewrittenCvLegacy:b.map(b=>b.text).join('\n')});
const paginationFixtures=require('../tests/fixtures/cv-pagination.cjs');
const pdfFixtures=require('../tests/fixtures/cv-pdf.cjs');
const pdfFixture=['short','multi','long-special','edited'].includes(process.env.DRAFTED_PREVIEW_PDF_CASE)?pdfFixtures[process.env.DRAFTED_PREVIEW_PDF_CASE]:null;
const paginationFixture=pdfFixture||(['short','multi','long'].includes(process.env.DRAFTED_PREVIEW_CV)?paginationFixtures[process.env.DRAFTED_PREVIEW_CV]:null);
const paginationDiscovery=paginationFixture&&createHandler({model:async data=>data.operation==='plan'?{topics:[]}:fixtureModel(data)});
const outcomeFixture=process.env.DRAFTED_PREVIEW_SCENARIO==='outcomes'?require('../tests/fixtures/discovery-outcomes.cjs'):null;
const outcomeDiscovery=outcomeFixture&&createHandler({model:async data=>{calls.push({operation:data.operation,conversationLanguage:data.request.conversationLanguage,synthetic:true});return outcomeFixture.model(data);}});
const discovery=createHandler({model:async data=>{calls.push({operation:data.operation,conversationLanguage:data.request.conversationLanguage,synthetic:true});const sv=data.request.conversationLanguage==='sv';if(data.operation==='plan')return {topics:[{key:'planning',question:sv?'Har du hjälpt ett team att prioritera arbetet och planera en leverans?':'Have you helped a team prioritize work and plan a delivery?',signalRefs:[{field:'topPriorities',index:0}],support:'unclear',evidence:[]},{key:'interviews',question:sv?'Har du pratat med användare?':'Have you talked with users?',signalRefs:[{field:'topPriorities',index:1}],support:'clear',evidence:[{blockId:'experience-1',quote:'Intervjuade fem användare och sammanställde deras synpunkter.'}]},{key:'collaboration',question:sv?'Har du arbetat tillsammans med designers och utvecklare?':'Have you worked with designers and developers?',signalRefs:[{field:'topPriorities',index:2}],support:'unclear',evidence:[]}]};return fixtureModel(data);}});
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),pathname=url.pathname;
 res.setHeader('Content-Security-Policy',"default-src 'self'; connect-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-src 'self' blob:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'");res.setHeader('Cache-Control','no-store');
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 if(req.method==='GET'&&pathname==='/preview-status')return json(200,{synthetic:true,externalModelCalls:0,calls});
 if(req.method==='POST'){
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1000000)return json(413,{error:'Preview input too large'});}
  if(pathname==='/webflow-experience-discovery'){let r;try{r=JSON.parse(body);}catch{return json(400,{error:'invalid JSON'});}const result=await (paginationDiscovery||outcomeDiscovery||discovery)(r);return json(result.status,result.body);}
  calls.push({operation:pathname,synthetic:true});
  if(pathname==='/preview-api/export'){
   let input;try{input=JSON.parse(body);}catch{return json(400,{ok:false,contractError:{code:'EXPORT_INPUT_INVALID',message:'The export request must be valid JSON.'}});}
   try {
    const result=await pdfRenderer.render(input);
    res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="CV.pdf"'});return res.end(result.pdf);
   } catch(error){return json(error.status||500,{ok:false,contractError:{code:error.status===400?'EXPORT_INPUT_INVALID':'EXPORT_RENDER_FAILED',message:error.status===400?error.message:'The PDF could not be rendered. Your CV is unchanged.'}});}
  }
  if(pathname==='/preview-api/rewrite'&&pdfFixture){
   let input;try{input=JSON.parse(body);}catch{return json(400,{ok:false,contractError:{code:'LOCAL_PREVIEW_ONLY',message:'Invalid synthetic edit request.'}});}
   if(input.instruction==='Apply the synthetic PDF edit.'){
    const updated=structuredClone(input.blocks);updated[0].text+='\nSynthetic edit applied for PDF verification.';
    return json(200,pdfFixtures.envelope({title:input.cvTitle,blocks:updated}));
   }
  }
  if(pathname==='/preview-api/upload')return json(200,paginationFixture?paginationFixtures.envelope(paginationFixture):outcomeFixture?{...envelope(outcomeFixture.blocks),cvTitle:'Sara Example'}:envelope());
  if(pathname==='/preview-api/jobcontext')return json(200,{ok:true,jobContextSchemaVersion:'1.0',jobContext:outcomeFixture?.jobContext||jobContext});
  // Unrelated external operations are safely blocked in the preview rather than faked as success.
  return json(503,{ok:false,contractError:{code:'LOCAL_PREVIEW_ONLY',message:'This action is outside the local discovery preview.'}});
 }
 if(req.method!=='GET')return json(404,{error:'Not found'});
 const target=path.resolve(repo,'.'+(pathname==='/'?'/webflow/preview/editor.html':pathname));if(!target.startsWith(repo+path.sep))return json(404,{error:'Not found'});
 fs.readFile(target,(e,data)=>{if(e)return json(404,{error:'Not found'});res.writeHead(200,{'Content-Type':target.endsWith('.html')?'text/html; charset=utf-8':target.endsWith('.css')?'text/css':target.endsWith('.js')?'text/javascript':'application/octet-stream'});res.end(data);});
});
server.listen(Number(process.env.PORT||8771),'127.0.0.1',()=>console.log(`Whole editor, local synthetic preview: http://127.0.0.1:${server.address().port}/`));
server.on('close',()=>pdfRenderer.close());
module.exports={server};
