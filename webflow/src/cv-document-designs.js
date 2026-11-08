/* Shared presentation allowlist: browser preview and local PDF renderer. */
(function (root) {
  'use strict';
  const designs = Object.freeze([
    Object.freeze({id:'classic_v1', name:'Classic', defaultPhotoShape:'rounded', photoSizeMm:28}),
    Object.freeze({id:'compact_v1', name:'Compact', defaultPhotoShape:'rounded', photoSizeMm:28}),
    Object.freeze({id:'editorial_v1', name:'Editorial', defaultPhotoShape:'square', photoSizeMm:30}),
    Object.freeze({id:'studio_v1', name:'Studio', defaultPhotoShape:'square', photoSizeMm:32}),
    Object.freeze({id:'executive_v1', name:'Executive', defaultPhotoShape:'circle', photoSizeMm:30})
  ]);
  if (typeof module === 'object' && module.exports) module.exports = designs;
  else root.DraftedCvDesigns = designs;
})(typeof window === 'object' ? window : globalThis);
