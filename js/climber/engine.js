// Fixed 60 Hz simulation. Rendering never changes the saved physics state.
function buildStage(stageIdx){
 const cfg=STAGES[stageIdx];platforms=[];collectStars=[];particles=[];trailParticles=[];starsCollected=0;starsTotal=cfg.stars;
 const make=(x,y,w,type,i)=>({x,y,w,type,i,baseX:x,broken:false,restore:0,phase:i*1.71,charged:false});
 platforms.push(make(W/2-70,GROUND,140,'normal',0));
 const types={n:'normal',m:'moving',f:'fragile',b:'boost',c:'checkpoint'};
 for(let i=0;i<cfg.route.length;i++)platforms.push(make(cfg.x[i]-cfg.width/2,GROUND-(i+1)*cfg.gap,cfg.width,types[cfg.route[i]],i+1));
 const last=platforms.at(-1);platforms.push(make(last.x+last.w/2-60,last.y-78,120,'finish',platforms.length));
 for(let i=0;i<cfg.stars;i++){const index=1+Math.round(i*(cfg.route.length-1)/(cfg.stars-1));const p=platforms[index];collectStars.push({x:p.x+p.w/2,y:p.y-27,collected:false,platform:p});}
 player={x:W/2,y:GROUND-35,vx:0,vy:-5,angle:0,spinSpeed:.17,radius:16,energy:100,burstFrames:0,prevX:W/2,prevY:GROUND-35,prevAngle:0};
 checkpoint=platforms[0];camera=GROUND-H+45;previousCamera=camera;
 run={frames:0,rescues:0,landings:0,clean:0,bursts:0,highY:player.y,combo:0,wind:0,usedDrop:false};
}
function startStage(idx){
 if(!Number.isInteger(idx)||idx<0||idx>=STAGES.length)return;
 currentStage=idx;state='playing';paused=false;clearInput();frameCount=0;clearFlash=0;pendingStage=null;toastFrames=0;
 $('pause-dialog').close();$('result-dialog').close();$('home-screen').hidden=true;$('play-screen').hidden=false;$('climber-pause').hidden=false;$('climber-pause').textContent='Pause';document.body.classList.add('in-game');
 resize();buildStage(idx);lastTick=0;accumulator=0;
 const cfg=STAGES[idx],world=WORLDS[cfg.world],blade=BLADES.find(b=>b.id===progress.blade);
 $('world-label').textContent=rankFor(idx).name.toUpperCase()+' / '+world.name.toUpperCase();$('stage-title').textContent=String(idx+1).padStart(2,'0')+' · '+cfg.name;
 $('mission-copy').textContent=cfg.hint;$('flight-name').textContent=blade.name;$('flight-detail').textContent=blade.tip;$('checkpoint-info').textContent='A checkpoint waits halfway up.';$('toast').hidden=true;
 coach(cfg.hint,480);syncHUD();canvas.focus({preventScroll:true});announce('Stage '+(idx+1)+'. '+cfg.name+'. '+cfg.hint);
}
function spawn(x,y,color,count=12){if(progress.reduced)return;for(let i=0;i<count;i++){const a=i/count*Math.PI*2;particles.push({x,y,vx:Math.cos(a)*(1.5+Math.random()*2),vy:Math.sin(a)*2-1,life:30,maxLife:30,color,size:2+Math.random()*3});}if(particles.length>160)particles.splice(0,particles.length-160);}
function syncHUD(){if(!player)return;$('star-counter').textContent=starsCollected+' / '+starsTotal;$('burst-fill').style.transform='scaleX('+Math.min(1,player.energy/100)+')';$('burst-button').classList.toggle('ready',player.energy>=100);$('burst-button').setAttribute('aria-label',player.energy>=100?'Air burst ready. Tap or press Space.':'Air burst charging, '+Math.floor(player.energy)+' percent.');$('burst-label').textContent=player.energy>=100?'READY · SPACE':Math.floor(player.energy)+'% · CHARGING';const top=platforms.at(-1).y;$('altitude-fill').style.height=Math.max(0,Math.min(100,(GROUND-run.highY)/(GROUND-top)*100))+'%';}
function burst(){if(state!=='playing'||paused||player.energy<100)return false;const blade=BLADES.find(b=>b.id===progress.blade);player.vy=blade.burst;player.energy=0;player.burstFrames=30;dropping=false;run.bursts++;spawn(player.x,player.y,blade.color,22);sound('burst');toast('AIR BURST! Find your next landing.',75);return true;}
function rescue(){
 run.rescues++;run.combo=0;const p=checkpoint;
 player.x=p.x+p.w/2;player.y=p.y-20;player.vx=0;player.vy=JUMP;player.energy=100;player.prevX=player.x;player.prevY=player.y;player.burstFrames=0;
 camera=player.y-H*.55;previousCamera=camera;clearInput();platforms.forEach(p=>{p.broken=false;p.restore=0;});
 toast('Caught you! Your stars are safe.',150);coach('Try a Burst if you’re about to miss a landing.',300);sound('checkpoint');syncHUD();
}
function finishStage(){
 if(state!=='playing')return;const oldRank=rankFor(completed()).name;
 const medals=1|(starsCollected===starsTotal?2:0)|(run.rescues===0?4:0);progress.medals[currentStage]|=medals;saveProgress();bestStage=completed();state='clear';clearInput();
 $('result-tier').textContent='STAGE '+(currentStage+1)+' / '+STAGES[currentStage].name.toUpperCase();$('result-title').textContent=currentStage===9?'Sky legend!':medals===7?'A perfect climb!':'Sky high!';
 $('result-copy').textContent=starsCollected+' of '+starsTotal+' stars · '+Math.floor(run.frames/60)+' seconds · '+run.rescues+' rescues. '+(currentStage===9?'You reached the crown of the sky.':'Your next adventure is unlocked.');
 $('result-medals').innerHTML=[['◆','Reached the portal',1],['✦','Every star',2],['◇','No rescues',4]].map(([icon,label,bit])=>`<div class="${medals&bit?'earned':''}"><b>${icon}</b><span>${label}${medals&bit?' ✓':''}</span></div>`).join('');
 const rank=rankFor(bestStage).name;$('result-promotion').textContent=rank!==oldRank?'TIER UP! You’re now '+rank+'.':medals!==7?'Replay to earn the missing medals. Earned medals stay yours.':'All three medals earned. Beautiful flying!';
 $('next-button').textContent=currentStage===9?'SEE YOUR SKY JOURNEY →':'NEXT ADVENTURE →';$('replay-button').textContent=medals===7?'Fly this stage again':'Chase all three medals';
 sound('clear');$('result-dialog').showModal();announce($('result-title').textContent+' '+$('result-promotion').textContent);
}
function update(){
 frameCount++;if(state!=='playing'||paused)return;run.frames++;
 if(toastFrames>0&&--toastFrames===0)$('toast').hidden=true;if(coachFrames>0&&--coachFrames===0)$('coach').hidden=true;
 const blade=BLADES.find(b=>b.id===progress.blade),cfg=STAGES[currentStage];
 let move=(keys.ArrowRight||keys.KeyD||held.right?1:0)-(keys.ArrowLeft||keys.KeyA||held.left?1:0);
 if(touchX!==null){const r=canvas.getBoundingClientRect();move=touchX<r.left+r.width/2?-1:1;}
 dropping=!!(keys.ArrowDown||keys.KeyS||held.drop);if(dropping&&!run.usedDrop){run.usedDrop=true;coach('Release Drop to land again.',180);}
 if(actionPress){burst();actionPress=false;}
 const cycle=run.frames%600;run.wind=currentStage>=6&&cycle>330&&cycle<510?(Math.floor(run.frames/600)%2?-.045:.045):0;
 if(currentStage>=6&&cycle===290)toast('Wind coming '+(Math.floor(run.frames/600)%2?'←':'→')+' · Steer into it',100);
 player.vx=(player.vx+move*blade.force+run.wind)*blade.drag;player.vy=Math.min(15,player.vy+(dropping?.6:GRAVITY));
 const previousFoot=player.y+player.radius;player.x+=player.vx;player.y+=player.vy;player.angle+=player.spinSpeed+(player.burstFrames>0?.2:0);player.burstFrames=Math.max(0,player.burstFrames-1);
 // Soft walls keep the route readable; no invisible screen wrapping.
 if(player.x<player.radius){player.x=player.radius;player.vx=Math.max(0,player.vx)*.5;}if(player.x>W-player.radius){player.x=W-player.radius;player.vx=Math.min(0,player.vx)*.5;}
 for(const p of platforms){if(p.type==='moving')p.x=p.baseX+Math.sin(run.frames*.018+p.phase)*(currentStage<4?18:24);if(p.broken&&--p.restore<=0)p.broken=false;}
 // Sweep the feet through the platform top, preventing side and underside landings.
 if(player.vy>0&&!dropping){for(const p of platforms){if(p.broken||previousFoot>p.y+1||player.y+player.radius<p.y||player.x+player.radius*.8<p.x||player.x-player.radius*.8>p.x+p.w)continue;
  player.y=p.y-player.radius;player.vy=p.type==='boost'?-12.4:JUMP;run.landings++;
  const centered=Math.abs(player.x-(p.x+p.w/2))<p.w*.25;
  if(centered&&!p.charged){p.charged=true;run.clean++;run.combo++;player.energy=Math.min(100,player.energy+35);if(run.combo>1)toast('CENTER LANDING ×'+run.combo+' · +35 charge',65);}
  else if(!centered)run.combo=0;
  if(p.type==='fragile'){p.broken=true;p.restore=180;spawn(player.x,p.y,'#efa4b7',15);if(!run.crumbleTaught){run.crumbleTaught=true;coach('Crumble platforms return after 3 seconds.',240);}}
  else spawn(player.x,p.y,p.type==='boost'?'#ffe096':'#a4e2ff',8);
  if(p.type==='boost'){sound('burst');toast('SPRING JUMP! Steer toward your next platform.',80);}
  if(p.type==='checkpoint'&&checkpoint!==p){checkpoint=p;player.energy=100;$('checkpoint-info').textContent='Checkpoint active. Your stars are safe.';toast('CHECKPOINT! Burst refilled.',160);sound('checkpoint');}
  if(p.type==='finish'){finishStage();syncHUD();return;}
  break;
 }}
 for(const s of collectStars){s.x=s.platform.x+s.platform.w/2;if(!s.collected&&Math.hypot(player.x-s.x,player.y-s.y)<blade.pickup){s.collected=true;starsCollected++;player.energy=Math.min(100,player.energy+45);spawn(s.x,s.y,'#ffe096',16);sound('star');if(starsCollected===starsTotal)toast('ALL STARS! Now reach the portal.',170);else if(starsCollected===1)coach('Star caught! Stars give your burst +45 charge.',200);}}
 run.highY=Math.min(run.highY,player.y);
 const target=Math.min(GROUND-H+50,player.y-H*.55);camera+=(target-camera)*(target<camera?.12:.06);
 if(player.y>GROUND+85||player.y-camera>H+90){rescue();return;}
 if(!progress.reduced&&frameCount%2===0)trailParticles.push({x:player.x,y:player.y,life:18,maxLife:18,size:player.burstFrames?12:6});
 if(trailParticles.length>40)trailParticles.splice(0,trailParticles.length-40);
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.05;if(--p.life<=0)particles.splice(i,1);}
 for(let i=trailParticles.length-1;i>=0;i--)if(--trailParticles[i].life<=0)trailParticles.splice(i,1);
 if(frameCount%4===0)syncHUD();
}
