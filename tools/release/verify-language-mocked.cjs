'use strict';
// Exercise served release bytes with the actual editor. ALL non-read requests are intercepted.
// Optional DRAFTED_PUBLIC_BASE points at an isolated local copy of the public build.
const fs=require('fs'),path=require('path'),Module=require('module');
const file=path.resolve('tests/tailor-language.browser.cjs');let source=fs.readFileSync(file,'utf8');
const start=source.indexOf('const server=spawn('),end=source.indexOf('browser=await chromium.launch',start);
if(start<0||end<0)throw Error('Language browser harness changed');
const base=process.env.DRAFTED_PUBLIC_BASE||'https://getmedrafted.com/';
source=source.slice(0,start)+`const server={kill(){}};let browser;try{const base=${JSON.stringify(base)};`+source.slice(end);
source=source.replace('output/pdf/standalone/tailor-language','output/pdf/public-release/tailor-language');
for(const [before,after]of [['/preview-api/upload','/api/webhook/webflow-upload-cv'],['/preview-api/jobcontext','/api/webhook/webflow-jobcontext-extract'],['/preview-api/tailor','/api/webhook/tailor-cv'],['/preview-api/coverage','/api/coverage'],['/webflow-experience-discovery','/api/webhook/webflow-experience-discovery']])source=source.replaceAll(before,after);
const boundary='return route.continue();});';if(!source.includes(boundary))throw Error('Network boundary changed');
source=source.replace(boundary,"if(!['GET','HEAD'].includes(req.method()))throw Error('Blocked unexpected '+req.method()+' '+p);return route.continue();});");
const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(source,file);
