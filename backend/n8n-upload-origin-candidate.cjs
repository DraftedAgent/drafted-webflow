'use strict';
// Pure transformation only. Never performs API requests or publishes a workflow.
const {validateOrigin}=require('../site/integration/runtime.cjs');
const workflowId='6Bvk0NYcElT9OirH',nodeId='35b25396-c4ba-41c3-8302-2cc7ea0c9fb0',version='dbaffef6-c149-4bad-a016-83269c50e47a',legacyOrigin='https://drafted-cad750.webflow.io';
function candidate(definition,origin){validateOrigin(origin);if(origin===legacyOrigin)throw Error('The test origin must be distinct');if(definition.id!==workflowId||definition.versionId!==version||definition.activeVersionId!==version||definition.active!==true)throw Error('Workflow state drift: re-inspect before preparing a new candidate');const next=structuredClone(definition),node=next.nodes.find(n=>n.id===nodeId);if(node?.type!=='n8n-nodes-base.webhook'||node.parameters.path!=='webflow-upload-cv'||node.parameters.options.allowedOrigins!==legacyOrigin)throw Error('Webhook state drift');node.parameters.options.allowedOrigins=legacyOrigin+','+origin;return next;}
module.exports={candidate,workflowId,nodeId,version,legacyOrigin};
