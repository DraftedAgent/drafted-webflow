const fs=require('node:fs'),path=require('node:path');
const {createServer}=require('../backend/discovery-http.cjs');
const {createHandler}=require('../backend/experience-discovery.cjs');
const {fixtureModel}=require('../backend/discovery-fixture-provider.cjs');
const root=path.resolve(__dirname,'..');
const server=createServer(createHandler({model:fixtureModel}),{serve:(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const target=path.resolve(root,'.'+pathname);
  if(!target.startsWith(root+path.sep)||req.method!=='GET'){res.writeHead(404);res.end();return;}
  fs.readFile(target,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':target.endsWith('.html')?'text/html; charset=utf-8':target.endsWith('.js')?'text/javascript; charset=utf-8':'text/plain; charset=utf-8'});res.end(data);});
}});
server.listen(Number(process.env.PORT||8770),'127.0.0.1',()=>console.log(`Isolated discovery preview: http://127.0.0.1:${server.address().port}/webflow/preview/experience-discovery.html?backend=1 (synthetic provider; no outbound calls)`));
