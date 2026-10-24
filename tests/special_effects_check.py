"""Signature move rendering checks; called by browser_check.py in CI."""
import os, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

PIXELS = """() => {
 const c=document.getElementById('special-effects');
 const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
 let n=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)n++;return n;
}"""
IMAGE = "document.getElementById('special-effects').toDataURL()"


def check_special_effects(browser, base, out):
 errors=[]
 for fallback in [False, True]:
  context=browser.new_context(viewport={'width':1280,'height':900})
  page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
  page.add_init_script("localStorage.setItem('beybattleLeague',JSON.stringify({sound:false,motion:true,low:false}))")
  if fallback:
   page.add_init_script("const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t.startsWith('webgl')?null:get.call(this,t,...a)}")
  # Install and pause before the app queues requestAnimationFrame. Switching
  # a live animation clock in Playwright 1.55 can leave stale resize frames.
  page.clock.install(time=1000000);page.clock.pause_at(1001000)
  page.goto(base+'/beybattle.html');page.wait_for_function('window.__bey')
  if fallback:assert page.evaluate('__bey.display.stats().backend')=='canvas2d'
  else:assert page.evaluate('__bey.display.stats().models')>0

  def advance(ms):
   # Keep software WebGL work bounded per browser-clock turn.
   while ms>0:
    step=min(80,ms);page.clock.fast_forward(step);ms-=step

  def begin(blade):
   page.evaluate("__bey.setup('duel')")
   assert page.evaluate(PIXELS)==0,'menu transition must clear effects'
   page.click('[data-filter="all"]',force=True)
   page.fill('#blade-search',page.evaluate('(id)=>__bey.roster[id].name',blade))
   page.click(f'#blade-grid [data-id="{blade}"]',force=True)
   page.click('#start-match',force=True);page.click('#auto-launch',force=True)
   advance(1000)
   # Keep AI choices out of screenshot timing; the actual special input is tested.
   page.evaluate('__bey.match.blades[1].decision=100;__bey.match.blades[1].warning=0;__bey.match.blades[0].energy=100')

  for blade,kind in [(0,'rush'),(3,'wave'),(6,'guard'),(9,'mend'),(2,'drain'),(4,'counter'),(32,'chaos')]:
   print(f'Special effect: {kind} / {"Canvas" if fallback else "WebGL"}',flush=True)
   begin(blade)
   page.keyboard.press('Space');advance(200)
   actual=page.evaluate('__bey.match.blades[0].specialType')
   assert actual in ['rush','wave','guard','mend','drain','counter']
   assert kind=='chaos' or actual==kind
   banner=page.locator('.special-callout.player')
   assert banner.is_visible() and banner.get_attribute('data-kind')==actual
   assert page.evaluate('__bey.match.blades[0].cfg.specialName') in banner.inner_text()
   assert page.evaluate(PIXELS)>100,'special must visibly render in the arena'
   assert page.evaluate('__bey.match.blades[0].stats.specials')==1
   page.screenshot(path=str(out/f'special-{kind}-{ "canvas" if fallback else "webgl" }.png'))
   if kind=='rush':
    page.keyboard.press('p');frozen=page.evaluate(IMAGE)
    advance(500);assert page.evaluate(IMAGE)==frozen,'pause must freeze visual time'
    page.click('#resume-button',force=True);advance(100)
    assert page.evaluate(IMAGE)!=frozen
   advance(3400)
   assert page.locator('.special-callout:not([hidden])').count()==0
   assert page.evaluate(PIXELS)==0,'expired moves must not leave trails or shields'

  begin(6);page.keyboard.press('Space')
  page.evaluate('__bey.match.blades[1].energy=100;__bey.match.special(1)');advance(100)
  assert page.locator('.special-callout:not([hidden])').count()==2
  for width,height in [(390,844),(320,568),(844,390)]:
   page.set_viewport_size({'width':width,'height':height})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'transient overflow at {width}x{height}'
   advance(160)
   overflow=page.evaluate("""() => ({width:innerWidth,scroll:document.documentElement.scrollWidth,
    elements:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth).map(el=>({id:el.id,cls:el.className,right:el.getBoundingClientRect().right}))})""")
   if overflow['scroll']>overflow['width']:page.screenshot(path=str(out/f'overflow-{width}.png'))
   assert overflow['scroll']<=overflow['width'],overflow
   for selector in ['.special-callout.player','.special-callout.rival','#dash-button','#guard-button','#special-button']:
    box=page.locator(selector).bounding_box()
    assert box and box['x']>=0 and box['x']+box['width']<=width+1
    assert box['y']>=0 and box['y']+box['height']<=height+1
   assert page.locator('#special-effects').evaluate('(el)=>getComputedStyle(el).pointerEvents')=='none'
   page.screenshot(path=str(out/f'special-simultaneous-{width}-{ "canvas" if fallback else "webgl" }.png'))

  # Switching settings mid-special removes motion immediately on resume.
  page.click('#settings-button',force=True);page.check('#motion-setting',force=True);page.check('#quality-setting',force=True)
  page.locator('#settings-dialog .dialog-close').click(force=True);advance(160)
  assert page.evaluate('__bey.display.motion') is False
  assert page.locator('.special-callout.player').evaluate('(el)=>el.style.transform')=='none','reduced motion must render after the settings dialog closes'
  canvas=page.locator('#special-effects')
  assert canvas.evaluate('(el)=>el.width')==round(page.evaluate('__bey.display.width'))
  # With positions fixed, reduced motion has no time-varying arena decoration.
  page.evaluate('__bey.match.step=()=>{}')
  before=page.evaluate(IMAGE);advance(200);assert page.evaluate(IMAGE)==before
  if not fallback:assert page.evaluate('__bey.display.camera.position.x')==0
  page.screenshot(path=str(out/f'special-reduced-{ "canvas" if fallback else "webgl" }.png'))

  page.click('#settings-button',force=True);page.uncheck('#motion-setting',force=True)
  page.locator('#settings-dialog .dialog-close').click(force=True)
  begin(3);page.evaluate('__bey.match.blades[1].spin=1');page.keyboard.press('Space');advance(48)
  assert page.evaluate('__bey.match.state')=='over'
  assert page.evaluate(PIXELS)>0,'a finishing special still shows its hit burst'
  advance(1500)
  assert page.evaluate('__bey.screen')=='result' and page.evaluate(PIXELS)==0
  context.close()
 assert not errors,errors
 print('Special effects: all six types + chaos, WebGL/Canvas, pause, cleanup, simultaneous moves, mobile, reduced motion, performance mode, finishing hit.',flush=True)


if __name__=='__main__':
 out=Path(os.environ.get('QA_OUTPUT','/tmp/beybattle-special-qa'));out.mkdir(parents=True,exist_ok=True)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
  check_special_effects(browser,os.environ.get('GAME_URL','http://127.0.0.1:8000'),out)
  browser.close()
