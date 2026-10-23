/* Shared presentation allowlist: browser preview and local PDF renderer. */
(function (root) {
  'use strict';
  const designs = Object.freeze([
    Object.freeze({id:'classic_v1', name:'Classic'}),
    Object.freeze({id:'compact_v1', name:'Compact'}),
    Object.freeze({id:'editorial_v1', name:'Editorial'})
  ]);
  if (typeof module === 'object' && module.exports) module.exports = designs;
  else root.DraftedCvDesigns = designs;
})(typeof window === 'object' ? window : globalThis);
