"""Browser regression checks. Requires Python Playwright and a local HTTP server.
Run: python -m http.server 8000 & python tests/browser_check.py
No packages are needed to play or deploy the games.
"""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://127.0.0.1:8000')
OUT = Path(os.environ.get('QA_OUTPUT', '/tmp/pattern-qa'))
OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440,'height':900})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/beybattle.html')
    page.wait_for_timeout(200)
    page.screenshot(path=str(OUT/'beybattle-desktop.png'))
    page.click('#btn-start')
    assert page.locator('#char-grid .char-card').count() == 33
    page.get_by_role('button',name='ATTACK',exact=True).click()
    assert page.locator('#char-grid .char-card').count() < 33
    page.get_by_role('button',name='ATTACK',exact=True).click()
    page.locator('#char-grid .char-card').filter(has_text='THE PATTERN').click()
    assert page.locator('#detail-name').inner_text() == 'THE PATTERN'
    page.screenshot(path=str(OUT/'roster-desktop.png'))
    page.click('#btn-fight')
    assert page.locator('.arena-card').count() == 6
    page.locator('.arena-card').filter(has_text='NEON RAIL').click()
    page.screenshot(path=str(OUT/'arenas-desktop.png'))
    page.click('#btn-arena-next')
    assert page.locator('.selected-opp').count() == 3
    page.click('#btn-opponents')
    assert page.evaluate('G.state') == 'ready'
    page.keyboard.press('Space')
    assert page.evaluate('G.state') == 'active'
    page.evaluate('G.blades.forEach(b=>{b.stamina=b.maxStamina=100000;b.burstResist=1})')
    page.keyboard.down('Space');page.wait_for_timeout(2200)
    assert page.evaluate('G.blades[0].chargeProgress') == 1
    page.keyboard.up('Space')
    assert page.evaluate('G.blades[0].specialCooldown') > 0
    page.click('#btn-pause')
    before = page.evaluate('G.activeTime')
    page.wait_for_timeout(250)
    assert page.evaluate('G.activeTime') == before
    page.click('#btn-resume')
    page.keyboard.press('KeyD')
    assert page.evaluate('G.boostCooldown') > 0
    page.screenshot(path=str(OUT/'battle-desktop.png'))
    regression = page.evaluate('''() => {
      const assert=(v,msg)=>{if(!v)throw Error(msg)};
      const oldWin=checkWin,oldHit=playHit,oldLaunch=playLaunch,oldWhoosh=playWhoosh,oldOut=playSpinOut;
      checkWin=playHit=playLaunch=playWhoosh=playSpinOut=()=>{};
      let frames=0, peak=0;
      for(let c=0;c<CONFIGS.length;c++) {
        G.selectedChar=c;G.selectedOpponents=[(c+1)%33,(c+2)%33,(c+3)%33];G.selectedArena=c%ARENAS.length;
        startRound();G.playerLaunchDx=0;G.playerLaunchDy=-140;G.playerLaunchDist=140;launchAll();G.state='active';
        activateSpecial(G.blades[0]);
        for(let t=0;t<360;t++) {
          update(1/60);frames++;peak=Math.max(peak,G.parts.length);
          G.blades.forEach(b=>assert([b.x,b.y,b.vx,b.vy,b.stamina,b.spinRate].every(Number.isFinite),b.name+' finite physics'));
          if(t%60===0)render();
        }
        assert(bladeSprite(CONFIGS[c])===bladeSprite(CONFIGS[c]),'sprite cache reused');
      }
      G.selectedArena=5;G.selectedChar=0;G.selectedOpponents=[3,5,9];startRound();G.state='active';
      const a=G.blades[0],b=G.blades[1];
      a.x=G.arenaX;a.y=G.arenaY+G.arenaR+20;a.vx=0;a.vy=-8;
      wallCheck(a,ARENAS[5]);assert(a.vy<0,'incoming launch must stay inward');
      a.x=G.arenaX;a.y=G.arenaY;b.x=a.x+30;b.y=a.y;a.vx=-2;b.vx=2;a.vy=b.vy=0;
      const health=a.stamina;bladeCollide(a,b);assert(a.stamina===health,'separating overlap must not damage');
      a.x=G.arenaX+G.arenaRCurrent*.8;a.y=G.arenaY;a.stamina=50;a.railCooldown=0;
      doBoost(a,{x:G.arenaX,y:G.arenaY});assert(a.stamina===58&&a.railCooldown===4,'rail reward');
      doBoost(a,{x:G.arenaX,y:G.arenaY});assert(a.stamina===58,'rail cooldown prevents repeat heal');
      G.mode='tournament';tStartTournament();tBeginNextRound();
      a.stamina=50;tOnRoundEnd(true,G.blades[0]);assert(G.tournament.victories===1,'tournament progression');
      tBeginNextRound();assert(G.tournament.round===2,'second round');
      assert(G.blades[0].stamina>0,'stamina carryover');
      G.tournament.round=3;tOnRoundEnd(true,G.blades[0]);
      assert(document.getElementById('screen-champion').classList.contains('active'),'champion screen');
      tStartTournament();tBeginNextRound();tOnRoundEnd(false,null);
      assert(document.getElementById('screen-end').classList.contains('active'),'elimination screen');
      G.mode='single';G.tournament=null;
      checkWin=oldWin;playHit=oldHit;playLaunch=oldLaunch;playWhoosh=oldWhoosh;playSpinOut=oldOut;
      showScreen('screen-start');
      return {characters:CONFIGS.length,arenas:ARENAS.length,simulationFrames:frames,peakParticles:peak};
    }''')
    # Full round end lifecycle.
    page.click('#btn-instant');page.click('#btn-launch')
    page.evaluate('G.blades.slice(1).forEach(b=>b.alive=false);checkWin()')
    page.wait_for_timeout(1500)
    assert page.locator('#screen-end').is_visible()
    assert not page.locator('#battle-controls').is_visible()
    page.click('#btn-restart')
    assert page.locator('#screen-select').is_visible()
    # Render benchmark uses same scene and dimensions as the original baseline.
    benchmark=page.evaluate('''() => {
      G.selectedChar=0;G.selectedOpponents=[19,21,29];G.selectedArena=0;startRound();
      G.playerLaunchDx=0;G.playerLaunchDy=-100;G.playerLaunchDist=100;launchAll();G.state='active';
      for(let i=0;i<10;i++)render();const samples=[];
      for(let round=0;round<5;round++){const t=performance.now();for(let i=0;i<120;i++)render();samples.push((performance.now()-t)/120);}
      return {renderMs:samples,textureCount:bladeTextures.size};
    }''')
    page.evaluate("showScreen('screen-start')")
    # Climber speed is independent of display refresh rate.
    page.goto(BASE+'/beyblade-climber.html')
    climber=page.evaluate('''() => {
      const raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
      const counts=[];
      for(const hz of [30,60,120]){
        state='title';actionPress=false;frameCount=0;lastTick=0;accumulator=0;paused=false;
        loop(1000);for(let i=1;i<=hz*2;i++)loop(1000+i*1000/hz);
        counts.push(frameCount);
      }
      window.requestAnimationFrame=raf;
      for(let i=0;i<10;i++){buildStage(i);if(collectStars.length!==starsTotal)throw Error('uncollectable star target');}
      startStage(0);
      return {updatesPerTwoSeconds:counts,stages:STAGES.length};
    }''')
    assert max(climber['updatesPerTwoSeconds'])-min(climber['updatesPerTwoSeconds']) <= 1
    page.click('#climber-pause');frame=page.evaluate('frameCount');page.wait_for_timeout(200)
    assert frame==page.evaluate('frameCount')
    page.click('#climber-paused')
    page.screenshot(path=str(OUT/'climber-desktop.png'))
    # Mobile, high density, real touch launch and pointer cancellation.
    phone=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    mobile=phone.new_page();mobile.on('pageerror',lambda error:errors.append(str(error)))
    for path in ['index.html','beybattle.html','beyblade-climber.html']:
      mobile.goto(BASE+'/'+path);mobile.wait_for_timeout(150)
      assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth'),path+' overflow'
      mobile.screenshot(path=str(OUT/(path.replace('.html','')+'-mobile.png')))
    mobile.goto(BASE+'/beybattle.html');mobile.tap('#btn-instant')
    mobile.tap('#btn-launch');assert mobile.evaluate('G.state')=='active'
    mobile.evaluate("G.pressIsCharging=true;canvas.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1}))")
    assert not mobile.evaluate('G.pressIsCharging')
    mobile.tap('#btn-pause');mobile.set_viewport_size({'width':844,'height':390})
    assert mobile.evaluate('G.blades.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y))')
    mobile.tap('#btn-resume');mobile.wait_for_timeout(250)
    # Frame pacing in headless Chromium; this is not a physical-phone benchmark.
    pacing=page.evaluate('''() => new Promise(resolve=>{let prev=performance.now();const d=[];function sample(t){d.push(t-prev);prev=t;if(d.length<120)requestAnimationFrame(sample);else{d.sort((a,b)=>a-b);resolve({medianMs:d[60],p95Ms:d[114]})}}requestAnimationFrame(sample)})''')
    assert not errors, errors
    report={'regression':regression,'benchmark':benchmark,'climber':climber,'framePacing':pacing,'javascriptErrors':errors}
    (OUT/'report.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report))
    browser.close()
