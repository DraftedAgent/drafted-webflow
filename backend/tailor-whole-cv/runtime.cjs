'use strict';
const profile=require('../../webflow/src/tailor-sources-v11.js'),refs=require('../tailor-source-references.cjs'),recovery=require('../tailor-context-recovery-proposal.cjs');
module.exports=require('./contract.cjs').create(profile,refs,recovery);
