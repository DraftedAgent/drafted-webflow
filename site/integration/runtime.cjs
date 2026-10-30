'use strict';
const origin='http://127.0.0.1:8826',backendOrigin='https://drafted.app.n8n.cloud';
const paths=['webflow-upload-cv','webflow-editor-rewrite','webflow-chat-cv','webflow-export-pdf','webflow-jobcontext-extract','tailor-cv','webflow-experience-discovery'].map(p=>'/webhook/'+p);
function validateOrigin(value){const u=new URL(value);if(u.protocol!=='http:'||u.hostname!=='127.0.0.1'||!u.port||u.origin!==value||u.username||u.password)throw Error('Use an exact http://127.0.0.1:PORT origin without a path or credentials.');return value;}
function runtime(expectedOrigin=origin){validateOrigin(expectedOrigin);return `/* Local integration configuration. No credentials and no simulated responses. */
(function(){'use strict';const expectedOrigin=${JSON.stringify(expectedOrigin)},backend=${JSON.stringify(backendOrigin)},paths=${JSON.stringify(paths)},nativeFetch=window.fetch.bind(window);
// Capture server configuration once; query parameters and later globals cannot enable calls.
const approved=window.__DRAFTED_INTEGRATION_APPROVED__===true&&location.origin===expectedOrigin;
window.__DRAFTED_INTEGRATION__=Object.freeze({expectedOrigin,approved,mode:approved?'integration-live':'integration-blocked'});
window.fetch=(input,init)=>{const url=new URL(input instanceof Request?input.url:input,location.href),method=String(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
 if(url.origin===location.origin)return nativeFetch(input,init);
 if(!approved||url.origin!==backend||url.username||url.password||!paths.includes(url.pathname)||url.search||url.hash||method!=='POST')return Promise.reject(new Error('Local integration is blocked for this request. Real n8n/AI calls require explicit approval and server activation.'));
 return nativeFetch(input,init);
};
window.DraftedEnvironment?.show(window.__DRAFTED_INTEGRATION__.mode);
// No preview override: retain existing production contracts and structured-context gates.
})();\n`;}
function headers(enabled=false){if(typeof enabled!=='boolean')throw Error('Explicit boolean required');return {
 'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',
 'Content-Security-Policy':"default-src 'self'; connect-src 'self'"+(enabled?' '+backendOrigin:'')+"; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; frame-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};}
module.exports={origin,runtime,headers,validateOrigin,backendOrigin,paths};
