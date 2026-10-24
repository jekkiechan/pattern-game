(()=>{
 const $=id=>document.getElementById(id);
 function openWhenReady(mode='login'){
  if(window.patternAccounts){window.patternAccounts.open(mode);return;}
  const dialog=$('trainer-dialog');
  dialog.innerHTML='<form method="dialog"><button class="dialog-close" aria-label="Close trainer">×</button></form><p class="eyebrow">YOUR PATTERN ARCADE TRAINER</p><h2>Opening your trainer…</h2>';
  if(!dialog.open)dialog.showModal();
  window.patternAccountsReady.then(accounts=>{if(dialog.open)accounts.open(mode);});
 }
 function render(accounts,verified){
  const user=accounts.user;
  document.body.classList.toggle('trainer-active',!!user);
  $('trainer-button').textContent=user?user.name:'Sign in';
  $('trainer-button').disabled=false;
  $('trainer-button').onclick=()=>openWhenReady();
  $('guest-progress-invite').hidden=true;
  if(user){
   $('welcome-heading').replaceChildren(document.createTextNode('Welcome back, '),Object.assign(document.createElement('em'),{textContent:user.name+'.'}));
   $('welcome-copy').textContent='Choose your next adventure. Your trainer keeps your progress in both games.';
   $('welcome-actions').hidden=true;$('welcome-guest').hidden=true;
   $('welcome-trainer').hidden=false;$('manage-trainer').onclick=()=>openWhenReady();
   if(verified&&accounts.hasGuestProgress){$('guest-progress-invite').hidden=false;$('bring-guest-progress').onclick=()=>accounts.openImport();}
  }else{
   $('welcome-heading').innerHTML='One trainer.<br><em>Every adventure.</em>';
   $('welcome-copy').textContent=accounts.enabled?'Create your trainer to save your progress in every game. No email needed.':'Play here as a guest, or create a trainer on pattern-games.vercel.app to save across devices.';
   $('welcome-actions').hidden=false;$('welcome-guest').hidden=false;$('welcome-trainer').hidden=true;
   $('create-trainer').disabled=false;$('sign-in-trainer').disabled=false;
   $('create-trainer').onclick=()=>openWhenReady('create');$('sign-in-trainer').onclick=()=>openWhenReady('login');
   $('play-guest').onclick=()=>{
    $('welcome-copy').textContent='You’re playing as a guest. Progress saves on this device. You can create a trainer and bring it along later.';
    $('games-heading').focus();$('games-heading').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
   };
  }
  const league=accounts.read('beybattleLeague',null),story=accounts.read('patternTrainerJourney',null),sky=accounts.read('climberSkybound',null);
  $('battle-progress').textContent=league||story?`${accounts.summary('beybattleLeague',league)} · ${story?.completed||0} / 6 story seals`:'New here? Learn three moves, then meet your first rival.';
  $('sky-progress').textContent=sky?accounts.summary('climberSkybound',sky):'New here? Your blade bounces. You choose where to land.';
  $('battle-play').innerHTML='Play Beybattle <b>→</b>';
  $('sky-play').innerHTML='Play Skybound <b>→</b>';
  if(league?.wins||story?.starter!==null&&story?.starter!==undefined)$('battle-play').textContent='Continue Beybattle →';
  if(sky?.medals?.some(Boolean))$('sky-play').textContent='Continue Skybound →';
  const played=league?.wins||story?.starter!==null&&story?.starter!==undefined||sky?.medals?.some(Boolean);
  $('games-heading').textContent=user&&played?'Pick up where you left off':'Pick your first adventure';
  if(!verified)$('trainer-status').textContent='Checking your trainer…';
 }
 render(window.patternAccountsPreview,false);
 window.patternArcadePreviewReady=true;
 window.patternAccountsReady.then(accounts=>{
  render(accounts,true);
  window.patternArcadeReady=true;
 });
})();
