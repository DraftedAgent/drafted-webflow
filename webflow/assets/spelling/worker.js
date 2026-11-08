/* No external service: dictionaries and all processing stay on this origin. */
'use strict';
importScripts('./nspell.js','./engine.js');
const ready=Promise.all(['en','en-gb','sv'].map(async code=>{
 const files=await Promise.all(['aff','dic'].map(async extension=>{const response=await fetch('./'+code+'.'+extension);if(!response.ok)throw Error('SPELLING_DICTIONARY_UNAVAILABLE');return response.text();}));
 return DraftedSpellingEngine.prepareDictionary(NSpell({aff:files[0],dic:files[1]}));
})).then(([en,gb,sv])=>DraftedSpellingEngine.create({en:{correct:w=>en.correct(w)||gb.correct(w)},sv}));
ready.then(()=>postMessage({ready:true})).catch(()=>postMessage({unavailable:true}));
onmessage=async({data})=>{try{const engine=await ready;postMessage({id:data.id,result:engine.correction(data.word,data.context,new Set(data.protectedWords))});}catch{postMessage({id:data.id,result:null});}};
