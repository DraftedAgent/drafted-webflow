'use strict';
// Read-only isolated release check: never forwards API requests or runs model fixtures.
const http=require('http'),fs=require('fs'),path=require('path'),root=path.resolve('site/hosting-dist/invited');
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.wasm':'application/wasm','.ttf':'font/ttf','.png':'image/png','.ico':'image/vnd.microsoft.icon'};
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('Read-only candidate');}
 const p=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,p==='/'?'index.html':p==='/editor'?'editor/index.html':p.slice(1));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:fs.readFileSync(file));
});server.listen(Number(process.env.PORT||8830),'127.0.0.1',()=>console.log('Read-only publication candidate http://127.0.0.1:'+server.address().port+'/'));
