/* Prepared fictional package restored into the ordinary tailoring review. */
(function(root){
 'use strict';
 function prepare(base={}){
  const prepared=structuredClone(root.DraftedSampleReviewData),request=prepared.request,blocks=request.blocks;
  return {...base,sampleVersion:3,sampleReview:{request,data:prepared.data},cv:{documentTextState:blocks.map(b=>b.text).join('\n\n'),documentBlocksState:blocks,blockRangesById:{},documentTitle:request.cvTitle,cvVersionId:request.cvVersionId,selectedBlockId:null,selectedBlockIds:[],lastClickedBlockId:null,activeContext:'chat'},comparison:{schema:1,original:{blocks:structuredClone(blocks),cvTitle:request.cvTitle},mode:'edited',marks:false},cvSelection:null,portrait:null,language:'en',cvLanguageConfirmed:true,design:'classic_v1',contextRevision:0,jobText:request.jobText,jobDraft:request.jobText,jobContext:request.jobContext,jobStatus:'ready',sourceHash:null,discovery:prepared.discovery,coverage:{...prepared.coverage,session:{...prepared.coverage.session,resultInput:{cvVersionId:request.cvVersionId,blocks,jobText:request.jobText,jobContext:request.jobContext}}},tailorReview:null,tailorCompletionContext:null,tailorAppliedStamp:null,tailorDraft:'',chatHistory:[],messages:[],draft:'',activeSelectionRequest:null,appliedChatReceipts:[],selectionSources:{},pendingProposal:null,pendingProposalMeta:null,pendingSuggestion:null,isPreviewingProposal:false,previewSnapshot:null,ledger:{groups:[],history:[],integrations:[],integrationHistory:[],languageApplications:[],languageHistory:[]},setupStatus:{text:'',state:'idle',hidden:true,processing:false},interrupted:false,scroll:{chat:0,document:0},zoom:'fit'};
 }
 root.DraftedSampleWorkspace={prepare};
})(window);
