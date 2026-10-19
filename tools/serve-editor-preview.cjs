'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {createHandler}=require('../backend/experience-discovery.cjs'),{fixtureModel}=require('../backend/discovery-fixture-provider.cjs');
const repo=path.resolve(__dirname,'..'),calls=[];
const blocks=[{blockId:'summary-1',type:'summary',label:'Profil',order:1,text:'Jag har arbetat i ett digitalt produktteam.'},{blockId:'experience-1',type:'experience',label:'Erfarenhet',order:10,text:'Intervjuade fem användare och sammanställde deras synpunkter.',employer:'Exempelstudion',title:'Produktspecialist',startDate:'2022',endDate:'2024'}];
const jobContext={roleTitle:'Produktspecialist',seniority:'mid',surfaces:['app'],tone:'balanced',topPriorities:[{signal:'Prioritera arbetet och planera nästa leverans med utvecklare',weight:5},{signal:'Förstå användarnas behov genom intervjuer',weight:4},{signal:'Arbeta tillsammans med designers och utvecklare',weight:3}],mustHave:[],successMetrics:[],keywords:['product','planning','priority','delivery','research','interviews','collaboration','team','development','communication']};
const envelope=(b=blocks)=>({ok:true,blocksSchemaVersion:'1.0',cvVersionId:'preview-cv-1',cvTitle:'Alex Exempel',summaryOfChanges:'',blocks:b,rewrittenCv:b.map(b=>b.text).join('\n'),rewrittenCvLegacy:b.map(b=>b.text).join('\n')});
const discovery=createHandler({model:async data=>{calls.push({operation:data.operation,synthetic:true});const sv=data.request.conversationLanguage==='sv';if(data.operation==='plan')return {topics:[{key:'planning',question:sv?'Har du hjälpt ett team att prioritera arbetet och planera en leverans?':'Have you helped a team prioritize work and plan a delivery?',signalRefs:[{field:'topPriorities',index:0}],support:'unclear',evidence:[]},{key:'interviews',question:sv?'Har du pratat med användare?':'Have you talked with users?',signalRefs:[{field:'topPriorities',index:1}],support:'clear',evidence:[{blockId:'experience-1',quote:'Intervjuade fem användare och sammanställde deras synpunkter.'}]},{key:'collaboration',question:sv?'Har du arbetat tillsammans med designers och utvecklare?':'Have you worked with designers and developers?',signalRefs:[{field:'topPriorities',index:2}],support:'unclear',evidence:[]}]};return fixtureModel(data);}});
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),pathname=url.pathname;
 res.setHeader('Content-Security-Policy',"default-src 'self'; connect-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-src 'self' blob:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'");res.setHeader('Cache-Control','no-store');
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 if(req.method==='GET'&&pathname==='/preview-status')return json(200,{synthetic:true,externalModelCalls:0,calls});
 if(req.method==='POST'){
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1000000)return json(413,{error:'Preview input too large'});}
  if(pathname==='/webflow-experience-discovery'){let r;try{r=JSON.parse(body);}catch{return json(400,{error:'invalid JSON'});}const result=await discovery(r);return json(result.status,result.body);}
  calls.push({operation:pathname,synthetic:true});
  if(pathname==='/preview-api/upload')return json(200,envelope());
  if(pathname==='/preview-api/jobcontext')return json(200,{ok:true,jobContextSchemaVersion:'1.0',jobContext});
  // Unrelated external operations are safely blocked in the preview rather than faked as success.
  return json(503,{ok:false,contractError:{code:'LOCAL_PREVIEW_ONLY',message:'This action is outside the local discovery preview.'}});
 }
 if(req.method!=='GET')return json(404,{error:'Not found'});
 const target=path.resolve(repo,'.'+(pathname==='/'?'/webflow/preview/editor.html':pathname));if(!target.startsWith(repo+path.sep))return json(404,{error:'Not found'});
 fs.readFile(target,(e,data)=>{if(e)return json(404,{error:'Not found'});res.writeHead(200,{'Content-Type':target.endsWith('.html')?'text/html; charset=utf-8':target.endsWith('.css')?'text/css':target.endsWith('.js')?'text/javascript':'application/octet-stream'});res.end(data);});
});
server.listen(Number(process.env.PORT||8771),'127.0.0.1',()=>console.log(`Whole editor, local synthetic preview: http://127.0.0.1:${server.address().port}/`));
module.exports={server};
