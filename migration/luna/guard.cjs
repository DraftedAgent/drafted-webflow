'use strict';
// Shared by local tests and the exact prepared Code-node source.
function normalize(envelope,spec){
 const fail=code=>{const e=Error(code);e.code=code;throw e;};
 if(!envelope||envelope.error)fail('MODEL_UNAVAILABLE');
 if(envelope.status==='incomplete'&&envelope.incomplete_details?.reason==='max_output_tokens')fail('MODEL_TOKEN_BUDGET');
 if(envelope.status!=='completed')fail('MODEL_NOT_COMPLETED');
 if(typeof envelope.model!=='string'||!(envelope.model===(spec.model||'gpt-6-luna')||envelope.model.startsWith((spec.model||'gpt-6-luna')+'-')))fail('MODEL_CHANGED');
 if(envelope.service_tier!=='default')fail('MODEL_SERVICE_TIER_CHANGED');
 if(!envelope.usage||!Number.isInteger(envelope.usage.input_tokens)||!Number.isInteger(envelope.usage.output_tokens)||envelope.usage.input_tokens<0||envelope.usage.output_tokens<0||envelope.usage.output_tokens>spec.maxOutputTokens)fail('MODEL_USAGE_INVALID');
 if(envelope.usage.input_tokens>spec.inputTokenBudget)fail('MODEL_INPUT_BUDGET_EXCEEDED_AFTER_RESPONSE');
 const output=Array.isArray(envelope.output)?envelope.output:[],parts=[];let messages=0;
 for(const item of output){if(item.type==='reasoning')continue;if(item.type!=='message')fail('UNEXPECTED_MODEL_ITEM');messages++;if(item.status&&item.status!=='completed')fail('MODEL_NOT_COMPLETED');for(const c of item.content||[]){if(c.type==='refusal')fail('MODEL_REFUSAL');if(c.type!=='output_text'||typeof c.text!=='string')fail('INVALID_MODEL_CONTENT');parts.push(c.text);}}
 if(messages!==1||!parts.length)fail('MODEL_TEXT_MISSING_OR_AMBIGUOUS');const text=parts.join('\n').trim();if(!text)fail('MODEL_TEXT_MISSING_OR_AMBIGUOUS');
 if(spec.format==='language'){if(text==='unknown')fail('LANGUAGE_CONTEXT_REQUIRED');if(text!=='sv'&&text!=='en')fail('INVALID_LANGUAGE_OUTPUT');}
 else{let parsed;try{parsed=JSON.parse(text);}catch{fail('MODEL_INVALID_JSON');}if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))fail('MODEL_INVALID_JSON_ROOT');}
 return {...envelope,output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text}]}]};
}
function code(spec){return 'const normalize = '+normalize.toString()+';\nreturn $input.all().map(item=>({...item,json:normalize(item.json,'+JSON.stringify(spec)+')}));';}
module.exports={normalize,code};
