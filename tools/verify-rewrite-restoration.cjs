'use strict';
// Compares complete definitions in memory without printing credentials or node contents.
const fs=require('node:fs');
const {baseline,restored}=JSON.parse(fs.readFileSync(0,'utf8').replace(/^\uFEFF/,''));
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const mismatchedFields=[];
for(const key of ['name','description','nodes','connections','nodeGroups','settings','staticData','pinData'])if(!equal(baseline[key],restored[key]))mismatchedFields.push('saved.'+key);
for(const key of ['nodes','connections','nodeGroups'])if(!equal(baseline.activeVersion[key],restored.activeVersion[key]))mismatchedFields.push('active.'+key);
if(restored.activeVersionId!==baseline.activeVersionId||restored.active!==baseline.active)mismatchedFields.push('active-version-or-status');
const differences=[];
function walk(a,b,p){if(equal(a,b))return;if(!a||!b||typeof a!=='object'||typeof b!=='object'){differences.push(p);return;}for(const key of new Set([...Object.keys(a),...Object.keys(b)]))walk(a[key],b[key],p+'.'+key);}
if(mismatchedFields.length)walk(baseline.nodes,restored.nodes,'saved.nodes');
process.stdout.write(JSON.stringify({verified:!mismatchedFields.length,mismatchedFields,differences,savedVersionId:restored.versionId,activeVersionId:restored.activeVersionId,active:restored.active,savedNodes:restored.nodes.length,activeNodes:restored.activeVersion.nodes.length}));
if(mismatchedFields.length)process.exitCode=1;
