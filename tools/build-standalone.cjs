'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'site/dist'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const protectedPaths=['drafted-editor.js','drafted-editor.css','drafted-hero.js','latest.json','webflow/latest.json'];
function build(options={}){
 const integration=!!options.integrationPreparation;
 const channel=process.env.DRAFTED_LOCAL_CHANNEL||'dev';
 if(!['dev','stable'].includes(channel))throw Error('Unknown local channel');
 const git=(...args)=>require('node:child_process').execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const revision=process.env.DRAFTED_LOCAL_REVISION||git('rev-parse','HEAD');
 if(!/^[a-f0-9]{40}$/.test(revision))throw Error('Expected full Git commit');
 const dirty=!process.env.DRAFTED_LOCAL_REVISION&&!!git('status','--porcelain');
 const versionLabel=(channel==='stable'?'Stabil referens':'Dev')+' · '+revision.slice(0,8)+(dirty?' + lokala ändringar':'');
 const out=path.join(root,integration?'site/integration-dist':'site/dist');
 const before=Object.fromEntries(protectedPaths.map(p=>[p,sha(fs.readFileSync(path.join(root,p)))]));
 const hero=require('./build-initial-hero.cjs');
 const modules=read('webflow/build.sh').match(/for module in (.+?); do/)[1].split(/\s+/);
 const js=read('site/dictation-wav.js')+'\n;\n'+read('site/dictation.js')+'\n;\n'+read('site/workspace-transition.js')+'\n;\n'+read('site/cv-analysis-scan.js')+'\n;\n'+read('site/workspace-layout.js')+'\n;\n'+['workspace-store.js','workspace-pages.js',...modules.filter(p=>p!=='tailor-source-client.js')].map(p=>read('webflow/src/'+p)).join('\n;\n')+'\n;\n'+['cv-coverage-contract.js','cv-coverage-client.js','cv-coverage-navigation.js','cv-coverage-view.js','tailor-sources-v13.js','cv-language.js','tailor-structure-guard.js','tailor-sources-v14.js','tailor-sources-v15.js','tailor-source-client.js','tailor-section-review.js','cv-version-selection.js','cv-selection-ui.js','tailor-review-scroll.js'].map(p=>read('webflow/src/'+p)).join('\n;\n')+'\n;\n'+read('webflow/src/drafted-editor.js').replaceAll('__DRAFTED_BUILD_ID__','standalone-local');
 const cssFile=p=>read(p).replace(/@import\s+url\(["']([^"']+)["']\);/g,(_,rel)=>cssFile(path.posix.join(path.posix.dirname(p),rel)));
 const base=read('site/base.css')+'\n'+read('site/environment.css'),pages=read('webflow/src/css/components/workspace-pages.css')+'\n'+read('site/workspace-layout.css')+'\n'+read('site/cv-analysis-scan.css')+'\n'+read('site/workspace-transition.css')+'\n'+read('site/dictation.css')+'\n'+read('webflow/src/css/components/cv-coverage.css');
 // Preserve the document styles exactly; only asset URLs are relocated.
 const css=(base+'\n'+cssFile('webflow/src/css/index.css')+'\n'+pages).replaceAll('./webflow/assets/','./assets/');
 fs.mkdirSync(path.join(out,'editor'),{recursive:true});
 fs.writeFileSync(path.join(out,'drafted-editor.js'),js.replace("new URL('webflow/assets/pdfjs/6.4.299/'","new URL('assets/pdfjs/6.4.299/'"));
 fs.writeFileSync(path.join(out,'drafted-editor.css'),css);
 if(integration)fs.writeFileSync(path.join(out,'local-config.js'),require('../site/integration/runtime.cjs').runtime());
 else fs.copyFileSync(path.join(root,'site/local-config.js'),path.join(out,'local-config.js'));
 fs.copyFileSync(path.join(root,'site/environment.js'),path.join(out,'environment.js'));
 for(const directory of ['brand','fonts','pdfjs'])fs.cpSync(path.join(root,'webflow/assets',directory),path.join(out,'assets',directory),{recursive:true});
 const head='<script data-drafted-reload-start>'+read('site/reload-start.js')+'</script>\n'+hero.head+'\n<style data-standalone-critical>'+base+'\n'+pages+'</style>';
 for(const [page,target,title] of [['setup','index.html','Your experience, clearly represented'],['editor','editor/index.html','CV editor']]){
  const mode=integration?'integration-blocked':'simulated';
  const environment=`<aside class="drafted-environment" id="drafted-environment" data-channel="${channel}" data-mode="${mode}" role="status"><strong class="drafted-version-label">${versionLabel}</strong><span data-backend-label>${integration?'Integration · spärrad':'Simulerat lokalt'}</span><span data-backend-detail>${integration?'Inga riktiga anrop tillåtna':'Inga riktiga AI-anrop'}</span></aside>`;
  const html=read('site/shell.html').replace('{{PAGE}}',page).replace('{{TITLE}}',title).replace('{{HEAD}}',head).replace('{{HERO}}',hero.hero).replace('{{ENVIRONMENT}}',environment);
  if(/Rewrite your CV with ruthless clarity|data-wf-|data-turnstile|website-files\.com|webflow\.io/.test(html))throw Error('Vendor markup in standalone HTML');
  fs.writeFileSync(path.join(out,target),html);
 }
 const manifest={build:'standalone-local',channel,revision,dirty,mode:integration?'integration-blocked':'simulated',localOnly:true,sourceGeometry:sha(fs.readFileSync(path.join(root,'webflow/assets/brand/drafted-hero-motion.json'))),files:Object.fromEntries(['index.html','editor/index.html','drafted-editor.js','drafted-editor.css','local-config.js','environment.js'].map(p=>[p,sha(fs.readFileSync(path.join(out,p)))]))};
 fs.writeFileSync(path.join(out,'build.json'),JSON.stringify(manifest,null,2));
 for(const p of protectedPaths)if(before[p]!==sha(fs.readFileSync(path.join(root,p))))throw Error('Protected published output changed: '+p);
 console.log(JSON.stringify({output:out,protectedOutputsUnchanged:true,build:manifest.build}));return out;
}
if(require.main===module)build();module.exports={build};
