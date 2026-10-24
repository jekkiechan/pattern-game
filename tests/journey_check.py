"""Journey navigation/persistence integration. Battle results use the existing engine test surface.
Run against python -m http.server 8000. Engine and tactics tests cover real battle rules.
"""
import os, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('GAME_URL','http://127.0.0.1:8000')
OUT=Path(os.environ.get('QA_OUTPUT','/tmp/pattern-journey-qa'));OUT.mkdir(parents=True,exist_ok=True)
errors=[];bad=[]
def load(page):
 page.goto(BASE+'/beybattle.html');page.wait_for_function('window.__bey');page.click('#play-journey')
def portraits(page):
 scene=page.evaluate('__bey.journey.scene')
 # Check the visible portrait against the authored speaker, including reply switches.
 expected=page.evaluate("""async()=>{const {CHAPTERS}=await import('./src/beybattle/journey.js');const s=__bey.journey,c=CHAPTERS[s.scene.chapter],e=c[s.scene.part][s.scene.line];return e.replySpeaker&&s.choices[s.scene.chapter]?e.replySpeaker:e.speaker==='narrator'?c.character:e.speaker;}""")
 assert page.locator('.scene-avatar').get_attribute('data-portrait')==expected,(scene,expected)
 assert page.locator('.scene-avatar').is_visible()
 assert page.locator('.traveler-avatar[data-portrait="trainer"]').is_visible()

def talk(page):
 for _ in range(12):
  if page.evaluate('__bey.screen')!='journey':return
  if not page.locator('.dialogue-panel').count():return
  portraits(page)
  choices=page.locator('[data-choice]')
  if choices.count():choices.first.click()
  else:page.click('[data-journey="next"]')
 raise AssertionError('Dialogue did not terminate')
def win_round(page,winner):
 page.click('#auto-launch')
 page.evaluate('(winner)=>{const m=__bey.match;m.blades[1-winner].spin=0;m.step();}',winner)
 page.wait_for_function('__bey.screen==="result"')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':1000})
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
 load(page);page.evaluate('document.fonts.ready');assert page.evaluate('document.fonts.check("16px Noto Sans") && document.fonts.check("24px Noto Serif")')
 page.screenshot(path=str(OUT/'starter-desktop.png'),full_page=True)
 page.fill('#trainer-name','Haru');page.click('[data-starter="6"]');page.click('#trainer-form button[type="submit"]')
 assert page.evaluate('__bey.journey.starter')==6
 page.click('[data-journey="next"]');page.click('[data-journey="next"]')
 assert page.locator('[data-choice]').count()==2
 page.click('[data-choice="wonder"]');assert page.locator('.dialogue-reply').is_visible()
 load(page);assert page.evaluate('__bey.journey.scene.line')==2;assert page.locator('.dialogue-reply').is_visible()
 portraits(page)
 assert page.evaluate("async()=>{const img=new Image();img.src='assets/trainers/wind-road-cast.webp';await img.decode();return img.naturalWidth>0&&img.naturalHeight>0;}")
 page.screenshot(path=str(OUT/'dialogue-desktop.png'),full_page=True)
 for chapter in range(6):
  if chapter:page.locator('.region-card[data-chapter="'+str(chapter)+'"]').click()
  talk(page);assert page.evaluate('__bey.session.chapter')==chapter;assert page.evaluate('__bey.session.player')==6
  if chapter==0:
   win_round(page,1);page.click('#result-next');win_round(page,1)
   assert page.evaluate('__bey.journey.completed')==0
   assert page.locator('#result-title').inner_text()=='The road is still yours.'
   page.click('#result-next')
  win_round(page,0);page.click('#result-next');win_round(page,0)
  assert page.evaluate('__bey.journey.completed')==chapter+1
  assert not page.locator('#result-loadout').is_visible()
  page.click('#result-next');talk(page)
  assert page.locator('.region-card:not([disabled])').count()==min(chapter+2,6)
  if chapter==0:page.screenshot(path=str(OUT/'map-desktop.png'),full_page=True)
 assert page.locator('.journey-bottom').inner_text().startswith('✦ Wind Road champion')
 load(page);assert page.evaluate('__bey.journey.completed')==6
 page.click('[data-journey="journal"]');assert page.locator('.journal-entry:not(.unwritten)').count()==6
 page.screenshot(path=str(OUT/'journal-desktop.png'),full_page=True)
 page.click('[data-journey="reset"]');page.click('[data-journey="cancel-reset"]');assert page.evaluate('__bey.journey.completed')==6
 # Every responsive story screen must fit the viewport, including longer names.
 mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 mobile.on('pageerror',lambda e:errors.append(str(e)));load(mobile)
 for width,height in [(320,568),(390,844),(844,390),(768,1024)]:
  mobile.set_viewport_size({'width':width,'height':height});assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth'),('starter',width)
 mobile.set_viewport_size({'width':390,'height':844});mobile.screenshot(path=str(OUT/'starter-mobile.png'),full_page=True)
 mobile.fill('#trainer-name','A name with < > &');mobile.click('[data-starter="11"]');mobile.click('#trainer-form button[type="submit"]')
 for width,height in [(320,568),(390,844),(844,390),(768,1024)]:
  mobile.set_viewport_size({'width':width,'height':height});assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth'),('dialogue',width)
 mobile.set_viewport_size({'width':390,'height':844});mobile.screenshot(path=str(OUT/'dialogue-mobile.png'),full_page=True)
 mobile.click('[data-journey="leave-scene"]')
 for width,height in [(320,568),(390,844),(844,390),(768,1024)]:
  mobile.set_viewport_size({'width':width,'height':height});assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth'),('map',width)
 mobile.set_viewport_size({'width':390,'height':844});mobile.screenshot(path=str(OUT/'map-mobile.png'),full_page=True)
 mobile.click('[data-journey="reset"]');mobile.click('[data-journey="confirm-reset"]');assert mobile.locator('#trainer-form').is_visible()
 # Denied storage is visible and does not prevent a journey, even with Canvas fallback.
 compat=browser.new_page()
 compat.add_init_script("Storage.prototype.setItem=function(){throw new Error('blocked')};const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)}")
 load(compat);compat.fill('#trainer-name','Aki');compat.click('#trainer-form button[type="submit"]');assert 'Storage unavailable' in compat.locator('.journey-save').inner_text();talk(compat);assert compat.evaluate('__bey.screen')=='battle'
 assert not errors,errors
 assert not bad,bad
 print('Journey browser checks passed: full six-chapter ending, loss/retry, choices, reload, locks, journal, reset, four responsive layouts, blocked storage, Canvas fallback and local fonts.')
 browser.close()
