'use strict';
// Local Git-backed release selection. Never pushes, deploys or enables backend calls.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),cache=path.join(root,'site/.local-releases'),pointer=path.join(root,'site/local/stable.json');
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const valid=sha=>{if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Use the full reviewed Git commit SHA.');return sha;};
function files(dir,prefix=''){return fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>{const p=prefix+e.name;if(e.isSymbolicLink())throw Error('Release symlinks are not supported');return e.isDirectory()?files(path.join(dir,e.name),p+'/'):[p];});}
function inventory(dir){return Object.fromEntries(files(dir).filter(p=>p!=='release.json').map(p=>[p,hash(fs.readFileSync(path.join(dir,p)))]));}
function verify(dir){const receipt=JSON.parse(fs.readFileSync(path.join(dir,'release.json'),'utf8'));if(JSON.stringify(inventory(dir))!==JSON.stringify(receipt.files))throw Error('Frozen release differs from its receipt; refusing to serve it. Prepare a new clean release cache, never edit frozen files.');return receipt;}
function prepare(sha){valid(sha);if(git('rev-parse',sha+'^{commit}')!==sha)throw Error('Commit not found');fs.mkdirSync(cache,{recursive:true});const dir=path.join(cache,sha);if(fs.existsSync(dir)){const r=verify(dir);if(r.commit!==sha)throw Error('Release identity mismatch');return dir;}
 const stage=path.join(cache,sha+'.preparing-'+crypto.randomUUID()),source=path.join(stage,'source');fs.mkdirSync(source,{recursive:true});
 const archive=path.join(stage,'source.tar');cp.execFileSync('git',['archive','--format=tar','--output='+archive,sha],{cwd:root});cp.execFileSync('tar',['-xf',archive,'-C',source]);fs.unlinkSync(archive);
 cp.execFileSync(process.execPath,[path.join(source,'tools/build-standalone.cjs')],{cwd:source,env:{...process.env,DRAFTED_LOCAL_CHANNEL:'stable',DRAFTED_LOCAL_REVISION:sha},stdio:'pipe'});
 fs.writeFileSync(path.join(stage,'release.json'),JSON.stringify({schema:1,commit:sha,backend:'simulated',files:inventory(stage)},null,2));verify(stage);fs.renameSync(stage,dir);return dir;
}
function promote(sha,approval){valid(sha);if(!approval?.trim())throw Error('A reference to explicit owner approval is required. Preparation is not approval.');if(git('status','--porcelain'))throw Error('Commit/review the candidate first; promotion requires a clean working tree.');
 const dir=prepare(sha),previous=fs.existsSync(pointer)?JSON.parse(fs.readFileSync(pointer,'utf8')):null;
 if(previous?.commit===sha)throw Error('That commit is already the stable reference');
 const tag='drafted-local-stable/'+sha.slice(0,12),existing=cp.spawnSync('git',['rev-parse','--verify','--quiet','refs/tags/'+tag],{cwd:root,encoding:'utf8'});if(existing.status===0){if(existing.stdout.trim()!==sha)throw Error('Tag identity mismatch');}else if(existing.status===1)git('tag',tag,sha);else throw Error('Could not inspect stable tag');
 const next={schema:1,commit:sha,tag,approval:approval.trim(),selectedAt:new Date().toISOString(),previousCommit:previous?.commit||null,origin:'http://127.0.0.1:8827',backend:'simulated'};
 fs.mkdirSync(path.dirname(pointer),{recursive:true});const temporary=pointer+'.tmp';fs.writeFileSync(temporary,JSON.stringify(next,null,2)+'\n');fs.renameSync(temporary,pointer);console.log(JSON.stringify({selected:next,verifiedFiles:Object.keys(verify(dir).files).length,restartStableToUse:true}));return next;
}
function run(channel){if(!['dev','stable','dev-integration'].includes(channel))throw Error('Choose dev, stable or dev-integration');let source=root,port='8825';
 if(channel==='stable'){const selected=JSON.parse(fs.readFileSync(pointer,'utf8'));source=path.join(prepare(selected.commit),'source');port='8827';}
 else cp.execFileSync(process.execPath,[path.join(root,channel==='dev-integration'?'tools/prepare-local-integration.cjs':'tools/build-standalone.cjs')],{cwd:root,env:{...process.env,DRAFTED_LOCAL_CHANNEL:'dev',DRAFTED_LOCAL_REVISION:''},stdio:'inherit'});
 // Stable serves frozen fixtures and server code too, not just frozen browser assets.
 const env={...process.env,PORT:port,DRAFTED_PREVIEW_SCENARIO:'structured-context'};for(const key of Object.keys(env))if(key.startsWith('DRAFTED_PREVIEW_')&&key!=='DRAFTED_PREVIEW_SCENARIO')delete env[key];
 // Visible preparation time in interactive simulated Dev only; not integration or frozen stable.
 if(channel==='dev')env.DRAFTED_PREVIEW_PLAN_DELAY_MS='9000';
 const child=cp.spawn(process.execPath,[path.join(source,channel==='dev-integration'?'tools/serve-local-integration.cjs':'tools/serve-standalone.cjs')],{cwd:source,env,stdio:'inherit'});process.on('SIGINT',()=>child.kill());process.on('SIGTERM',()=>child.kill());child.on('error',e=>{console.error(e.message);process.exitCode=1;});child.on('exit',code=>{process.exitCode=code||0;});return child;
}
if(require.main===module){try{const [command,...args]=process.argv.slice(2);if(command==='promote'&&args.length===3&&args[1]==='--approved')promote(args[0],args[2]);else if(command==='prepare'&&args.length===1)console.log(prepare(args[0]));else if(command==='status'&&!args.length)console.log(fs.existsSync(pointer)?fs.readFileSync(pointer,'utf8'):'No stable version selected.');else if(['dev','stable','dev-integration'].includes(command)&&!args.length)run(command);else throw Error('Usage: local-versions.cjs dev | stable | dev-integration | status | prepare SHA | promote SHA --approved "owner approval reference"');}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={prepare,promote,verify,inventory};
