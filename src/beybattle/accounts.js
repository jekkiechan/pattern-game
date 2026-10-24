import {validateProgress} from './save-data.js';
const SLOTS=['beybattleLeague','patternTrainerJourney'];
const ACTIVE='patternActiveTrainer';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=value=>structuredClone(value);

// Storage is scoped once per page. A changed cookie can never redirect queued saves
// to another trainer: the API verifies x-trainer-id against the current session.
export async function createTrainerAccounts(){
 const dialog=document.getElementById('trainer-dialog'),button=document.getElementById('trainer-button');
 const memory=new Map();let storageOK=true,user=null,available=true,status='Guest · saved on this device',busy=false,timer,flushing=null,reloadOnClose=false;
 const conflicts=new Map();let imported=null;
 function localRead(key,fallback=null){if(memory.has(key))return memory.get(key);try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{storageOK=false;return fallback;}}
 function localWrite(key,value){memory.set(key,clone(value));try{localStorage.setItem(key,JSON.stringify(value));}catch{storageOK=false;}}
 const enabled=document.querySelector('meta[name="trainer-service"]')?.content==='enabled';
 const cached=enabled?localRead(ACTIVE):null;
 const apiURL=path=>new URL(`api/${path}`,document.baseURI);
 async function api(path,body,method=body?'POST':'GET',owner=user?.id){
  const response=await fetch(apiURL(path),{method,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(8000),
   headers:{...(body?{'Content-Type':'application/json'}:{}),...(owner?{'x-trainer-id':owner}:{})},...(body?{body:JSON.stringify(body)}:{})});
  let data;try{data=await response.json();}catch{throw new Error('Trainer accounts are unavailable on this host. You can still play as a guest.');}
  if(!response.ok){const error=new Error(data.error?.message||data.error||data.message||'Please try again.');error.status=response.status;error.data=data;throw error;}
  return data;
 }
 try{
  if(!enabled)throw new Error('Guest host');
  const session=await api('auth/get-session');user=session?.user?{id:session.user.id,name:session.user.name,username:session.user.username}:null;
  localWrite(ACTIVE,user);
 }catch{available=false;user=cached;}
 const owner=user?.id||null;
 const key=slot=>owner?`patternTrainer:${owner}:${slot}`:slot;
 const saves=new Map(SLOTS.map(slot=>[slot,owner?localRead(key(slot),{data:null,revision:0,dirty:false}):null]));
 const envelope=slot=>saves.get(slot);
 function setStatus(message){status=message;document.getElementById('trainer-status').textContent=message;dialog.querySelector('[data-sync-status]')?.replaceChildren(document.createTextNode(message));}
 function storeEnvelope(slot,value){saves.set(slot,clone(value));localWrite(key(slot),value);}
 async function pull(){
  const remote=await api('trainer/progress',null,'GET',owner);
  for(const slot of SLOTS){
   const saved=envelope(slot),cloud=remote.saves[slot]||{data:null,revision:0};
   if(saved.dirty){
    if(JSON.stringify(saved.data)===JSON.stringify(cloud.data))storeEnvelope(slot,{...cloud,dirty:false});
    else if(saved.revision!==cloud.revision)conflicts.set(slot,cloud);
   }else storeEnvelope(slot,{...cloud,dirty:false});
  }
 }
 if(owner){try{await pull();status=conflicts.size?'Choose which progress to keep':available?'Progress saved to your trainer':'Offline · saved on this device';}catch{available=false;status='Offline · saved on this device';}}
 function read(slot,fallback){
  if(!owner)return localRead(slot,fallback);
  if(!SLOTS.includes(slot))return fallback; // Never inherit guest settings or trophies.
  return envelope(slot).data??fallback;
 }
 function write(slot,data){
  if(!owner){localWrite(slot,data);if(!storageOK)setStatus('Storage unavailable · progress lasts this visit');return storageOK;}
  if(!SLOTS.includes(slot))return false;
  data=validateProgress(slot,data);
  const saved=envelope(slot);if(JSON.stringify(saved.data)===JSON.stringify(data))return storageOK;
  storeEnvelope(slot,{data:clone(data),revision:saved.revision,dirty:true});
  setStatus(conflicts.size?'Choose which progress to keep':storageOK?'Saved on this device · syncing…':'Keep this tab open · syncing…');
  clearTimeout(timer);timer=setTimeout(()=>flush(),600);return storageOK;
 }
 async function flush(){
  if(!owner||flushing||conflicts.size)return flushing;
  flushing=(async()=>{
   try{
    for(const slot of SLOTS){
     let saved=envelope(slot);
     while(saved.dirty){
      let result;
      try{result=await api('trainer/progress',{slot,data:saved.data,revision:saved.revision},'PUT',owner);}
      catch(error){if(error.status===409&&error.data.current){conflicts.set(slot,error.data.current);setStatus('Another device has newer progress · open Trainer');return;}throw error;}
      const latest=envelope(slot),changed=JSON.stringify(latest.data)!==JSON.stringify(saved.data);
      storeEnvelope(slot,{data:changed?latest.data:result.data,revision:result.revision,dirty:changed});saved=envelope(slot);
     }
    }
    available=true;setStatus(storageOK?'Progress saved to your trainer':'Cloud saved · device storage unavailable');
   }catch(error){setStatus(error.status===401?'Session expired · sign in again to sync':error.status===409?'Trainer changed · reload this page':'Offline · progress waiting to sync');}
  })();
  try{await flushing;}finally{flushing=null;}
 }
 function shell(content){dialog.innerHTML=`<form method="dialog"><button class="dialog-close" aria-label="Close trainer">×</button></form><p class="eyebrow">YOUR PLACE IN THE LEAGUE</p>${content}<p id="account-message" role="status" aria-live="polite"></p>`;}
 function showError(error){const el=dialog.querySelector('#account-message');if(el)el.textContent=error.message;}
 function fields(mode){return `<label>Username<input name="username" autocomplete="username" pattern="[A-Za-z0-9_]{3,20}" minlength="3" maxlength="20" required autocapitalize="none" spellcheck="false"><small>3–20 letters, numbers or underscores</small></label>${mode==='create'?'<label>Trainer name<input name="name" maxlength="20" autocomplete="nickname" required></label>':''}${mode==='recover'?'<label>Recovery code<input name="code" autocomplete="off" required spellcheck="false" autocapitalize="none"></label>':''}<label>${mode==='recover'?'New password':'Password'}<input name="password" type="password" autocomplete="${mode==='login'?'current-password':'new-password'}" minlength="8" maxlength="128" required><small>At least 8 characters</small></label>`;}
 function showForm(mode='login'){
  if(!enabled){shell('<h2>Guest play</h2><p>Trainer accounts are available on the Vercel version of the game. Progress here saves on this device.</p><button class="button secondary" id="export-guest">Download guest progress</button><p>Bring this save file to your trainer on the Vercel version.</p>');return;}
  shell(`<h2>${mode==='create'?'Create your trainer':mode==='recover'?'Get back in':'Welcome back'}</h2><p>No email needed. Each trainer has their own progress.</p><div class="trainer-tabs"><button class="text-button" data-form="login" aria-pressed="${mode==='login'}">Sign in</button><button class="text-button" data-form="create" aria-pressed="${mode==='create'}">Create trainer</button><button class="text-button" data-form="recover" aria-pressed="${mode==='recover'}">Forgot password?</button></div><form id="account-form" data-mode="${mode}">${fields(mode)}<button class="button primary" type="submit">${mode==='create'?'Create trainer':mode==='recover'?'Reset password':'Sign in'} →</button></form><p class="dialog-note">Keep your password private. A recovery code lets you reset it without email. Guest progress stays separate until you choose to import it.</p><button class="text-button" id="export-guest">Download guest progress</button>`);
 }
 function showCode(code,after){
  shell(`<h2>Keep your recovery code.</h2><p>Give this code to a grown-up or save it somewhere safe. It can reset your password. Creating a new code replaces the old one.</p><code class="recovery-code">${escape(code)}</code><button class="button primary" id="code-done">I saved my code →</button>`);
  dialog.querySelector('#code-done').onclick=after;
 }
 function showAccount(){
  const conflict=[...conflicts.entries()][0];
  shell(`<h2>${escape(user.name)}</h2><p>@${escape(user.username)}</p><p data-sync-status>${escape(status)}</p>${conflict?`<section class="save-conflict"><h3>Two versions of your ${conflict[0]==='beybattleLeague'?'League':'story'} progress</h3><p>Another device saved a different version. Choose one to keep. This replaces the other version.</p><div class="save-choices"><div><strong>This device</strong><p>${escape(summary(conflict[0],envelope(conflict[0]).data))}</p><button class="button secondary" data-conflict="device">Keep this device</button></div><div><strong>Cloud save</strong><p>${escape(summary(conflict[0],conflict[1].data))}</p><button class="button secondary" data-conflict="cloud">Keep cloud save</button></div></div></section>`:''}<div class="trainer-actions"><button class="button secondary" id="account-sync">Sync now</button><button class="text-button" id="import-guest">Import guest progress…</button><label>Import a progress file<input id="import-file" type="file" accept="application/json,.json"></label><button class="text-button" id="account-recovery">Get a new recovery code…</button><button class="button secondary" id="account-signout">Switch trainer / sign out</button></div><p class="dialog-note">Switching trainers also switches other game tabs. Your pending progress stays with this trainer on this device.</p>`);
 }
 function summary(slot,data){if(!data)return 'No saved progress';if(slot==='beybattleLeague')return `${data.wins||0} wins · ${data.trophies||0} trophies · ${(data.league?.medals||[]).reduce((a,b)=>a+b,0)} stars`;return data.starter===null?'Journey not started':`${data.name||'Trainer'} · ${data.completed||0} of 6 seals`;}
 dialog.addEventListener('click',async event=>{
  const target=event.target.closest('button');if(!target||busy)return;
  if(target.dataset.form){showForm(target.dataset.form);return;}
  if(target.dataset.conflict){
   const [slot,cloud]=[...conflicts.entries()][0];
   if(target.dataset.conflict==='cloud'){storeEnvelope(slot,{...cloud,dirty:false});conflicts.delete(slot);reloadOnClose=true;}
   else{storeEnvelope(slot,{...envelope(slot),revision:cloud.revision,dirty:true});conflicts.delete(slot);await flush();}
   if(!conflicts.size&&reloadOnClose){location.reload();return;}showAccount();return;
  }
  try{
   busy=true;
   if(target.id==='account-sync'){await flush();showAccount();}
   if(target.id==='account-signout'){
    await flush();await api('auth/sign-out',{});localWrite(ACTIVE,null);location.reload();
   }
   if(target.id==='account-recovery')shell('<h2>New recovery code</h2><p>Enter your current password. Your previous recovery code will stop working.</p><form id="recovery-form"><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="button primary">Create recovery code</button></form>');
   if(target.id==='export-guest'){
    const saves=Object.fromEntries(SLOTS.map(slot=>[slot,validateProgress(slot,localRead(slot,{}))]));
    const blob=new Blob([JSON.stringify({format:'pattern-trainer-progress',version:1,saves},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='pattern-guest-progress.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   }
   if(target.id==='import-guest'){
    imported=null;
    shell(`<h2>Import guest progress?</h2><p>This replaces this trainer’s League and story progress with the guest saves on this device. Other trainers stay unchanged.</p>${SLOTS.map(slot=>`<p>${slot==='beybattleLeague'?'League':'Story'}: ${escape(summary(slot,localRead(slot)))}</p>`).join('')}<button class="button secondary" id="import-cancel">Keep my trainer progress</button><button class="button primary" id="import-confirm">Replace with guest progress</button>`);
   }
   if(target.id==='import-cancel')showAccount();
   if(target.id==='import-confirm'){
    if(conflicts.size)throw new Error('Resolve the save conflict first.');
    for(const slot of SLOTS){const data=imported?imported[slot]:localRead(slot);if(data)write(slot,data);}
    await flush();if(conflicts.size){showAccount();return;}location.reload();
   }
  }catch(error){showError(error);}finally{busy=false;}
 });
 dialog.addEventListener('change',async event=>{
  if(event.target.id!=='import-file'||!event.target.files[0])return;
  try{
   const file=event.target.files[0];if(file.size>32768)throw new Error('Choose a Pattern progress file smaller than 32 KB.');
   const value=JSON.parse(await file.text());if(value.format!=='pattern-trainer-progress'||value.version!==1||!value.saves)throw new Error('This is not a Pattern progress file.');
   imported=Object.fromEntries(SLOTS.filter(slot=>value.saves[slot]).map(slot=>[slot,validateProgress(slot,value.saves[slot])]));
   if(!Object.keys(imported).length)throw new Error('No progress found in this file.');
   shell(`<h2>Import this progress file?</h2><p>This replaces this trainer’s matching saves. Other trainers and guest progress stay unchanged.</p>${Object.entries(imported).map(([slot,data])=>`<p>${slot==='beybattleLeague'?'League':'Story'}: ${escape(summary(slot,data))}</p>`).join('')}<button class="button secondary" id="import-cancel">Keep my trainer progress</button><button class="button primary" id="import-confirm">Replace with this file</button>`);
  }catch(error){showError(new Error(error instanceof SyntaxError?'This file is not valid JSON.':error.message));}
 });
 dialog.addEventListener('submit',async event=>{
  const form=event.target;if(!['account-form','recovery-form'].includes(form.id))return;
  event.preventDefault();if(busy)return;busy=true;const submit=form.querySelector('[type="submit"],button');submit.disabled=true;
  const values=Object.fromEntries(new FormData(form));
  try{
   if(form.id==='recovery-form'){const result=await api('trainer/recovery-code',{password:values.password});showCode(result.recoveryCode,showAccount);return;}
   const mode=form.dataset.mode;
   if(mode==='recover'){const result=await api('trainer/recover',values);showCode(result.recoveryCode,()=>showForm('login'));return;}
   await flush();
   const result=await api(mode==='create'?'auth/sign-up/email':'auth/sign-in/username',values);
   user={id:result.user.id,name:result.user.name,username:result.user.username};localWrite(ACTIVE,user);reloadOnClose=true;
   if(mode==='create'){
    try{const code=await api('trainer/recovery-code',{password:values.password},'POST',user.id);showCode(code.recoveryCode,()=>location.reload());}
    catch{shell('<h2>Your trainer is ready.</h2><p>Your recovery code could not be created. Open Trainer after signing in to create one.</p><button class="button primary" onclick="location.reload()">Continue →</button>');}
   }else location.reload();
  }catch(error){showError(error);}finally{busy=false;submit.disabled=false;}
 });
 button.textContent=user?user.name:'Trainer / Sign in';button.onclick=()=>{user&&owner?showAccount():showForm();dialog.showModal();};
 dialog.addEventListener('close',()=>{if(reloadOnClose)location.reload();});
 document.getElementById('trainer-status').textContent=status;
 window.addEventListener('online',()=>flush());
 window.addEventListener('storage',event=>{if(event.key===ACTIVE&&event.newValue!==JSON.stringify(user))location.reload();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')flush();});
 if(owner){setInterval(()=>flush(),30000);setTimeout(()=>flush(),0);}
 return {read,write,flush,get user(){return user;},get storageOK(){return storageOK;}};
}
