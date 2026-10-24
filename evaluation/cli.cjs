'use strict';
const fs=require('node:fs'),path=require('node:path'),P=require('./model-pilot.cjs');
async function main(args){
 const [command,folder,approvalPath]=args;if(!['prepare','mock','live'].includes(command)||!folder)throw Error('Usage: node evaluation/cli.cjs prepare|mock|live OUTPUT_DIRECTORY [APPROVAL_JSON]');
 const dir=path.resolve(folder);fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'manifest.json');
 const write=(name,value)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
 if(command==='prepare'){const m=P.manifest();write('manifest.json',m);write('approval.template.json',{approved:false,manifestSha256:m.manifestSha256,materialsSha256:m.materialsSha256,sourcesSha256:m.sourcesSha256,maxCalls:72,maxCostUSD:null,inputUSDPerMillion:null,outputUSDPerMillion:null});console.log('Prepared synthetic materials and exact hash manifest. No model calls.');return;}
 const m=JSON.parse(fs.readFileSync(file,'utf8'));P.verify(m);let approval=null,provider;
 // Refuse repeated attempts in the same output folder, including interrupted runs.
 write(command+'.started.json',{manifestSha256:m.manifestSha256,mode:command});
 if(command==='mock')provider=require('./mock-provider.cjs');
 else{if(!approvalPath)throw Error('EXPLICIT_APPROVAL_FILE_REQUIRED');approval=JSON.parse(fs.readFileSync(approvalPath,'utf8'));P.validateApproval(m,approval);provider=require('./provider.cjs').createProvider({manifest:m,approval,apiKey:process.env.DRAFTED_EVAL_OPENAI_API_KEY});}
 const report=await P.run({manifest:m,provider,approval,mode:command==='live'?'approved':'mock',onResult:r=>fs.appendFileSync(path.join(dir,command+'.results.jsonl'),JSON.stringify(r)+'\n')});write(command+'.report.json',report);console.log(JSON.stringify({mode:report.mode,calls:report.calls,externalCallsAttempted:report.externalCallsAttempted,stopReason:report.stopReason,manualReviewRequired:true}));
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(/^PILOT_|^EXPLICIT_|^Usage:/.test(e.message)?e.message:'EVALUATOR_FAILED');process.exitCode=1;});
module.exports={main};
