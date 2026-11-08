'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),N=require('../tools/spelling/node_modules/nspell'),E=require('../webflow/assets/spelling/engine.js');
const load=code=>E.prepareDictionary(N({aff:fs.readFileSync('webflow/assets/spelling/'+code+'.aff'),dic:fs.readFileSync('webflow/assets/spelling/'+code+'.dic')})),en=load('en'),gb=load('en-gb'),sv=load('sv'),engine=E.create({en:{correct:w=>en.correct(w)||gb.correct(w)},sv});
assert.equal(sv.correct('zzxzzx'),false);assert.equal(sv.correct('mycket'),true);
for(const [word,context,result] of [['experiance','I have ','experience'],['recieve','we want to ','receive'],['mycekt','jag har ','mycket'],['sammarbete','jag har ','samarbete']])assert.equal(engine.correction(word,context)?.word,result);
for(const word of ['form','from','colour','color','Docker','OpenAI','PostgreSQL','API','iPhone','person@example.com','https://teh.com','cross-functional','backend','samhällsbyggnadsprojekt','teknikförvaltning','X Æ A-12'])assert.equal(engine.correction(word,'I have '),null,word);
assert.equal(engine.correction('experiance','jag har '),null);assert.equal(engine.correction('mycekt','I have '),null);assert.equal(engine.correction('teh','I have ',new Set(['teh'])),null);
console.log('PASS real EN/GB/SV dictionary validation, high-confidence corrections, language separation, names/technical terms/compounds/valid words preserved');
