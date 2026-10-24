import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {accountFixture} from './account-fixture.mjs';
import {requestURL} from '../server/request.js';

const base='http://localhost:8000',fixture=await accountFixture(base);
assert.equal(requestURL({url:'/api/trainer?__trainer_route=auth%2Fget-session&disableCookieCache=true'},base).href,base+'/api/auth/get-session?disableCookieCache=true');
assert.equal(requestURL({url:'/api/trainer',query:{__trainer_route:'auth/sign-up/email'}},base).pathname,'/api/auth/sign-up/email');
assert.equal(requestURL({url:'/api/auth/get-session'},base).pathname,'/api/auth/get-session');
function player(){let cookie='',id;return {get id(){return id;},async request(path,body,method=body?'POST':'GET',extra={}){
 const url=requestURL({url:'/api/trainer?__trainer_route='+encodeURIComponent(path)},base);
 const response=await fixture.handle(new Request(url,{method,headers:{origin:base,'content-type':'application/json',cookie,...(id?{'x-trainer-id':id}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})}));
 for(const value of response.headers.getSetCookie()){const part=value.split(';')[0];const name=part.split('=')[0];cookie=cookie.split('; ').filter(c=>!c.startsWith(name+'=')).concat(part).filter(Boolean).join('; ');}
 const data=await response.json();if(data.user)id=data.user.id;return {status:response.status,data,cookies:response.headers.getSetCookie()};
 }};}
