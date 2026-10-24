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
def ready(page):page.wait_for_function('window.__bey')
def open_account(page):page.click('#trainer-button')
def close_account(page):page.click('#trainer-dialog .dialog-close')
def create(page,username,name):
 open_account(page);page.click('[data-form=create]')
 for field,value in [('username',username),('name',name),('password',PASSWORD)]:page.fill(f'#account-form [name={field}]',value)
 page.click('#account-form button');page.wait_for_selector('.recovery-code')
 code=page.locator('.recovery-code').inner_text();assert len(code)==44
 page.click('#code-done');ready(page);return code
def signout(page):
 open_account(page);page.click('#account-signout');page.wait_for_function('window.__bey && document.querySelector("#trainer-button").textContent==="Trainer / Sign in"')
def login(page,username,password=PASSWORD):
 open_account(page);page.fill('[name=username]',username);page.fill('[name=password]',password);page.click('#account-form button');ready(page)
 page.wait_for_function('document.querySelector("#trainer-button").textContent!=="Trainer / Sign in"')
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
 page.goto(BASE+'/beybattle.html');ready(page)
 page.evaluate('localStorage.setItem("beybattleSave",JSON.stringify({wins:2}))');page.reload();ready(page)
 print('Create trainer and export guest progress',flush=True)
 open_account(page)
 with page.expect_download() as downloaded:page.click('#export-guest')
 progress_file=OUT/'guest-progress.json';downloaded.value.save_as(progress_file);close_account(page)
 code=create(page,NEPHEW,'Nephew');synced(page)
 assert page.locator('#league-preview-stars').inner_text()=='0 / 27 ★'
 assert '2 trophies' not in page.locator('#record-line').inner_text(),'No implicit guest inheritance'
 league_win(page);synced(page);nephew_stars=page.locator('#league-preview-stars').inner_text();assert nephew_stars!='0 / 27 ★'
 page.click('#play-journey');page.fill('#trainer-name','Kid');page.click('#trainer-form button[type=submit]');page.click('[data-journey=home]');synced(page)
 print('Switch accounts and isolate story saves',flush=True)
 signout(page);create(page,UNCLE,'Uncle');synced(page)
 assert page.locator('#league-preview-stars').inner_text()=='0 / 27 ★'
 page.click('#play-journey');assert page.locator('#trainer-form').count()==1;page.click('[data-journey=home]')
 open_account(page);page.set_input_files('#import-file',str(progress_file));page.click('#import-confirm');ready(page);synced(page)
 assert '2 trophies' in page.locator('#record-line').inner_text()
 signout(page);login(page,NEPHEW);assert page.locator('#league-preview-stars').inner_text()==nephew_stars
 page.click('#play-journey');assert page.evaluate('__bey.journey.name')=='Kid';page.click('[data-journey=home]')
 # A separate browser gets the same cloud progress, with no shared localStorage.
 print('Cross-device restoration and offline conflict',flush=True)
 remote_context=browser.new_context();remote=remote_context.new_page();remote.goto(BASE+'/beybattle.html');ready(remote);login(remote,NEPHEW)
 assert remote.locator('#league-preview-stars').inner_text()==nephew_stars
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
 for width,height in [(320,568),(390,844),(844,390),(1280,900)]:
  page.set_viewport_size({'width':width,'height':height});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'Header overflow at {width}';open_account(page);page.click('#account-recovery');page.screenshot(path=str(OUT/f'account-{width}.png'))
  assert page.locator('#trainer-dialog').evaluate('(el)=>el.scrollWidth<=el.clientWidth+1');close_account(page)
 assert not errors,errors
 browser.close()
 print('Account browser checks passed: separate accounts and journeys, cross-device restore, offline conflict, recovery, responsive dialogs.')
