'use strict';
const assert=require('node:assert/strict'),P=require('../webflow/src/cv-portrait.js');
for(const [text,expected] of [
 ['Your CV must include a photo.','required'],['Ditt CV ska innehålla foto.','required'],['Your CV must not include a photo.','forbidden'],['Send your CV and a cover letter without a photo.','optional'],['We hire a photographer at Photo Studio.','optional'],['Please send your CV with a photo.','required'],['Bifoga CV med foto.','required'],['Include a portrait on your CV.','required'],['Inkludera en bild i ditt CV.','required'],['Submit your CV without a photo.','forbidden'],['Do not send a CV with a photo.','forbidden'],['CV med valfritt foto.','optional'],['A photo is not required in your CV.','optional'],['Send a separate application photo with your CV.','optional'],['Submit your CV and portfolio images.','optional'],['CV with a photo. CV without a photo.','conflict']])assert.equal(P.requirements(text).kind,expected,text);
assert.deepEqual(P.normalize({zoom:99,x:-5,y:500}),{enabled:false,shapeOverrides:{},sizeOverrides:{},zoom:3,x:0,y:100});
for(const [id,shape] of [['studio_v1','square'],['classic_v1','rounded'],['compact_v1','rounded'],['editorial_v1','square'],['executive_v1','circle']]){
 assert.equal(P.effectiveShape({},id),shape);
 for(const override of ['square','rounded','circle'])assert.equal(P.effectiveShape({shapeOverrides:{[id]:override}},id),override);
 for(const legacy of ['square','circle','rounded']){
  const migrated=P.normalize({shapeOverride:legacy},id);
  assert.deepEqual(migrated.shapeOverrides,{[id]:legacy});
 }
}
assert.deepEqual(P.normalize({shape:'square'},'classic_v1').shapeOverrides,{classic_v1:'square'});
assert.deepEqual(P.normalize({shapeOverride:'square'}).shapeOverrides,{});
assert.deepEqual(P.normalize({shapeOverride:'square'},'unknown').shapeOverrides,{});
assert.deepEqual(P.normalize({shape:'square',shapeOverride:null},'classic_v1').shapeOverrides,{});
assert.deepEqual(P.normalize({shapeOverride:'square',shapeOverrides:{}},'classic_v1').shapeOverrides,{});
assert.deepEqual(P.normalize({shapeOverrides:{classic_v1:'circle',executive_v1:'square',studio_v1:'invalid',unknown:'rounded'}}).shapeOverrides,{classic_v1:'circle',executive_v1:'square'});
const saved={shapeOverrides:{classic_v1:'circle'}};P.normalize(saved).shapeOverrides.classic_v1='square';assert.equal(saved.shapeOverrides.classic_v1,'circle');
console.log('PASS photo requirements, template-specific defaults/overrides, safe active-template legacy migration and independent copies');

assert.deepEqual(P.normalize({sizeOverrides:{classic_v1:4,studio_v1:100,executive_v1:33,unknown:30}}).sizeOverrides,{classic_v1:18,studio_v1:45,executive_v1:33});