try{
 const nephew=player(),uncle=player(),anonymous=player();
 assert.deepEqual((await anonymous.request('trainer/bootstrap')).data,{user:null,saves:{}});
 assert.equal((await anonymous.request('trainer/progress')).status,401);
 for(const [client,username,name] of [[nephew,'nephew','Nephew'],[uncle,'uncle','Uncle']]){
  const created=await client.request('auth/sign-up/email',{username,name,password:'spinning-tops-123'});assert.equal(created.status,200,JSON.stringify(created));
 }
 assert.notEqual(nephew.id,uncle.id);
 const duplicate=await anonymous.request('auth/sign-up/email',{username:'NEPHEW',name:'Copy',password:'spinning-tops-123'});assert.notEqual(duplicate.status,200);
 const save={slot:'beybattleLeague',revision:0,data:{wins:4,trophies:1,league:{medals:[3,2]}}};
 assert.equal((await nephew.request('trainer/progress',save,'PUT')).status,200);
 const bootstrap=await nephew.request('trainer/bootstrap',null,'GET',{'x-trainer-id':uncle.id});
 assert.equal(bootstrap.status,200);
 assert.equal(bootstrap.data.user.id,nephew.id,'Bootstrap uses the session, not a supplied trainer ID');
 assert.equal(bootstrap.data.saves.beybattleLeague.data.wins,4);
 assert.deepEqual((await uncle.request('trainer/progress')).data.saves,{});
 const wrongOwner=await uncle.request('trainer/progress',{...save,userId:nephew.id},'PUT',{'x-trainer-id':nephew.id});assert.equal(wrongOwner.status,409);
 const stale=await nephew.request('trainer/progress',{...save,data:{wins:0}},'PUT');assert.equal(stale.status,409);assert.equal(stale.data.current.data.wins,4);
 const write=await nephew.request('trainer/progress',{...save,revision:1,data:{wins:5}},'PUT');assert.equal(write.data.revision,2);
 const story={version:1,name:'Nephew',starter:0,completed:2,choices:{},scene:null};
 assert.equal((await nephew.request('trainer/progress',{slot:'patternTrainerJourney',revision:0,data:story},'PUT')).status,200);
 assert.equal((await uncle.request('trainer/progress')).data.saves.patternTrainerJourney,undefined);
 // Reproduce the deployed two-slot constraint before upgrading an existing database.
 await fixture.database.query("ALTER TABLE trainer_progress DROP CONSTRAINT trainer_progress_slot_check; ALTER TABLE trainer_progress ADD CONSTRAINT trainer_progress_slot_check CHECK (slot IN ('beybattleLeague','patternTrainerJourney'))");
 await fixture.database.query(await readFile(new URL('../server/schema.sql',import.meta.url),'utf8'));
 const sky={version:1,medals:[7,1],blade:'nimbus',sound:true,reduced:false};
 assert.equal((await nephew.request('trainer/progress',{slot:'climberSkybound',revision:0,data:sky},'PUT')).status,200);
 const skySave=(await nephew.request('trainer/progress')).data.saves.climberSkybound;
 assert.deepEqual(skySave.data.medals,[7,1,0,0,0,0,0,0,0,0]);
 assert.equal((await uncle.request('trainer/progress')).data.saves.climberSkybound,undefined);
 assert.equal((await nephew.request('trainer/progress',{slot:'climberSkybound',revision:0,data:{medals:[]}},'PUT')).status,409);
 // Re-running the schema migration adds the slot without resetting old saves.
 await fixture.database.query(await readFile(new URL('../server/schema.sql',import.meta.url),'utf8'));
 assert.equal((await nephew.request('trainer/progress')).data.saves.beybattleLeague.data.wins,5);
 assert.equal((await nephew.request('trainer/progress')).data.saves.climberSkybound.data.blade,'nimbus');
 assert.equal((await nephew.request('trainer/progress',{slot:'__proto__',revision:0,data:{}},'PUT')).status,400);
 assert.equal((await nephew.request('trainer/progress',save,'PUT',{origin:'https://evil.example'})).status,403);
 const codeResult=await nephew.request('trainer/recovery-code',{password:'spinning-tops-123'});assert.equal(codeResult.status,200,JSON.stringify(codeResult));const code=codeResult.data.recoveryCode;
 assert.equal((await uncle.request('trainer/recovery-code',{password:'wrong-password'})).status,400);
 assert.equal((await anonymous.request('trainer/recover',{username:'nephew',code:'wrong',password:'new-password-123'})).status,400);
 const recovered=await anonymous.request('trainer/recover',{username:'nephew',code,password:'new-password-123'});assert.equal(recovered.status,200,JSON.stringify(recovered));assert.notEqual(recovered.data.recoveryCode,code);
 assert.equal((await nephew.request('trainer/progress')).status,401,'Recovery revokes old sessions');
 const revokedBootstrap=await nephew.request('trainer/bootstrap');
 assert.deepEqual(revokedBootstrap.data,{user:null,saves:{}},'Bootstrap cannot restore a revoked session');
 assert.ok(revokedBootstrap.cookies.some(cookie=>cookie.includes('session_token=')&&cookie.includes('Max-Age=0')),'Bootstrap clears a revoked session cookie');
 assert.equal((await anonymous.request('trainer/recover',{username:'nephew',code,password:'another-password'})).status,400,'Recovery codes are single use');
 assert.notEqual((await nephew.request('auth/sign-in/username',{username:'nephew',password:'spinning-tops-123'})).status,200);
 assert.equal((await nephew.request('auth/sign-in/username',{username:'NEPHEW',password:'new-password-123'})).status,200);
 assert.equal((await nephew.request('trainer/progress')).data.saves.beybattleLeague.data.wins,5);
 assert.equal((await nephew.request('auth/request-password-reset',{email:'anything@example.com'})).status,404);
 for(let i=0;i<4;i++)await anonymous.request('trainer/recover',{username:'nephew',code:'wrong',password:'another-password'});
 assert.equal((await anonymous.request('trainer/recover',{username:'nephew',code:'wrong',password:'another-password'})).status,429);
 const rows=await fixture.database.query('SELECT code_hash FROM trainer_recovery WHERE user_id=$1',[nephew.id]);assert.notEqual(rows.rows[0].code_hash,recovered.data.recoveryCode);
 assert.equal((await uncle.request('trainer/progress')).status,200,'Recovery leaves the other account signed in');
 console.log('Accounts: creation, isolation, optimistic saves, CSRF, recovery, revocation and rate limits passed.');
}finally{await fixture.close();}
