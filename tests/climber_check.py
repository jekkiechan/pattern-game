"""Climber gameplay regression: serve repository on port 8000, then run with Python Playwright."""
import json, os, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('GAME_URL','http://127.0.0.1:8000')
OUT=Path(os.environ.get('QA_OUTPUT','/tmp/pattern-climber-qa'));OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/beyblade-climber.html');page.wait_for_function('window.patternClimberReady');assert page.locator('[data-stage]').count()==10
 assert page.locator('[data-stage]:not([disabled])').count()==1
 page.click('[data-blade="nimbus"]');page.reload();page.wait_for_function('window.patternClimberReady');assert page.locator('[data-blade="nimbus"]').get_attribute('aria-pressed')=='true'
 page.screenshot(path=str(OUT/'home-desktop.png'),full_page=True)
 page.click('#continue-button');page.keyboard.press('Space');page.wait_for_function('run.bursts===1')
 page.click('#climber-pause');before=page.evaluate('run.frames');page.wait_for_timeout(150);assert before==page.evaluate('run.frames')
 page.click('#climber-paused');page.evaluate("window.dispatchEvent(new Event('blur'))");assert page.evaluate('paused');page.click('#climber-paused')
 # A miss is a recoverable gameplay event: checkpoint, stars and burst survive it.
 recovery=page.evaluate('''()=>{startStage(2);checkpoint=platforms.find(p=>p.type==='checkpoint');collectStars[0].collected=true;starsCollected=1;player.y=GROUND+100;update();return {rescues:run.rescues,stars:starsCollected,x:player.x,checkpointX:checkpoint.x+checkpoint.w/2,energy:player.energy}}''')
 assert recovery['rescues']==1 and recovery['stars']==1 and recovery['energy']==100 and recovery['x']==recovery['checkpointX']
 # Identical inputs give the same simulation at different display refresh rates.
 timing=page.evaluate('''()=>{const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;const out=[];for(const hz of [30,60,120]){startStage(0);lastTick=0;accumulator=0;loop(1000);for(let i=1;i<=hz*2;i++)loop(1000+i*1000/hz);out.push({frames:run.frames,x:player.x,y:player.y});}window.requestAnimationFrame=raf;return out;}''')
 assert max(t['frames'] for t in timing)-min(t['frames'] for t in timing)<=1
 assert max(t['y'] for t in timing)-min(t['y'] for t in timing)<10
 # Every authored landing needs a finite position, including the portal.
 geometry=page.evaluate('''()=>STAGES.map((cfg,stage)=>{buildStage(stage);return {stage:stage+1,aligned:cfg.route.length===cfg.x.length,finite:platforms.every(p=>[p.x,p.y,p.w].every(Number.isFinite))&&collectStars.every(s=>[s.x,s.y].every(Number.isFinite))};})''')
 assert all(g['aligned'] and g['finite'] for g in geometry),geometry
 # Real steering through all 30 stage/loadout combinations. No teleporting, extra
 # energy or weakened physics. Draw every frame too: invalid portal coordinates
 # can pass collision comparisons but throw in Canvas and stop the animation loop.
 routes=page.evaluate('''()=>{const out=[];for(const blade of BLADES){progress.blade=blade.id;for(let stage=0;stage<10;stage++){startStage(stage);let target=0;for(let frame=0;frame<12000&&state==='playing';frame++){const p=platforms[target],dx=p.x+p.w/2-player.x-player.vx*5;keys.ArrowRight=dx>3;keys.ArrowLeft=dx< -3;const before=run.landings;update();drawBg();drawWorld();if(run.landings>before){const landed=platforms.find(p=>Math.abs(player.y+player.radius-p.y)<.1);if(landed)target=Math.min(landed.i+1,platforms.length-1);}}out.push({blade:blade.id,stage:stage+1,finished:state==='clear',stars:starsCollected,total:starsTotal,rescues:run.rescues,seconds:Math.round(run.frames/60)});}}return out;}''')
 assert all(r['finished'] and r['rescues']==0 for r in routes),routes
 assert all(r['stars']==r['total'] for r in routes if r['stage']==1)
 assert page.locator('#result-dialog').is_visible();page.screenshot(path=str(OUT/'result.png'))
 # Replays cannot erase a previously earned medal; clearing stages is saved.
 retained=page.evaluate('''()=>{progress.medals[0]=7;startStage(0);run.rescues=1;starsCollected=0;finishStage();return progress.medals[0]}''');assert retained==7
 page.reload();page.wait_for_function('window.patternClimberReady');assert page.locator('[data-stage]:not([disabled])').count()==10;assert page.locator('#rank-name').inner_text()=='God'
 # Real touch and responsive controls, including cancellation of a held direction.
 phone=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 mobile=phone.new_page();mobile.on('pageerror',lambda e:errors.append(str(e)));mobile.goto(BASE+'/beyblade-climber.html');mobile.wait_for_function('window.patternClimberReady');mobile.screenshot(path=str(OUT/'home-mobile.png'),full_page=True);mobile.tap('#continue-button')
 mobile.tap('#burst-button');mobile.wait_for_function('run.bursts===1')
 mobile.evaluate("document.getElementById('right-button').dispatchEvent(new PointerEvent('pointercancel',{pointerId:1}))");assert mobile.evaluate('held.right') is False
 for w,h in [(390,844),(320,568),(844,390),(768,1024)]:
  mobile.set_viewport_size({'width':w,'height':h});mobile.wait_for_timeout(100)
  assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
  for selector in ['#left-button','#right-button','#drop-button','#burst-button']:
   box=mobile.locator(selector).bounding_box();assert box['width']>=44 and box['height']>=44 and box['y']+box['height']<=h+1,(w,h,selector,box)
  mobile.screenshot(path=str(OUT/f'play-{w}x{h}.png'))
 mobile.tap('#climber-pause');mobile.tap('#pause-map');assert mobile.locator('#home-screen').is_visible()
 # Storage failure must not prevent a playable session.
 restricted=browser.new_page();restricted.add_init_script("Storage.prototype.setItem=function(){throw new Error('Storage disabled')}");restricted.goto(BASE+'/beyblade-climber.html');restricted.wait_for_function('window.patternClimberReady');restricted.click('[data-blade="volt"]');restricted.click('#continue-button');assert restricted.evaluate('state')=='playing'
 assert not errors,errors
 report={'geometry':geometry,'routes':routes,'timing':timing,'recovery':recovery,'javascriptErrors':errors,'checks':['30 real-input route completions','fixed-step timing','checkpoint recovery','tier and medal persistence','replay preservation','keyboard/touch burst','pause and tab blur','4 responsive layouts','blocked storage']}
 (OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));browser.close()
