'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
test('frozen release, explicit promotion, history and integrity across Git revisions',()=>{
 const repo=fs.mkdtempSync(path.join(os.tmpdir(),'drafted-version-test-')),git=(...args)=>cp.execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 fs.mkdirSync(path.join(repo,'tools'));fs.mkdirSync(path.join(repo,'site'));fs.writeFileSync(path.join(repo,'.gitignore'),'site/.local-releases/\nsite/dist/\n');
 fs.copyFileSync(path.join(__dirname,'../tools/local-versions.cjs'),path.join(repo,'tools/local-versions.cjs'));
 fs.writeFileSync(path.join(repo,'tools/build-standalone.cjs'),"const fs=require('node:fs');fs.mkdirSync('site/dist',{recursive:true});fs.writeFileSync('site/dist/index.html',fs.readFileSync('fixture.txt'));\n");
 fs.writeFileSync(path.join(repo,'fixture.txt'),'reference-one');git('init');git('config','user.name','Synthetic Test');git('config','user.email','test@example.invalid');git('config','commit.gpgsign','false');git('add','.');git('commit','-m','Synthetic baseline');
 const api=require(path.join(repo,'tools/local-versions.cjs')),one=git('rev-parse','HEAD');assert.throws(()=>api.promote(one,''),/approval/);
 const frozen=api.prepare(one);assert(!fs.existsSync(path.join(repo,'site/local/stable.json')));const expected=api.inventory(frozen);
 api.promote(one,'Synthetic test approval, not user/project approval');git('add','site/local/stable.json');git('commit','-m','Select synthetic baseline');
 fs.writeFileSync(path.join(repo,'fixture.txt'),'development-two');assert.throws(()=>api.promote(one,'test'),/clean/);assert.deepEqual(api.inventory(frozen),expected);
 git('add','fixture.txt');git('commit','-m','Synthetic candidate');const two=git('rev-parse','HEAD'),candidate=api.prepare(two);
 assert.equal(JSON.parse(fs.readFileSync(path.join(repo,'site/local/stable.json'))).commit,one);assert.equal(fs.readFileSync(path.join(candidate,'source/site/dist/index.html'),'utf8'),'development-two');
 const next=api.promote(two,'Synthetic test approval');assert.equal(next.previousCommit,one);assert.deepEqual(api.inventory(frozen),expected);
 const file=path.join(frozen,'source/fixture.txt');fs.writeFileSync(file,'tampered');assert.throws(()=>api.verify(frozen),/differs/);
 assert.throws(()=>api.prepare('main'),/full reviewed/);
});
