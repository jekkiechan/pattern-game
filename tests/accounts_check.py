"""Real browser → Better Auth → Postgres checks. Run tests/account-server.mjs first."""
import os, shutil, time
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('GAME_URL','http://127.0.0.1:8000')
OUT=Path(os.environ.get('QA_OUTPUT','/tmp/pattern-accounts-qa'));OUT.mkdir(parents=True,exist_ok=True)
PASSWORD='spinning-tops-123'
SUFFIX=str(time.time_ns())[-9:]
NEPHEW='kid_'+SUFFIX
UNCLE='adult_'+SUFFIX
def ready(page):page.wait_for_function('window.patternAccounts && (window.__bey || window.patternClimberReady || window.patternArcadeReady)')
def open_account(page):page.click('#trainer-button')
def close_account(page):page.click('#trainer-dialog .dialog-close')
def create(page,username,name):
 if page.locator('#create-trainer').is_visible():page.click('#create-trainer')
 else:open_account(page);page.click('[data-form=create]')
 for field,value in [('username',username),('password',PASSWORD)]:page.fill(f'#account-form [name={field}]',value)
 assert page.locator('#account-form input[name]').count()==2
 page.locator('#show-password').check();assert page.locator('[name=password]').get_attribute('type')=='text'
 page.locator('#show-password').uncheck()
 page.click('#account-form button');page.wait_for_selector('.recovery-code')
 with page.expect_download() as saved:page.click('#download-recovery')
 assert saved.value.suggested_filename=='pattern-recovery-code.txt'
 code=page.locator('.recovery-code').inner_text();assert len(code)==44
 page.click('#code-done');ready(page);return code
def signout(page):
 open_account(page);page.click('#account-signout');page.wait_for_function('window.patternAccounts && !window.patternAccounts.user && document.querySelector("#trainer-button").textContent==="Sign in"')
def login(page,username,password=PASSWORD):
 open_account(page);page.fill('[name=username]',username);page.fill('[name=password]',password);page.click('#account-form button');ready(page)
 page.wait_for_function('document.querySelector("#trainer-button").textContent!=="Sign in"')
def league_win(page):
 page.click('#play-league');page.click('[data-tier="0"]');page.click('#start-match')
 for round in range(2):
  page.click('#auto-launch');page.evaluate('const m=__bey.match;m.blades[1].spin=0;m.step()');page.wait_for_function('__bey.screen==="result"')
  if round==0:page.click('#result-next')
 page.click('.result-links .back-home');page.wait_for_function('__bey.screen==="home"')
