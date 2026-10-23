'use strict';
// Local candidate for the existing export contract. No n8n or external service.
const fs = require('node:fs'), path = require('node:path'), {chromium} = require('playwright');
const repo = path.resolve(__dirname, '..');
const designs = require('../webflow/src/cv-document-designs.js');
const fontRoot = path.join(repo, 'webflow/assets/fonts');
const assets = new Map([
 ['/document.css', ['text/css', fs.readFileSync(path.join(repo, 'webflow/src/css/components/cv-document-layout.css'))]],
 ['/document.js', ['text/javascript', ['cv-document-designs.js','cv-document-layout.js'].map(file => fs.readFileSync(path.join(repo, 'webflow/src', file))).join('\n;\n')]],
 ...['LiberationSans-Regular.ttf', 'LiberationSans-Bold.ttf'].map(name => ['/webflow/assets/fonts/' + name, ['font/ttf', fs.readFileSync(path.join(fontRoot, name))]])
]);
const origin = 'http://cv-document.invalid';
const shell = '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/document.css"></head><body style="margin:0"><main id="editor-preview-text" style="width:210mm"></main><script src="/document.js"></script></body></html>';

function validate(input) {
 const fail = () => { const error = Error('The CV does not satisfy the PDF export limits.'); error.status = 400; throw error; };
 const text = (value, min, max, pattern) => typeof value === 'string' && value.length >= min && value.length <= max && (!pattern || pattern.test(value));
 const id = /^[A-Za-z0-9._-]+$/;
 if (!input || typeof input !== 'object' || Array.isArray(input) || Buffer.byteLength(JSON.stringify(input)) > 350*1024) fail();
 if (!text(input.cvVersionId,3,128,id) || !text(input.cvTitle,0,140) || !designs.some(design => design.id === input.templateId) || !['sv','en'].includes(input.language)) fail();
 if (!Array.isArray(input.blocks) || !input.blocks.length || input.blocks.length > 200) fail();
 const ids = new Set(); let total = 0;
 for (const b of input.blocks) {
  if (!b || !text(b.blockId,1,80,id) || ids.has(b.blockId) || !text(b.type,1,32) || !Number.isFinite(b.order) || !text(b.text,0,6000)) fail();
  ids.add(b.blockId); total += b.text.length;
  if (b.type === 'experience' && !['employer','title'].every(key => text(b[key],1,120))) fail();
  if (b.type === 'experience' && !['startDate','endDate'].every(key => text(b[key],1,40))) fail();
  if (b.type === 'education' && (!text(b.institution,1,120) || !text(b.degree,0,120) || !text(b.startDate,0,40) || !text(b.endDate,0,40))) fail();
 }
 if (total > 120000) fail();
 return structuredClone(input);
}

function createPdfRenderer() {
 let browserPromise;
 async function browser() {
  if (!browserPromise) browserPromise = chromium.launch({headless:true,channel:'msedge'}).catch(error => {browserPromise = null; throw error;});
  return browserPromise;
 }
 async function render(input) {
  const snapshot = validate(input), engine = await browser();
  const page = await engine.newPage({viewport:{width:1000,height:1300}});
  const denied = [];
  try {
   await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin || route.request().method() !== 'GET') {denied.push(url.origin); return route.abort();}
    if (url.pathname === '/') return route.fulfill({contentType:'text/html',body:shell});
    const asset = assets.get(url.pathname);
    if (asset) return route.fulfill({contentType:asset[0],body:asset[1]});
    denied.push(url.pathname); return route.abort();
   });
   await page.goto(origin, {waitUntil:'load',timeout:15000});
   await page.emulateMedia({media:'screen'});
   await page.evaluate(async model => {
    document.title = model.cvTitle;
    const host = document.querySelector('main');
    await DraftedCvLayout.render(host, {blocks:model.blocks,title:model.cvTitle,templateId:model.templateId});
    await DraftedCvLayout.ready(host);
   }, snapshot);
   const layout = await page.evaluate(() => {
    const pages = [...document.querySelectorAll('.cv-page')];
    if (!pages.length || pages.some(p => [...p.firstElementChild.children].some(el => el.getBoundingClientRect().bottom > p.firstElementChild.getBoundingClientRect().bottom + .5))) throw Error('Document layout overflow.');
    return {pages:pages.length,content:pages.map(p => p.innerText)};
   });
   if (denied.length) throw Error('Unexpected document resource.');
   // Print the SAME paginated DOM, at physical size. No screenshot conversion.
   const pdf = await page.pdf({preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false,scale:1,margin:{top:0,right:0,bottom:0,left:0},tagged:true});
   if (pdf.subarray(0,5).toString() !== '%PDF-') throw Error('Invalid PDF output.');
   return {pdf,layout,browserVersion:engine.version()};
  } finally {await page.close();}
 }
 async function close() { if (browserPromise) await (await browserPromise).close(); browserPromise = null; }
 return {render,close};
}
module.exports = {createPdfRenderer,validate};
