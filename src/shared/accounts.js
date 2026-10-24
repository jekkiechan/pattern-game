import {SLOTS,validateProgress} from './save-data.js';
const slotName=slot=>({beybattleLeague:'Beybattle',patternTrainerJourney:'Trainer journey',climberSkybound:'Skybound'}[slot]);
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
 function guestRead(slot,fallback=null){
  const value=localRead(slot,fallback);
  if(slot==='beybattleLeague'){
   const trophies=Number(localRead('beybattleSave',{})?.wins)||0;
   if(trophies>0&&trophies>(Number(value?.trophies)||0))return {...value,trophies};
  }
  return value;
 }
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
  if(!owner)return guestRead(slot,fallback);
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
 function shell(content){dialog.innerHTML=`<form method="dialog"><button class="dialog-close" aria-label="Close trainer">×</button></form><p class="eyebrow">YOUR PATTERN ARCADE TRAINER</p>${content}<p id="account-message" role="status" aria-live="polite"></p>`;}
 function showError(error){const el=dialog.querySelector('#account-message');if(el)el.textContent=error.message;}
 function fields(mode){return `<label>Trainer name<input name="username" autocomplete="username" placeholder="e.g. SkySpinner" pattern="[A-Za-z0-9_]{3,20}" minlength="3" maxlength="20" required autocapitalize="none" spellcheck="false"><small>3–20 letters, numbers or underscores. Use this name to sign in.</small></label>${mode==='recover'?'<label>Recovery code<input name="code" autocomplete="off" required spellcheck="false" autocapitalize="none"></label>':''}<label>${mode==='recover'?'New password':'Password'}<input name="password" type="password" autocomplete="${mode==='login'?'current-password':'new-password'}" minlength="8" maxlength="128" required><small>At least 8 characters. A few words are easy to remember.</small></label><label class="password-visibility"><input type="checkbox" id="show-password"> Show password</label>`;}
 function showForm(mode='login'){
  if(!enabled){shell('<h2>Guest play</h2><p>Trainer accounts are available on the Vercel version of the game. Progress here saves on this device.</p><button class="button secondary" id="export-guest">Download guest progress</button><p>Bring this save file to your trainer on the Vercel version.</p>');return;}
  shell(`<h2>${mode==='create'?'Create your trainer':mode==='recover'?'Get back in':'Welcome back'}</h2><p>One trainer for Beybattle and Skybound. No email needed.</p><div class="trainer-tabs"><button class="text-button" data-form="login" aria-pressed="${mode==='login'}">Sign in</button><button class="text-button" data-form="create" aria-pressed="${mode==='create'}">Create trainer</button><button class="text-button" data-form="recover" aria-pressed="${mode==='recover'}">Forgot password?</button></div><form id="account-form" data-mode="${mode}">${fields(mode)}<button class="button primary" type="submit">${mode==='create'?'Create trainer':mode==='recover'?'Reset password':'Sign in'} →</button></form><p class="dialog-note">Your trainer keeps progress in both games. After signup, save your recovery code with a grown-up in case you forget your password.</p><button class="text-button" id="export-guest">Download guest progress</button>`);
 }
 function showCode(code,after){
  shell(`<h2>Save your recovery code.</h2><p>Ask a grown-up to keep this somewhere safe. It gets you back into all your games if you forget your password.</p><code class="recovery-code">${escape(code)}</code><button class="button secondary" id="download-recovery">Download my code</button><button class="button primary" id="code-done">I saved it. Let’s play →</button>`);
  dialog.querySelector('#download-recovery').onclick=()=>download('pattern-recovery-code.txt',`Pattern Arcade\nTrainer: ${user?.username||'Your trainer'}\nRecovery code: ${code}\nKeep this code private. A new code replaces the previous one.\n`,'text/plain');
  dialog.querySelector('#code-done').onclick=after;
 }
 function showAccount(){
  const conflict=[...conflicts.entries()][0];
  shell(`<h2>${escape(user.name)}</h2><p>@${escape(user.username)}</p><p data-sync-status>${escape(status)}</p><div class="trainer-game-summaries">${SLOTS.map(slot=>`<div><b>${slotName(slot)}</b><span>${escape(summary(slot,read(slot,null)))}</span></div>`).join('')}</div>${conflict?`<section class="save-conflict"><h3>Two versions of your ${slotName(conflict[0])} progress</h3><p>Another device saved a different version. Choose one to keep. This replaces the other version.</p><div class="save-choices"><div><strong>This device</strong><p>${escape(summary(conflict[0],envelope(conflict[0]).data))}</p><button class="button secondary" data-conflict="device">Keep this device</button></div><div><strong>Cloud save</strong><p>${escape(summary(conflict[0],conflict[1].data))}</p><button class="button secondary" data-conflict="cloud">Keep cloud save</button></div></div></section>`:''}<div class="trainer-actions"><button class="button secondary" id="account-sync">Sync now</button><button class="text-button" id="import-guest">Import guest progress…</button><label>Import a progress file<input id="import-file" type="file" accept="application/json,.json"></label><button class="text-button" id="account-recovery">Get a new recovery code…</button><button class="button secondary" id="account-signout">Switch trainer / sign out</button></div><p class="dialog-note">Switching trainers also switches other game tabs. Your pending progress stays with this trainer on this device.</p>`);
 }
 function summary(slot,data){if(!data)return 'Ready for your first adventure';if(slot==='beybattleLeague')return `${data.wins||0} wins · ${data.trophies||0} trophies · ${(data.league?.medals||[]).reduce((a,b)=>a+b,0)} stars`;if(slot==='climberSkybound'){const medals=data.medals||[];return `${medals.filter(n=>n&1).length} / 10 stages · ${medals.reduce((sum,n)=>sum+[1,2,4].filter(bit=>n&bit).length,0)} / 30 medals`;}return data.starter===null?'Journey not started':`${data.name||'Trainer'} · ${data.completed||0} of 6 seals`;}
 function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function hasProgress(slot,data){if(!data)return false;if(slot==='beybattleLeague')return !!(data.wins||data.trophies||data.league?.medals?.some(Boolean));if(slot==='climberSkybound')return data.medals?.some(Boolean);return data.starter!==null&&data.starter!==undefined;}
 function showImport(saves,title){
  imported=saves;
  if(!Object.keys(saves).length){shell('<h2>No guest progress to bring yet.</h2><p>Guest progress from this device will appear here after you play.</p><button class="button secondary" id="import-cancel">Back to my trainer</button>');return;}
  shell(`<h2>${title}</h2><p>Choose the progress to bring to this trainer. Only the saves you select will be replaced.</p><div class="import-choices">${Object.entries(saves).map(([slot,data])=>`<label class="import-choice"><input type="checkbox" data-import-slot="${slot}" ${hasProgress(slot,data)&&!hasProgress(slot,read(slot,null))?'checked':''}><span><b>${slotName(slot)}</b><small>Bring: ${escape(summary(slot,data))}</small><small>Keep now: ${escape(summary(slot,read(slot,null)))}</small></span></label>`).join('')}</div><button class="button secondary" id="import-cancel">Keep my progress</button><button class="button primary" id="import-confirm">Bring selected progress</button>`);
 }
 function openImport(){showImport(Object.fromEntries(SLOTS.map(slot=>[slot,guestRead(slot)]).filter(([,data])=>data)),'Bring your guest progress');if(!dialog.open)dialog.showModal();}
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
    const saves=Object.fromEntries(SLOTS.map(slot=>[slot,validateProgress(slot,guestRead(slot,{}))]));
    const blob=new Blob([JSON.stringify({format:'pattern-trainer-progress',version:1,saves},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='pattern-guest-progress.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   }
   if(target.id==='import-guest'){
    openImport();
   }
   if(target.id==='import-cancel')showAccount();
   if(target.id==='import-confirm'){
    if(conflicts.size)throw new Error('Resolve the save conflict first.');
    const selected=[...dialog.querySelectorAll('[data-import-slot]:checked')].map(el=>el.dataset.importSlot);
    if(!selected.length)throw new Error('Choose at least one save to bring along.');
    for(const slot of selected)write(slot,imported[slot]);
    localWrite(`patternGuestImported:${owner}`,true);
    await flush();if(conflicts.size){showAccount();return;}location.reload();
   }
  }catch(error){showError(error);}finally{busy=false;}
 });
 dialog.addEventListener('change',async event=>{
  if(event.target.id==='show-password'){dialog.querySelector('[name=password]').type=event.target.checked?'text':'password';return;}
  if(event.target.id!=='import-file'||!event.target.files[0])return;
  try{
   const file=event.target.files[0];if(file.size>32768)throw new Error('Choose a Pattern progress file smaller than 32 KB.');
   const value=JSON.parse(await file.text());if(value.format!=='pattern-trainer-progress'||value.version!==1||!value.saves)throw new Error('This is not a Pattern progress file.');
   imported=Object.fromEntries(SLOTS.filter(slot=>value.saves[slot]).map(slot=>[slot,validateProgress(slot,value.saves[slot])]));
   if(!Object.keys(imported).length)throw new Error('No progress found in this file.');
   showImport(imported,'Bring progress from a file');
  }catch(error){showError(new Error(error instanceof SyntaxError?'This file is not valid JSON.':error.message));}
 });
 dialog.addEventListener('submit',async event=>{
  const form=event.target;if(!['account-form','recovery-form'].includes(form.id))return;
  event.preventDefault();if(busy)return;busy=true;const submit=form.querySelector('[type="submit"],button');submit.disabled=true;
  const values=Object.fromEntries(new FormData(form));
  try{
   if(form.id==='recovery-form'){const result=await api('trainer/recovery-code',{password:values.password});showCode(result.recoveryCode,showAccount);return;}
   const mode=form.dataset.mode;
   if(mode==='create')values.name=values.username;
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
 function open(mode='login'){user&&owner?showAccount():showForm(mode);if(!dialog.open)dialog.showModal();}
 button.textContent=user?user.name:'Sign in';button.disabled=false;button.onclick=()=>open();
 dialog.addEventListener('close',()=>{if(reloadOnClose)location.reload();});
 document.getElementById('trainer-status').textContent=status;
 window.addEventListener('online',()=>flush());
 window.addEventListener('storage',event=>{if(event.key===ACTIVE&&event.newValue!==JSON.stringify(user))location.reload();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')flush();});
 if(owner){setInterval(()=>flush(),30000);setTimeout(()=>flush(),0);}
 return {read,write,flush,open,openImport,summary,slotName,get hasGuestProgress(){return !!owner&&!localRead(`patternGuestImported:${owner}`)&&SLOTS.some(slot=>hasProgress(slot,guestRead(slot)));},get enabled(){return enabled;},get user(){return user;},get storageOK(){return storageOK;}};
}
