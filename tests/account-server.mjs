import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';
import {accountFixture} from './account-fixture.mjs';
const port=Number(process.env.PORT||8000),base=`http://127.0.0.1:${port}`,root=resolve('.');
const fixture=await accountFixture(base);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  if(req.url.startsWith('/api/')){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const body=Buffer.concat(chunks);
   const response=await fixture.handle(new Request(base+req.url,{method:req.method,headers:req.headers,...(body.length?{body}: {})}));
   res.statusCode=response.status;for(const [key,value] of response.headers)if(key!=='set-cookie')res.setHeader(key,value);
   const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
   res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,base).pathname));if(!file.startsWith(root+sep)){res.statusCode=403;res.end();return;}
  res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');let content=await readFile(file);if(file.endsWith('/beybattle.html'))content=content.toString().replace('name="trainer-service" content="disabled"','name="trainer-service" content="enabled"');res.end(content);
 }catch{res.statusCode=404;res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`Account test server ready: ${base}`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{server.close();await fixture.close();process.exit(0);});
