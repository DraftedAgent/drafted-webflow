'use strict';
// Local migration proposal only. No default or runtime workflow is changed on import.
const specs={
 'LanguageDetectionModel':{operation:'language_detection',inputTokenBudget:12000,maxOutputTokens:256,format:'language'},
 'SV-CVParserModel':{operation:'cv_parse_sv',inputTokenBudget:24000,maxOutputTokens:6000,format:'json'},
 'EN-CVParserModel1':{operation:'cv_parse_en',inputTokenBudget:24000,maxOutputTokens:6000,format:'json'},
 'SV-CVRewriteModel':{operation:'cv_initial_rewrite_sv',inputTokenBudget:24000,maxOutputTokens:6000,format:'json'},
 'EN-CVRewriteModel':{operation:'cv_initial_rewrite_en',inputTokenBudget:24000,maxOutputTokens:6000,format:'json'},
 'SV-EditorRewriteModel':{operation:'editor_rewrite_sv',inputTokenBudget:16000,maxOutputTokens:4000,format:'json'},
 'EN-EditorRewriteModel':{operation:'editor_rewrite_en',inputTokenBudget:16000,maxOutputTokens:4000,format:'json'},
 'TailorModel':{operation:'tailor_cv_ad',inputTokenBudget:24000,maxOutputTokens:3000,format:'json'},
 'Tailor sources model':{operation:'tailor_sources',inputTokenBudget:32000,maxOutputTokens:4000,format:'json'},
 'AI Chat Model':{operation:'advisory_chat',inputTokenBudget:16000,maxOutputTokens:2000,format:'json'},
 'JobContextExtractModel':{operation:'job_analysis',inputTokenBudget:16000,maxOutputTokens:3000,format:'json'},
 'Discovery model':{operation:'discovery_plan_or_interpret',inputTokenBudget:24000,maxOutputTokens:3000,format:'json'}
};
function spec(workflowId,node){const s=specs[node.name];if(!s)throw Error('UNKNOWN_MODEL_STEP');return {...s,operationKey:workflowId+':'+s.operation,model:'gpt-6-luna',reasoning:'low',serviceTier:'default',store:false,retries:0,fallback:null,inputLimitEnforcement:'proposed admission layer; NOT enforced by this node-config patch'};}
function options(before,s){const next=structuredClone(before||{});for(const key of ['temperature','topP','topLogprobs','previousResponseId','conversationId','backgroundMode'])delete next[key];return {...next,maxTokens:s.maxOutputTokens,reasoning:{reasoningOptions:{effort:s.reasoning,summary:'none'}},serviceTier:s.serviceTier,store:false};}
function resolve(operationKey,overrides={}){const model=Object.hasOwn(overrides,operationKey)?overrides[operationKey]:'gpt-6-luna';if(model!=='gpt-6-luna')throw Error('MODEL_OVERRIDE_REQUIRES_SEPARATE_QUALITY_AND_COST_APPROVAL');return model;}
module.exports={spec,options,resolve};
