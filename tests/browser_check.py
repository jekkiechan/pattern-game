"""UI regression: Python Playwright + Chromium; serve repository on port 8000."""
import json, os, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('GAME_URL','http://127.0.0.1:8000')
OUT=Path(os.environ.get('QA_OUTPUT','/tmp/pattern-league-qa'));OUT.mkdir(parents=True,exist_ok=True)
errors=[];bad=[]
def observe(page):
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
def load(page,path='beybattle.html'):
 page.goto(BASE+'/'+path)
 if path=='beybattle.html':page.wait_for_function('window.__bey')
def screen(page,name):page.wait_for_function('(name)=>__bey.screen===name',arg=name)
def finish(page,winner):
 page.evaluate('(winner)=>{const m=__bey.match;m.blades[1-winner].spin=0;m.step();}',winner)
 screen(page,'result')
def launch(page):
 page.click('#auto-launch');page.wait_for_function('__bey.match.state==="playing"')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':1000});observe(page);load(page)
 page.screenshot(path=str(OUT/'desktop-home.png'))
 print('Visual learning',flush=True)
 page.click('#learn-button')
 assert page.locator('#help-dialog').is_visible()
 for i,move in enumerate(['dash','guard','special']):
  page.locator(f'[data-lesson="{i}"]').focus();page.keyboard.press('Enter')
  assert page.locator(f'[data-lesson="{i}"]').get_attribute('aria-pressed')=='true'
  assert page.locator('#lesson-count').inner_text()==f'{i+1} / 3'
  assert page.locator(f'#lesson-scene .move-{move}').count()==1
  assert page.locator('#lesson-copy').inner_text()
  assert page.locator('.help-details').evaluate('(el)=>!el.open')
  assert page.locator('#lesson-scene').evaluate('(el)=>el.getAnimations({subtree:true}).every(a=>a.effect.getTiming().iterations===1)')
 page.click('#lesson-replay');assert page.locator('#lesson-count').inner_text()=='3 / 3'
 page.click('#lesson-next');assert page.locator('#lesson-count').inner_text()=='1 / 3'
 page.emulate_media(reduced_motion='reduce')
 assert page.locator('#lesson-scene .demo-player').evaluate('(el)=>getComputedStyle(el).animationName')=='none'
 assert page.locator('#lesson-copy').is_visible()
 page.emulate_media(reduced_motion='no-preference')
 page.locator('.help-details summary').click();assert page.locator('.help-details').evaluate('(el)=>el.open')
 page.keyboard.press('Escape');assert not page.locator('#help-dialog').is_visible()
 assert page.locator('#learn-button').evaluate('(el)=>el===document.activeElement')
 # Both saved settings provide static demonstrations without hiding their meaning.
 for setting in ['motion-setting','quality-setting']:
  page.click('#settings-button');page.locator('#'+setting).check();page.locator('#settings-dialog .dialog-close').click()
  page.click('#help-button');page.click('[data-lesson="1"]')
  assert page.locator('#lesson-scene .demo-rival').evaluate('(el)=>getComputedStyle(el).animationName')=='none'
  page.keyboard.press('Escape');page.click('#settings-button');page.locator('#'+setting).uncheck();page.locator('#settings-dialog .dialog-close').click()
 print('Roster and duel flow',flush=True)
 page.click('#play-duel');assert page.locator('.blade-card').count()==4
 assert not page.locator('#special-desc').is_visible()
 page.locator('.blade-details summary').click();assert page.locator('#special-desc').is_visible()
 page.locator('.blade-details summary').click()
 page.click('[data-filter="all"]');assert page.locator('.blade-card').count()==33
 page.fill('#blade-search','not a blade');assert page.locator('#empty-search').is_visible()
 page.fill('#blade-search','the pattern');assert page.locator('.blade-card').count()==1
 page.click('.blade-card');assert page.locator('#blade-name').inner_text()=='THE PATTERN'
 page.fill('#blade-search','');page.locator('#match-settings summary').click()
 assert page.locator('[data-arena]').count()==6
 page.click('[data-arena="rail"]');page.click('[data-difficulty="expert"]')
 page.click('#start-match');launch(page)
 assert page.evaluate('__bey.match.arena')=='rail'
 page.keyboard.press('q');assert page.evaluate('__bey.match.blades[0].stats.dashes')==1
 page.keyboard.press('e');assert page.evaluate('__bey.match.blades[0].guardCD')>0
 page.evaluate('__bey.match.blades[0].energy=100');page.keyboard.press('Space');assert page.evaluate('__bey.match.blades[0].stats.specials')==1
 page.click('#help-button');before=page.evaluate('__bey.match.time');page.click('#lesson-next');page.wait_for_timeout(100);assert page.evaluate('__bey.match.time')==before
 page.keyboard.press('Escape');page.wait_for_function('!__bey.paused && !document.querySelector("dialog[open]")')
 page.click('#pause-button');before=page.evaluate('__bey.match.time');page.wait_for_timeout(200);assert page.evaluate('__bey.match.time')==before
 page.click('#resume-button');page.evaluate("window.dispatchEvent(new Event('blur'))");assert page.evaluate('__bey.paused');page.click('#resume-button')
 page.evaluate("document.getElementById('scene').dispatchEvent(new PointerEvent('pointercancel',{pointerId:1}))");assert page.evaluate('__bey.match.blades[0].steer') is None
 finish(page,0);assert page.evaluate('__bey.session.score')==[1,0]
 page.click('#result-next');launch(page);finish(page,0);assert page.evaluate('__bey.session.score')==[2,0]
 assert page.locator('#result-title').inner_text()=='Duel won!'
 page.click('#result-next');assert page.evaluate('__bey.session.score')==[0,0]
 print('Model cache',flush=True)
 # All models build, thumbnails and GPU model cache remain bounded.
 page.evaluate("__bey.setup('duel')");page.evaluate('for(let i=0;i<33;i++)__bey.display.snapshot(i)')
 render=page.evaluate('__bey.display.stats()');assert render['models']<=8
 print('Championship',flush=True)
 page.locator('#setup-screen .back-home').click();page.click('#play-championship');page.click('#start-match')
 assert page.locator('.bracket-rival').count()==3
 for stage in range(3):
  page.click('#bracket-next');assert page.evaluate('__bey.session.stage')==stage
  if stage==0:
   for loss in range(2):
    launch(page);finish(page,1);page.click('#result-next')
   assert page.evaluate('__bey.session.stage')==0 and page.evaluate('__bey.session.score')==[0,0]
  for rnd in range(2):
   launch(page);finish(page,0)
   if rnd==0:page.click('#result-next')
  if stage<2:page.click('#result-next');screen(page,'bracket')
 assert page.locator('#result-title').inner_text()=='Champion!'
 assert page.evaluate("JSON.parse(localStorage.getItem('beybattleLeague')).trophies")==1
 print('Practice',flush=True)
 # Practice actual actions; wait for warning and guard it, without injecting block stats.
 page.locator('#result-screen .back-home').click();page.click('#play-practice');page.locator('#match-settings summary').click() if not page.locator('#match-settings').evaluate('(el)=>el.open') else None;page.click('[data-difficulty="rookie"]');page.click('#start-match');launch(page);page.click('#dash-button')
 for attempt in range(20):
  if page.evaluate('__bey.match.blades[0].stats.guards')>0:break
  # The hit can land after click() returns. Stop on a real block even if it
  # arrives while waiting for the next cue, rather than waiting another rush.
  page.wait_for_function("__bey.match.blades[0].stats.guards>0 || (document.getElementById('guard-button').classList.contains('incoming') && __bey.match.blades[0].guardCD<=0)",timeout=20000)
  if page.evaluate('__bey.match.blades[0].stats.guards')>0:break
  page.click('#guard-button');page.wait_for_timeout(1100)
 assert page.evaluate('__bey.match.blades[0].stats.guards')>0,'Practice guard instruction must be usable'
 page.wait_for_function('!document.getElementById("special-button").disabled');page.click('#special-button');screen(page,'result')
 assert page.locator('#result-eyebrow').inner_text()=='PRACTICE COMPLETE'
 print('Phone and fallback',flush=True)
 # Phone touch and responsive layouts.
 phone=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
 mobile=phone.new_page();observe(mobile);load(mobile);mobile.screenshot(path=str(OUT/'mobile-home.png'))
 for w,h in [(390,844),(320,568),(844,390)]:
  mobile.set_viewport_size({'width':w,'height':h});mobile.tap('#help-button')
  for i in range(3):
   mobile.tap(f'[data-lesson="{i}"]')
   assert mobile.locator('#help-dialog').evaluate('(el)=>el.scrollWidth<=el.clientWidth'),f'Help overflow at {w}'
   assert mobile.locator(f'[data-lesson="{i}"]').bounding_box()['height']>=44
  mobile.locator('#help-dialog').evaluate('(el)=>el.scrollTop=0')
  box=mobile.locator('#help-practice').bounding_box();assert box['y']+box['height']<=h+1,('Tutorial practice action',w,h,box)
  mobile.screenshot(path=str(OUT/f'tutorial-{w}x{h}.png'))
  mobile.locator('#help-practice').scroll_into_view_if_needed();assert mobile.locator('#help-practice').is_visible()
  mobile.locator('#help-dialog .dialog-close').tap()
 mobile.set_viewport_size({'width':390,'height':844})
 mobile.tap('#play-duel');mobile.screenshot(path=str(OUT/'mobile-setup.png'));mobile.tap('#start-match');mobile.tap('#auto-launch');mobile.tap('#dash-button')
 assert mobile.evaluate('__bey.match.blades[0].stats.dashes')==1
 for w,h in [(390,844),(320,568),(844,390),(768,1024)]:
  mobile.set_viewport_size({'width':w,'height':h});mobile.wait_for_timeout(100)
  assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth'),str((w,h))+' overflow'
  for selector in ['#dash-button','#guard-button','#special-button']:
   box=mobile.locator(selector).bounding_box();assert box['height']>=44 and box['width']>=44;assert box['y']+box['height']<=h+1
  mobile.screenshot(path=str(OUT/f'battle-{w}x{h}.png'))
 mobile.tap('#pause-button');mobile.tap('#resume-button')
 # Software compatibility path remains fully playable.
 compat=browser.new_page(viewport={'width':390,'height':844});observe(compat)
 compat.add_init_script("const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)}")
 load(compat);compat.click('#play-duel');compat.click('#start-match');launch(compat);compat.click('#dash-button');assert compat.evaluate('__bey.match.blades[0].stats.dashes')==1
 compat.screenshot(path=str(OUT/'compatibility.png'))
 # New tier run persists its first unlock; existing modes remain playable.
 print('League progression',flush=True)
 page.evaluate("()=>{const saved=JSON.parse(localStorage.getItem('beybattleLeague'));saved.trained=false;localStorage.setItem('beybattleLeague',JSON.stringify(saved));}")
 load(page);page.click('#play-league');assert page.locator('[data-tier]:not([disabled])').count()==1
 page.screenshot(path=str(OUT/'league-map.png'));page.click('[data-tier="0"]');page.click('#start-match')
 assert page.locator('#battle-objective').is_visible()
 page.click('#practice-tip');assert page.evaluate('__bey.session.mode')=='practice'
 launch(page);page.click('#dash-button')
 # Return flow is independent of skill scoring, covered by the real guard test above.
 page.evaluate('()=>{const m=__bey.match;m.blades[0].stats.guards=1;m.blades[0].stats.specials=1;}')
 screen(page,'result');page.click('#result-next');assert page.locator('#setup-mode').inner_text().startswith('NOVICE')
 page.click('#start-match')
 for rnd in range(2):
  launch(page);finish(page,0)
  if rnd==0:page.click('#result-next')
 assert page.locator('#result-title').inner_text()=='Novice conquered!'
 assert page.evaluate('__bey.league.medals[0]')>=1
 page.reload();page.wait_for_function('window.__bey');page.click('#play-league');assert page.locator('[data-tier]:not([disabled])').count()==2
 # Check restored blade rarity labels and filtering.
 page.click('[data-tier="1"]');page.click('[data-filter="all"]');page.select_option('#tier-filter','GOD');assert page.locator('.blade-card').count()==1
 assert 'GOD' in page.locator('.blade-card').inner_text()
 # Climber has its own real-input route suite in climber_check.py.
 climber={'suite':'tests/climber_check.py','stages':10}
 for path in ['index.html','how-to-play.html','beyblade-climber.html']:
  load(mobile,path);assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth');mobile.screenshot(path=str(OUT/(path+'.png')))
 assert not errors,errors
 assert not bad,bad
 report={'renderer':render,'climber':climber,'javascriptErrors':errors,'failedResources':bad,'checks':['visual tutorial/navigation/replay','static reduced-motion/performance demos','optional blade details','mobile tutorial','roster/search','keyboard actions','pause/blur','round/duel/rematch','championship/trophy','practice real guard','touch controls','four viewport sizes','WebGL fallback','nine-tier progression/persistence','restored rarity filter','Climber responsive navigation']}
 (OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));browser.close()
