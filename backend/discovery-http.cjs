const http=require('node:http');
const {LIMIT,error}=require('../webflow/src/experience-discovery-contract.js');
function createServer(handler,{serve=null}={}){
  return http.createServer(async(req,res)=>{
    if(req.method!=='POST'||req.url!=='/webflow-experience-discovery'){
      if(serve)return serve(req,res);res.writeHead(404);res.end();return;
    }
    let chunks=[],bytes=0,oversize=false;
    for await(const chunk of req){bytes+=chunk.length;if(bytes>LIMIT){oversize=true;chunks=[];}else if(!oversize)chunks.push(chunk);}
    const body=Buffer.concat(chunks).toString('utf8');
    let result;
    if(oversize)result={status:413,body:error(null,'INPUT_TOO_LARGE')};
    else{try{const request=JSON.parse(body);result=await handler(request);}catch{result={status:400,body:error(null,'INVALID_REQUEST')};}}
    res.writeHead(result.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(result.body));
  });
}
module.exports={createServer};
