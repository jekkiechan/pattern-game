(async()=>{
 const accounts=await window.patternAccountsReady;
 const $=id=>document.getElementById(id),user=accounts.user;
 document.body.classList.toggle('trainer-active',!!user);
 if(user){
  $('welcome-heading').replaceChildren(document.createTextNode('Welcome back, '),Object.assign(document.createElement('em'),{textContent:user.name+'.'}));
  $('welcome-copy').textContent='Choose your next adventure. Your trainer keeps your progress in both games.';
  $('welcome-actions').hidden=true;$('welcome-guest').hidden=true;
  $('welcome-trainer').hidden=false;$('manage-trainer').onclick=()=>accounts.open();
  if(accounts.hasGuestProgress){$('guest-progress-invite').hidden=false;$('bring-guest-progress').onclick=()=>accounts.openImport();}
 }else{
  $('create-trainer').disabled=false;$('sign-in-trainer').disabled=false;
  $('create-trainer').onclick=()=>accounts.open('create');$('sign-in-trainer').onclick=()=>accounts.open('login');
  $('play-guest').onclick=()=>{
   $('welcome-copy').textContent='You’re playing as a guest. Progress saves on this device. You can create a trainer and bring it along later.';
   $('games-heading').focus();$('games-heading').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  if(!accounts.enabled)$('welcome-copy').textContent='Play here as a guest, or create a trainer on pattern-games.vercel.app to save across devices.';
 }
 const league=accounts.read('beybattleLeague',null),story=accounts.read('patternTrainerJourney',null),sky=accounts.read('climberSkybound',null);
 $('battle-progress').textContent=league||story?`${accounts.summary('beybattleLeague',league)} · ${story?.completed||0} / 6 story seals`:'New here? Learn three moves, then meet your first rival.';
 $('sky-progress').textContent=sky?accounts.summary('climberSkybound',sky):'New here? Your blade bounces. You choose where to land.';
 if(league?.wins||story?.starter!==null&&story?.starter!==undefined)$('battle-play').textContent='Continue Beybattle →';
 if(sky?.medals?.some(Boolean))$('sky-play').textContent='Continue Skybound →';
 const played=league?.wins||story?.starter!==null&&story?.starter!==undefined||sky?.medals?.some(Boolean);
 $('games-heading').textContent=user&&played?'Pick up where you left off':'Pick your first adventure';
 window.patternArcadeReady=true;
})();
