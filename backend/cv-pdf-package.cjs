'use strict';
// Deployment adapter only. Uses the same document sources; never a second CV template.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const designs=require('../webflow/src/cv-document-designs.js');
const {validate}=require('./cv-pdf.cjs');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sources=['webflow/src/cv-document-designs.js','webflow/src/cv-document-layout.js'];
const script=sources.map(read).join('\n;\n');
const css=read('webflow/src/css/components/cv-document-layout.css').replace(/url\("\.\/webflow\/assets\/fonts\/([^"/]+)"\)/g,(_,name)=>'url("data:font/ttf;base64,'+fs.readFileSync(path.join(root,'webflow/assets/fonts',name)).toString('base64')+'")');
function buildHtml(snapshot,assets){
 const data=JSON.stringify(snapshot).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; font-src data:"><script>window.__RENDER_DONE__=false;</script><style>'+assets.css+'</style></head><body style="margin:0"><main id="editor-preview-text" style="width:210mm"></main><script>'+assets.script+'\n;(async()=>{const model='+data+';document.title=model.cvTitle;const host=document.querySelector("main");try{await DraftedCvLayout.render(host,{blocks:model.blocks,title:model.cvTitle,templateId:model.templateId});await DraftedCvLayout.ready(host);window.__RENDER_DONE__=true;}catch(error){window.__CV_RENDER_ERROR__=String(error);}})();</script></body></html>';
}
const assets={css,script};
const html=input=>buildHtml(validate(input),assets);
// Ready for the n8n Code node: deterministic input validation and packaging only.
// No secrets or environment-specific service endpoints in generated code.
const code='const designs='+JSON.stringify(designs)+';\n'+validate.toString()+'\nconst buildHtml='+buildHtml.toString()+';\nconst assets='+JSON.stringify(assets)+';\ntry { const snapshot=validate($json.body||$json);return [{json:{ok:true,html:buildHtml(snapshot,assets)}}]; } catch(error) {return [{json:{ok:false,httpStatus:error.status||500,contractError:{code:error.status===400?"INVALID_EXPORT_INPUT":"PDF_RENDER_FAILED",message:error.message}}}];}';
const files=[...sources,'webflow/src/css/components/cv-document-layout.css','webflow/assets/fonts/LiberationSans-Regular.ttf','webflow/assets/fonts/LiberationSans-Bold.ttf'];
const manifest=Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
module.exports={html,code,manifest};
