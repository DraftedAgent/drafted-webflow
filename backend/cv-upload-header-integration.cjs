'use strict';
// Pure local patch builder: no API calls, credentials, workflow writes or execution.
const fs=require('node:fs'),path=require('node:path');
function patchCanonicalizer(code){
  const anchor='const rewrittenCv = normalizedBlocks';
  if(code.split(anchor).length!==2||!code.includes('const expMap =')||!code.includes('let parsedObj ='))throw Error('Unsupported canonicalizer; inspect current source before patching');
  if(code.includes('SOURCE_HEADER_GUARD'))throw Error('Header guard already installed');
  const helper=fs.readFileSync(path.join(__dirname,'cv-upload-source-guard.cjs'),'utf8').replace(/module\.exports=\{prepareUploadPresentation\};\s*$/,'');
  const addition=`// SOURCE_HEADER_GUARD: authoritative parser facts, existing canonical blocks.\nnormalizedBlocks = (() => {\n${helper}\nreturn prepareUploadPresentation({blocks:normalizedBlocks,parsedCvJson:parsedObj,sourceExperiencesByBlockId:Object.fromEntries(expMap.map(ref=>[ref.blockId,parsedExperiences[ref.idx]]))}).blocks;\n})();\n\n`;
  return code.replace(anchor,addition+anchor);
}
function buildLocalCandidate(definition){
  if(definition.id!=='6Bvk0NYcElT9OirH')throw Error('Unexpected upload workflow');
  const copy=JSON.parse(JSON.stringify(definition));
  for(const name of ['EnsureBlocksAndJoin','EnsureBlocksAndJoin1']){
    const node=copy.nodes.find(n=>n.name===name);if(!node)throw Error('Missing canonicalizer '+name);
    node.parameters.jsCode=patchCanonicalizer(node.parameters.jsCode);
  }
  return copy;
}
module.exports={patchCanonicalizer,buildLocalCandidate};
