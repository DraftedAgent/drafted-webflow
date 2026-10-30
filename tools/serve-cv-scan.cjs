'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=path.join(root,'site/prototypes/cv-scan');
const routes={'/':path.join(base,'index.html'),'/scan.css':path.join(base,'scan.css'),'/scan.js':path.join(base,'scan.js'),'/wordmark.svg':path.join(root,'webflow/assets/brand/drafted-wordmark-reference-dot.svg')};
routes['/cv-analysis-scan.js']=path.join(root,'site/cv-analysis-scan.js');routes['/cv-analysis-scan.css']=path.join(root,'site/cv-analysis-scan.css');
const server=http.createServer((req,res)=>{
 res.setHeader('Content-Security-Policy',"default-src 'self'; connect-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'");res.setHeader('Cache-Control','no-store');
 const file=routes[new URL(req.url,'http://localhost').pathname];
 if(!['GET','HEAD'].includes(req.method)||!file){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'})[path.extname(file)]);res.end(req.method==='HEAD'?undefined:fs.readFileSync(file));
});
server.listen(Number(process.env.PORT||8828),'127.0.0.1',()=>console.log('Standalone scan study: http://127.0.0.1:'+server.address().port+'/'));
