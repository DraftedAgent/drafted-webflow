'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process'),{inspectWav}=require('./dictation-wav.cjs');
const stateDir=path.join(process.env.LOCALAPPDATA||'', 'Drafted','dictation'),secretPath=path.join(process.env.USERPROFILE||'','.codex','secrets','drafted-dictation.credential.xml');
function loadSecret(){return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`$c=Import-Clixml -LiteralPath '${secretPath.replaceAll("'","''")}'; [Console]::Write($c.GetNetworkCredential().Password)`],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','ignore']}).trim();}
function create({enabled=false,fetchImpl=fetch,budgetFile=path.join(stateDir,'budget.json'),getSecret=loadSecret,credentialFile=secretPath}={}){
 let secret;const available=enabled&&fs.existsSync(credentialFile)&&fs.existsSync(budgetFile);
 function reserve(){const b=JSON.parse(fs.readFileSync(budgetFile,'utf8')),now=Date.now();if(b.enabled!==true)throw Error('Dictation is switched off.');b.recent=b.recent.filter(t=>t>now-60000);b.leases=Object.fromEntries(Object.entries(b.leases).filter(([,expiry])=>expiry>now));if(b.used>=100)throw Error('Dictation test limit reached.');if(b.recent.length>=10||Object.keys(b.leases).length>=2)throw Error('Dictation is busy. Please try again shortly.');const id=crypto.randomUUID();b.used++;b.recent.push(now);b.leases[id]=now+120000;write(b);return id;}
 function write(b){const temp=budgetFile+'.tmp';fs.writeFileSync(temp,JSON.stringify(b));fs.renameSync(temp,budgetFile);}
 function release(id){const b=JSON.parse(fs.readFileSync(budgetFile,'utf8'));delete b.leases[id];write(b);}
 return {available,async handle(req,res,origin){const reply=(status,body)=>{if(!res.destroyed){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));}};
  if(!available)return reply(503,{ok:false,error:'Dictation is not enabled.'});
  if(req.method!=='POST'||req.headers.origin!==origin||!String(req.headers['content-type']).startsWith('audio/wav'))return reply(403,{ok:false,error:'Invalid dictation request.'});
  let ticket;try{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>3840044)return reply(413,{ok:false,error:'Maximum recording is two minutes.'});chunks.push(chunk);}const bytes=Buffer.concat(chunks);inspectWav(bytes);secret ||= getSecret();ticket=reserve();
   const result=await fetchImpl('https://drafted.app.n8n.cloud/webhook/drafted-transcribe',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,'X-Drafted-Dictation':secret},body:JSON.stringify({audio:bytes.toString('base64')}),signal:AbortSignal.timeout(90000)});
   if(!result.ok)throw Error('Transcription service could not complete the request.');const data=await result.json();if(data.ok!==true||typeof data.text!=='string'||data.text.length>20000)throw Error('Transcription failed. Please record again.');reply(200,{ok:true,text:data.text});
  }catch(e){reply(400,{ok:false,error:/limit|busy|switched off/.test(e.message)?e.message:'Transcription failed. Your draft is unchanged.'});}
  finally{if(ticket)try{release(ticket);}catch{/* Expiring lease remains reserved; never reset the budget. */}}
 }};
}
module.exports={create};
