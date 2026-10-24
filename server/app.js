import {createHash,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {SLOTS,validateProgress} from '../src/shared/save-data.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const hash=value=>createHash('sha256').update(value).digest('hex');
const newCode=()=>randomBytes(20).toString('hex').match(/.{1,8}/g).join('-');
const normalizeCode=value=>String(value||'').replace(/-/g,'').trim().toLowerCase();
const publicUser=user=>({id:user.id,name:user.name,username:user.username});

export function createApp({database,auth,recovery,baseURL}){
 async function throttle(key,max){
  const result=await database.query(`INSERT INTO trainer_throttle (key,count,expires_at) VALUES ($1,1,now()+interval '5 minutes')
   ON CONFLICT (key) DO UPDATE SET count=CASE WHEN trainer_throttle.expires_at<now() THEN 1 ELSE trainer_throttle.count+1 END,
   expires_at=CASE WHEN trainer_throttle.expires_at<now() THEN now()+interval '5 minutes' ELSE trainer_throttle.expires_at END RETURNING count`,[hash(key)]);
  return result.rows[0].count<=max;
 }
 return async function handle(request){
  try{
   const url=new URL(request.url),path=url.pathname;
   if(!path.startsWith('/api/'))return json({error:'Not found'},404);
   if(request.method!=='GET'){
    if(request.headers.get('origin')!==new URL(baseURL).origin)return json({error:'Please reload the game before trying again.'},403);
    if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Expected JSON'},415);
   }
   // Expose only the auth features this game uses. No email endpoints or public user directory.
   if(path.startsWith('/api/auth/')){
    const route=path.slice('/api/auth/'.length);
    if(!['sign-up/email','sign-in/username','get-session','sign-out'].includes(route))return json({error:'Not found'},404);
    if(route==='sign-up/email'){
     const body=await request.json();
     if(typeof body.username!=='string'||!/^[a-zA-Z0-9_]{3,20}$/.test(body.username))return json({error:'Use 3–20 letters, numbers or underscores for your username.'},400);
     if(typeof body.name!=='string'||!body.name.trim()||body.name.trim().length>20)return json({error:'Choose a trainer name up to 20 characters.'},400);
     // The auth library requires an internal email identifier. Players never supply one.
     const headers=new Headers(request.headers);headers.delete('content-length');
     const response=await auth.handler(new Request(request.url,{method:'POST',headers,body:JSON.stringify({username:body.username,name:body.name.trim(),password:body.password,email:`${randomUUID()}@trainer.invalid`})}));
     response.headers.set('Cache-Control','no-store');return response;
    }
    const response=await auth.handler(request);response.headers.set('Cache-Control','no-store');return response;
   }
   if(path==='/api/trainer/recover'&&request.method==='POST'){
    const body=await request.json(),username=String(body.username||'').toLowerCase();
    const ip=request.headers.get('x-real-ip')||'local';
    if(!await throttle(`recover-ip:${ip}`,20)||!await throttle(`recover-user:${username}`,5))return json({error:'Too many attempts. Try again in five minutes.'},429);
    if(typeof body.password!=='string'||body.password.length<8||body.password.length>128)return json({error:'Choose a password with 8–128 characters.'},400);
    const result=await database.query('SELECT u.id,u.email,r.code_hash FROM "user" u JOIN trainer_recovery r ON r.user_id=u.id WHERE u.username=$1',[username]);
    const user=result.rows[0],candidate=hash(normalizeCode(body.code));
    if(!user||!timingSafeEqual(Buffer.from(candidate),Buffer.from(user.code_hash)))return json({error:'Username or recovery code is incorrect.'},400);
    // A conditional claim prevents simultaneous reuse. Restore it if the reset fails.
    const claimed=await database.query('DELETE FROM trainer_recovery WHERE user_id=$1 AND code_hash=$2 RETURNING user_id',[user.id,candidate]);
    if(!claimed.rowCount)return json({error:'This recovery code has already been used.'},400);
    const code=newCode();
    try{
     await recovery.run({},async()=>{
      await auth.api.requestPasswordReset({body:{email:user.email}});
      const token=recovery.getStore().token;if(!token)throw new Error('Reset token unavailable');
      await auth.api.resetPassword({body:{token,newPassword:body.password}});
     });
     await database.query('INSERT INTO trainer_recovery (user_id,code_hash) VALUES ($1,$2)',[user.id,hash(normalizeCode(code))]);
    }catch(error){await database.query('INSERT INTO trainer_recovery (user_id,code_hash) VALUES ($1,$2) ON CONFLICT DO NOTHING',[user.id,candidate]);throw error;}
    return json({recoveryCode:code});
   }
   const session=await auth.api.getSession({headers:request.headers});
   if(!session)return json({error:'Sign in to save your trainer.'},401);
   // Reject a delayed request from a different trainer/tab, even if its cookie changed.
   if(request.headers.get('x-trainer-id')!==session.user.id)return json({error:'Trainer changed. Reload to continue.'},409);
   const userId=session.user.id;
   if(path==='/api/trainer/progress'&&request.method==='GET'){
    const result=await database.query('SELECT slot,data,revision FROM trainer_progress WHERE user_id=$1',[userId]);
    return json({user:publicUser(session.user),saves:Object.fromEntries(result.rows.map(row=>[row.slot,{data:row.data,revision:row.revision}]))});
   }
   if(path==='/api/trainer/progress'&&request.method==='PUT'){
    const {slot,data,revision}=await request.json();
    if(!SLOTS.includes(slot)||!Number.isSafeInteger(revision)||revision<0)return json({error:'Invalid save'},400);
    let clean;try{clean=validateProgress(slot,data);}catch{return json({error:'Invalid save'},400);}
    const result=revision===0?await database.query(`INSERT INTO trainer_progress (user_id,slot,data) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING data,revision`,[userId,slot,clean]):
     await database.query(`UPDATE trainer_progress SET data=$3,revision=revision+1,updated_at=now() WHERE user_id=$1 AND slot=$2 AND revision=$4 RETURNING data,revision`,[userId,slot,clean,revision]);
    if(!result.rowCount){const current=await database.query('SELECT data,revision FROM trainer_progress WHERE user_id=$1 AND slot=$2',[userId,slot]);return json({error:'Save conflict',current:current.rows[0]},409);}
    return json(result.rows[0]);
   }
   if(path==='/api/trainer/recovery-code'&&request.method==='POST'){
    if(!await throttle(`code:${userId}`,10))return json({error:'Try again in five minutes.'},429);
    const {password}=await request.json();
    try{await auth.api.verifyPassword({headers:request.headers,body:{password}});}catch{return json({error:'Password is incorrect. Sign in again if your session is old.'},400);}
    const code=newCode();await database.query('INSERT INTO trainer_recovery (user_id,code_hash) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET code_hash=$2',[userId,hash(normalizeCode(code))]);
    return json({recoveryCode:code});
   }
   return json({error:'Not found'},404);
  }catch(error){
   if(error instanceof SyntaxError)return json({error:'Invalid JSON'},400);
   console.error('Trainer API failed:',error.code||error.name);
   return json({error:'Could not reach your trainer save. Please try again.'},503);
  }
 };
}
