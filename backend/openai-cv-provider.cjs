 'use strict';
const endpoint='https://api.openai.com/v1/responses';
function createProvider({apiKey,model='gpt-6-luna',fetchImpl=fetch,approved=false,maxCalls=6,maxOutputTokens=4000,onUsage=()=>{}}={}){
 if(!Number.isInteger(maxOutputTokens)||maxOutputTokens<1||maxOutputTokens>12000)throw Error('INVALID_OUTPUT_BUDGET');
 let calls=0;return async({prompt,input,messages})=>{
  if(!approved)throw Error('EXTERNAL_MODEL_APPROVAL_REQUIRED');if(!apiKey)throw Error('OPENAI_API_KEY_REQUIRED');if(calls>=maxCalls)throw Error('MODEL_CALL_LIMIT');
  const content=messages||[{role:'system',content:prompt+' Return JSON only.'},{role:'user',content:JSON.stringify(input)}];
  if(Buffer.byteLength(JSON.stringify(content))>24000)throw Error('MODEL_INPUT_LIMIT');calls++;
  const response=await fetchImpl(endpoint,{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({model,input:content,max_output_tokens:maxOutputTokens,store:false,text:{format:{type:'json_object'}}}),signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error('MODEL_HTTP_'+response.status);const data=await response.json();onUsage({model:data.model,usage:data.usage,call:calls});
  if(data.status!=='completed'||data.incomplete_details)throw Error('INCOMPLETE_MODEL_OUTPUT');const output=data.output?.filter(x=>x.type==='message');if(output?.length!==1||output[0].role!=='assistant'||output[0].status!=='completed'||output[0].content?.length!==1||output[0].content[0].type!=='output_text')throw Error('INVALID_MODEL_OUTPUT');return JSON.parse(output[0].content[0].text);
 };
}
module.exports={createProvider,endpoint};
