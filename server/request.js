// Plain Vercel Node Functions do not treat [...path].js as a Next.js catch-all.
// vercel.json forwards the original route to this one function explicitly.
export function requestURL(req,origin){
 const url=new URL(req.url,origin);
 const route=url.searchParams.get('__trainer_route')??req.query?.__trainer_route;
 if(typeof route==='string')url.pathname='/api/'+route;
 url.searchParams.delete('__trainer_route');
 return url;
}
