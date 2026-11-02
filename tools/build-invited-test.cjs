'use strict';
// Separate output; never modifies the stable pointer, local runtime or published root assets.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=require('./build-standalone.cjs').build({integrationPreparation:true});
const out=path.resolve(root,'site/hosting-dist/invited');
if(!out.startsWith(path.resolve(root,'site/hosting-dist')+path.sep))throw Error('Unsafe output path');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const file of ['assets','editor','index.html','drafted-editor.css','drafted-editor.js','local-config.js','environment.js','build.json'])fs.cpSync(path.join(source,file),path.join(out,file),{recursive:true});
const config=`(function(){'use strict';
 window.__DRAFTED_COVERAGE__=Object.freeze({enabled:true,endpoint:'/api/coverage',mode:'public-live'});
 window.__DRAFTED_DICTATION__=Object.freeze({mode:'live',endpoint:'/api/dictation'});
 const nativeFetch=window.fetch.bind(window),backend='https://drafted.app.n8n.cloud';
 window.fetch=(input,init)=>{
  const url=new URL(input instanceof Request?input.url:input,location.href);
  if(url.origin===backend){
   const target='/api'+url.pathname+url.search;
   return nativeFetch(input instanceof Request?new Request(new URL(target,location.origin),input):target,init);
  }
  if(url.origin!==location.origin)return Promise.reject(new Error('External requests are blocked.'));
  return nativeFetch(input,init);
 };
})();\n`;
fs.writeFileSync(path.join(out,'local-config.js'),config);
for(const file of ['index.html','editor/index.html']){
 const p=path.join(out,file);let html=fs.readFileSync(p,'utf8');
 html=html.replace(/<aside class="drafted-environment"[\s\S]*?<\/aside>/,'<aside class="drafted-environment" id="drafted-environment" role="status"><strong>Open test</strong><span>Real AI processing · Your CV is sent to n8n and AI.</span></aside>');
 fs.writeFileSync(p,html);
}
const manifest=JSON.parse(fs.readFileSync(path.join(out,'build.json'),'utf8'));
manifest.build='drafted-invited-test';manifest.mode='integration-live-gated';manifest.localOnly=false;
for(const file of Object.keys(manifest.files))manifest.files[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex');
fs.writeFileSync(path.join(out,'build.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({output:out,revision:manifest.revision,dirty:manifest.dirty}));
