const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const output=path.resolve(__dirname,'../../webflow/assets/spelling');
fs.mkdirSync(output,{recursive:true});
esbuild.buildSync({entryPoints:[require.resolve('nspell')],outfile:path.join(output,'nspell.js'),bundle:true,platform:'browser',format:'iife',globalName:'NSpell',minify:true,legalComments:'inline'});
const sources=[];
for(const [code,name] of [['en','dictionary-en'],['en-gb','dictionary-en-gb'],['sv','dictionary-sv']]){
 const dir=path.join(__dirname,'node_modules',name),pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json')));
 for(const extension of ['aff','dic'])fs.copyFileSync(path.join(dir,'index.'+extension),path.join(output,code+'.'+extension));
 fs.copyFileSync(path.join(dir,'license'),path.join(output,code+'-license.txt'));
 sources.push({code,package:name,version:pkg.version,license:pkg.license,repository:pkg.repository});
}
for(const [name,file] of [['nspell','license'],['is-buffer','LICENSE']])fs.copyFileSync(path.join(__dirname,'node_modules',name,file),path.join(output,name+'-license.txt'));
fs.writeFileSync(path.join(output,'SOURCES.json'),JSON.stringify({purpose:'Unmodified local Hunspell dictionaries; browser-only spelling, no user text sent externally.',sources},null,2)+'\n');