def synced(page):page.wait_for_function('document.querySelector("#trainer-status").textContent.includes("Progress saved to your trainer")')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-webgl'])
 context=browser.new_context(viewport={'width':1280,'height':900});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/');ready(page)
 assert page.locator('#create-trainer').is_visible() and page.locator('#sign-in-trainer').is_visible()
 page.click('#play-guest');assert page.locator('#games-heading').evaluate('(el)=>el===document.activeElement')
 page.evaluate('localStorage.setItem("beybattleSave",JSON.stringify({wins:2}));localStorage.setItem("climberSkybound",JSON.stringify({version:1,medals:[3],blade:"volt"}))');page.reload();ready(page)
 print('Create trainer and export guest progress',flush=True)
 open_account(page)
 with page.expect_download() as downloaded:page.click('#export-guest')
 progress_file=OUT/'guest-progress.json';downloaded.value.save_as(progress_file);close_account(page)
 code=create(page,NEPHEW,'Nephew');synced(page)
 assert page.locator('#welcome-heading').inner_text().endswith(NEPHEW+'.')
 assert not page.locator('#welcome-actions').is_visible()
 assert page.locator('#guest-progress-invite').is_visible()
 page.screenshot(path=str(OUT/'arcade-signed-in.png'),full_page=True)
 page.click('.game.battle');ready(page)
 assert page.locator('#league-preview-stars').inner_text()=='0 / 27 ★'
 assert '2 trophies' not in page.locator('#record-line').inner_text(),'No implicit guest inheritance'
 league_win(page);synced(page);nephew_stars=page.locator('#league-preview-stars').inner_text();assert nephew_stars!='0 / 27 ★'
 page.click('#play-journey');page.fill('#trainer-name','Kid');page.click('#trainer-form button[type=submit]');page.click('[data-journey=home]');synced(page)
 page.goto(BASE+'/beyblade-climber.html');ready(page);assert page.locator('#trainer-button').inner_text()==NEPHEW
 assert page.locator('#medal-total').inner_text()=='0 / 30 ✦'
 page.click('[data-blade=nimbus]');page.click('#sound-button')
 # Real steering and unchanged rendering/physics for the first sky stage.
 sky_result=page.evaluate('''()=>{startStage(0);let target=0;for(let frame=0;frame<12000&&state==='playing';frame++){const p=platforms[target],dx=p.x+p.w/2-player.x-player.vx*5;keys.ArrowRight=dx>3;keys.ArrowLeft=dx< -3;const before=run.landings;update();drawBg();drawWorld();if(run.landings>before){const landed=platforms.find(p=>Math.abs(player.y+player.radius-p.y)<.1);if(landed)target=Math.min(landed.i+1,platforms.length-1);}}return {state,medals:progress.medals[0],rescues:run.rescues}}''')
 assert sky_result=={'state':'clear','medals':7,'rescues':0},sky_result
 page.click('#result-map');synced(page)
 print('Switch accounts and isolate both games',flush=True)
 signout(page);create(page,UNCLE,'Uncle');synced(page)
 assert page.locator('#medal-total').inner_text()=='0 / 30 ✦'
 assert page.locator('[data-blade=comet]').get_attribute('aria-pressed')=='true'
 page.goto(BASE+'/beybattle.html');ready(page)
 assert page.locator('#league-preview-stars').inner_text()=='0 / 27 ★'
 page.click('#play-journey');assert page.locator('#trainer-form').count()==1;page.click('[data-journey=home]')
 open_account(page);page.set_input_files('#import-file',str(progress_file))
 with page.expect_navigation():page.click('#import-confirm')
 ready(page);synced(page)
 assert '2 trophies' in page.locator('#record-line').inner_text()
 page.goto(BASE+'/beyblade-climber.html');ready(page);assert page.locator('#medal-total').inner_text()=='2 / 30 ✦'
 assert page.locator('[data-blade=volt]').get_attribute('aria-pressed')=='true'
 page.goto(BASE+'/beybattle.html');ready(page)
 signout(page);login(page,NEPHEW);assert page.locator('#league-preview-stars').inner_text()==nephew_stars
 page.click('#play-journey');assert page.evaluate('__bey.journey.name')=='Kid';page.click('[data-journey=home]')
 # A separate browser gets the same cloud progress, with no shared localStorage.
 print('Cross-device restoration and offline conflict',flush=True)
 remote_context=browser.new_context();remote=remote_context.new_page();remote.goto(BASE+'/beybattle.html');ready(remote);login(remote,NEPHEW)
 assert remote.locator('#league-preview-stars').inner_text()==nephew_stars
 remote.goto(BASE+'/beyblade-climber.html');ready(remote)
 assert remote.locator('#medal-total').inner_text()=='3 / 30 ✦'
 assert remote.locator('[data-blade=nimbus]').get_attribute('aria-pressed')=='true'
 assert remote.locator('#sound-button').inner_text()=='Sound on'
 remote.goto(BASE+'/beybattle.html');ready(remote)
 # Offline changes persist locally, then encounter a newer cloud revision.
 context.set_offline(True);page.click('#play-practice');page.click('#start-match');page.click('#auto-launch');page.click('#dash-button');page.click('#guard-button');page.click('#special-button');page.wait_for_function('__bey.screen==="result"');page.click('.result-links .back-home')
 remote.click('#settings-button');remote.locator('#sound-setting').uncheck();remote.locator('#settings-dialog .dialog-close').click();synced(remote)
 context.set_offline(False);page.evaluate('window.dispatchEvent(new Event("online"))')
 page.wait_for_function('document.querySelector("#trainer-status").textContent.includes("newer progress")')
 open_account(page);assert page.locator('.save-conflict').count()==1;page.click('[data-conflict=device]');synced(page);close_account(page)
 # Reconnect/reload and recover without email; old sessions are revoked.
 print('Password recovery and mobile dialogs',flush=True)
 signout(page);open_account(page);page.click('[data-form=recover]')
 for field,value in [('username',NEPHEW),('code',code),('password','new-spinning-password')]:page.fill(f'#account-form [name={field}]',value)
 page.click('#account-form button');page.wait_for_selector('.recovery-code');assert page.locator('.recovery-code').inner_text()!=code;page.click('#code-done');close_account(page)
 login(page,NEPHEW,'new-spinning-password');assert page.locator('#league-preview-stars').inner_text()==nephew_stars
 page.goto(BASE+'/');ready(page);assert '3 / 30 medals' in page.locator('#sky-progress').inner_text()
 page.click('#bring-guest-progress')
 assert not page.locator('[data-import-slot=beybattleLeague]').is_checked()
 assert not page.locator('[data-import-slot=climberSkybound]').is_checked()
 page.click('#import-cancel');close_account(page)
 for width,height in [(320,568),(390,844),(844,390),(1280,900)]:
  page.set_viewport_size({'width':width,'height':height});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Header overflow at {width}';page.screenshot(path=str(OUT/f'arcade-{width}.png'),full_page=True);open_account(page);page.click('#account-recovery');page.screenshot(path=str(OUT/f'account-{width}.png'))
  assert page.locator('#trainer-dialog').evaluate('(el)=>el.scrollWidth<=el.clientWidth+1');close_account(page)
 assert not errors,errors
 browser.close()
 print('Account browser checks passed: separate accounts and journeys, cross-device restore, offline conflict, recovery, responsive dialogs.')
