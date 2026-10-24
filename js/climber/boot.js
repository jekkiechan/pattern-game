(async()=>{
 try{
  await window.patternAccountsReady;
  for(const [file,version] of [['config',7],['state',7],['art',6],['engine',6],['render',7]]){
   await new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=`js/climber/${file}.js?v=${version}`;
    script.onload=resolve;script.onerror=reject;document.body.append(script);
   });
  }
  window.patternClimberReady=true;
  document.getElementById('continue-button').disabled=false;
 }catch{
  document.getElementById('save-note').textContent='Could not start Skybound. Please reload.';
 }
})();
