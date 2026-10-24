import {getRuntime} from '../server/runtime.js';
import {requestURL} from '../server/request.js';

export default async function handler(req,res){
 try{
  const origin=process.env.BETTER_AUTH_URL;
  if(!origin)throw new Error('Trainer service is not configured');
  const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
  let body;
  if(!['GET','HEAD'].includes(req.method)){
   if(req.body!==undefined)body=typeof req.body==='string'?req.body:JSON.stringify(req.body);
   else{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>32768){res.statusCode=413;res.end();return;}chunks.push(chunk);}body=Buffer.concat(chunks).toString();}
   if(Buffer.byteLength(body)>32768){res.statusCode=413;res.end();return;}
  }
  const response=await getRuntime().handle(new Request(requestURL(req,origin),{method:req.method,headers,body}));
  res.statusCode=response.status;
  for(const [key,value] of response.headers)if(key!=='set-cookie')res.setHeader(key,value);
  const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
  res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.statusCode=503;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'Trainer accounts are not configured on this host yet. Guest play is available.'}));}
}
