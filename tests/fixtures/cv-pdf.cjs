'use strict';
const base=require('./cv-pagination.cjs');
const short=structuredClone(base.short),multi=structuredClone(base.multi),longSpecial=structuredClone(base.long);
// Stay inside the pre-existing export contract; never truncate a real user's CV.
longSpecial.blocks[1].title='Principal Specialist for International Product Development and Distributed Delivery';
longSpecial.blocks.push({blockId:'links-1',type:'otherSections',label:'Links and languages',order:400,text:'Åsa Östergård — språk: svenska, English, français, Deutsch.\nÅÄÖ åäö é è ü ñ Æ Ø ß € £ © ™ – — • α β Ω.\nPortfolio: (https://example.org/portfolio).\nWebsite: www.example.org\nContact: alex@example.org\nA long reference: https://example.org/'+('project-reference-'.repeat(70))+'final\nFinal proof: FULL SOURCE RETAINED.'});
const edited={...structuredClone(short),blocks:structuredClone(multi.blocks)};
edited.blocks[0].text='Recently applied edit: Åsa led the synthetic delivery review.\n'+edited.blocks[0].text;
module.exports={short,multi,'long-special':longSpecial,edited,envelope:base.envelope};
