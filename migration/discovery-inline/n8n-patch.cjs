'use strict';
const fs=require('node:fs');
function once(text,before,after){if(text.split(before).length!==2)throw Error('INLINE_NODE_BASE_CHANGED');return text.replace(before,()=>after);}
function patch(source,prompt){let lib=fs.readFileSync(__dirname+'/contract.cjs','utf8').replace(/\r\n?/g,'\n');lib=once(lib,"const old=require('../../backend/discovery-signal-questions-proposal.cjs');",'const old=discoverySignalQuestions;');lib=once(lib,'module.exports=','return ');lib='\nconst discoveryInlineQuestions=(()=>{\n'+lib+'\n})();\n';
 const marker=prompt?'const r=$input.first().json.request;return [{json:{promptText:':"const c=globalThis.DraftedDiscoveryContract;const r=$items('Validate request')[0].json.request;";
 let text=once(source,marker,lib+marker);text=once(text,prompt?'discoverySignalQuestions.prompts(r)':'discoverySignalQuestions.review(r,',prompt?'discoveryInlineQuestions.prompts(r)':'discoveryInlineQuestions.review(r,');return text;
}
module.exports={patch};
