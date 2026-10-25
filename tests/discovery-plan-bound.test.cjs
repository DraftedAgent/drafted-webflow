'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),T=require('../migration/discovery-plan-bound/checks.cjs');
for(const c of T.checks().checks)test(c.name,()=>assert.equal(c.pass,true,c.error));
