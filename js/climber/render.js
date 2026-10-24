// Canvas art is local, cached where useful, and independent of frame-rate physics.
const bgStars=Array.from({length:45},(_,i)=>({x:(i*97.37)%W,y:(i*137.53)%900,r:i%3===0?1.5:.7}));
function textAt(text,x,y,size,color,align='center'){ctx.font=`${size>15?'700':'600'} ${size}px Arial`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(text,x,y);}
function pill(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function drawBg(){
 const world=WORLDS[STAGES[currentStage].world],g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,world.sky[0]);g.addColorStop(1,world.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 const glow=ctx.createRadialGradient(310,100,0,310,100,240);glow.addColorStop(0,world.accent+'22');glow.addColorStop(1,world.accent+'00');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 ctx.strokeStyle=world.accent+'15';ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(300,100,70+i*43,70+i*43,0,0,Math.PI*2);ctx.stroke();}
 ctx.fillStyle=world.accent+'65';for(const s of bgStars){const y=((s.y-camera*.19)%(H+40)+H+40)%(H+40);ctx.beginPath();ctx.arc(s.x,y,s.r,0,Math.PI*2);ctx.fill();}
 // Quiet layers of distant floating islands give altitude without hiding the route.
 for(let i=0;i<5;i++){const x=(i*111+22)%W,y=((i*173-camera*.3)%(H+140)+H+140)%(H+140)-70;ctx.fillStyle=world.accent+'0c';ctx.beginPath();ctx.moveTo(x-65,y);ctx.lineTo(x+65,y-8);ctx.lineTo(x+20,y+45);ctx.lineTo(x-10,y+62);ctx.closePath();ctx.fill();pill(x-65,y-6,130,10,6,world.accent+'15');}
 if(run?.wind){ctx.strokeStyle='#d1ecff44';ctx.lineWidth=2;for(let i=0;i<7;i++){const x=((frameCount*(run.wind>0?2:-2)+i*73)%W+W)%W,y=80+i*63;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+30,y);ctx.stroke();}textAt(run.wind>0?'WIND →':'← WIND',W/2,52,11,'#d4eafd');}
}
function drawPlatform(p){
 const y=p.y-camera;if(y<-80||y>H+40)return;
 if(p.broken){ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle='#efacc055';ctx.strokeRect(p.x,y,p.w,PLAT_H);ctx.restore();return;}
 const colors={normal:['#4a7188','#b4e5ed'],moving:['#466b9f','#a1ceff'],fragile:['#976075','#ffc1d0'],boost:['#9b8247','#ffe096'],checkpoint:['#417e74','#9df0d0'],finish:['#5a7b88','#d9faf4']};
 const [base,edge]=colors[p.type];
 ctx.fillStyle=base+'77';ctx.beginPath();ctx.moveTo(p.x+5,y+PLAT_H);ctx.lineTo(p.x+p.w-5,y+PLAT_H);ctx.lineTo(p.x+p.w*.7,y+29);ctx.lineTo(p.x+p.w*.42,y+37);ctx.lineTo(p.x+p.w*.22,y+24);ctx.closePath();ctx.fill();
 pill(p.x,y,p.w,PLAT_H,5,base);pill(p.x,y,p.w,4,3,edge);
 if(p.type==='normal'||p.type==='moving'){pill(p.x+p.w*.31,y+5,p.w*.38,3,2,p.charged?'#b9e5f933':'#e3fcffb3');}
 if(p.type==='moving'){textAt('‹    ›',p.x+p.w/2,y+12,12,'#d9eaff');}
 if(p.type==='fragile'){ctx.strokeStyle='#542e4a';ctx.beginPath();ctx.moveTo(p.x+p.w*.37,y+3);ctx.lineTo(p.x+p.w*.45,y+9);ctx.lineTo(p.x+p.w*.39,y+13);ctx.moveTo(p.x+p.w*.7,y+3);ctx.lineTo(p.x+p.w*.64,y+13);ctx.stroke();}
 if(p.type==='boost'){textAt('↑  ↑  ↑',p.x+p.w/2,y+12,12,'#fff3c4');}
 if(p.type==='checkpoint'){const active=checkpoint===p;ctx.strokeStyle=active?'#bbffe6':'#7bbdae';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x+12,y);ctx.lineTo(p.x+12,y-33);ctx.stroke();ctx.fillStyle=active?'#b0ffe1':'#559c92';ctx.beginPath();ctx.moveTo(p.x+12,y-33);ctx.lineTo(p.x+34,y-26);ctx.lineTo(p.x+12,y-19);ctx.fill();textAt(active?'SAFE':'CHECKPOINT',p.x+p.w/2+7,y+25,8,'#b8f4da');}
 if(p.type==='finish'){ctx.save();const x=p.x+p.w/2;const g=ctx.createRadialGradient(x,y-35,5,x,y-35,60);g.addColorStop(0,'#abffe84d');g.addColorStop(1,'#abffe800');ctx.fillStyle=g;ctx.fillRect(x-65,y-100,130,120);ctx.strokeStyle='#bdffec';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y-33,25,37,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#bdffec44';ctx.lineWidth=8;ctx.stroke();textAt('PORTAL',x,y-83,10,'#d9fff1');ctx.restore();}
}
function drawStar(s){if(s.collected)return;const x=s.x,y=s.y-camera;if(y<-25||y>H+20)return;ctx.save();ctx.translate(x,y+(progress.reduced?0:Math.sin(frameCount*.045+x)*3));ctx.fillStyle='#ffe096';ctx.strokeStyle='#fff2c5';ctx.lineWidth=1.5;ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?4.5:10,a=i*Math.PI/5-Math.PI/2;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
function drawWorld(alpha=1){
 for(const t of trailParticles){ctx.globalAlpha=t.life/t.maxLife*.3;ctx.fillStyle=player.burstFrames?'#ffe096':'#a4def0';ctx.beginPath();ctx.arc(t.x,t.y-camera,t.size*t.life/t.maxLife,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 for(const p of platforms)drawPlatform(p);for(const s of collectStars)drawStar(s);
 for(const p of particles){ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y-camera,p.size,p.size);}ctx.globalAlpha=1;
 if(player){const x=player.prevX+(player.x-player.prevX)*alpha,y=player.prevY+(player.y-player.prevY)*alpha;const blade=BLADES.find(b=>b.id===progress.blade);ctx.strokeStyle=blade.color+(player.energy>=100?'bb':'33');ctx.lineWidth=player.burstFrames?3:1.5;ctx.beginPath();ctx.arc(x,y-camera,23,0,Math.PI*2);ctx.stroke();drawBeyblade(x,y-camera,player.radius+3,progress.reduced?0:player.prevAngle+(player.angle-player.prevAngle)*alpha,true);
 // A landing guide only while descending helps players judge where their blade is going.
 if(player.vy>0&&!dropping){const p=platforms.find(p=>!p.broken&&p.y>player.y+15&&p.y<player.y+150&&x>=p.x-10&&x<=p.x+p.w+10);if(p){ctx.fillStyle='#dafff055';ctx.beginPath();ctx.ellipse(x,p.y-camera-3,13,3,0,0,Math.PI*2);ctx.fill();}}
 }
}
let lastTick=0,accumulator=0,previousCamera=0;
function loop(ts){
 const elapsed=lastTick?Math.min((ts-lastTick)/1000,.1):0;lastTick=ts;
 if(paused||document.hidden||state!=='playing'){accumulator=0;requestAnimationFrame(loop);return;}
 accumulator+=elapsed;let steps=0;
 while(accumulator>=1/60&&steps<5){player.prevX=player.x;player.prevY=player.y;player.prevAngle=player.angle;previousCamera=camera;update();accumulator-=1/60;steps++;if(state!=='playing')break;}
 if(steps===5)accumulator=0;
 const simCamera=camera;camera=previousCamera+(camera-previousCamera)*Math.min(1,accumulator*60);drawBg();drawWorld(Math.min(1,accumulator*60));camera=simCamera;
 requestAnimationFrame(loop);
}
resize();requestAnimationFrame(loop);
