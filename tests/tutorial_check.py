"""Tutorial playback, accessible stills, responsive help and Practice integration."""
import os
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://127.0.0.1:8000')
OUT = Path(os.environ.get('QA_OUTPUT', '/tmp/pattern-tutorial-qa'))
OUT.mkdir(parents=True, exist_ok=True)


def pose(locator):
    return locator.evaluate('(el) => getComputedStyle(el).transform')


with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),
        args=['--no-sandbox', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1100, 'height': 1000})
    errors, bad = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: bad.append(r.url) if r.status >= 400 else None)
    page.goto(BASE + '/how-to-play.html')
    page.wait_for_selector('move-demo svg')
    assert page.locator('move-demo svg[aria-label]').count() == 8
    assert page.locator('details[open]').count() == 0
    dash = page.locator('move-demo[move="dash"]')
    dash.locator('.demo-replay').click()
    before = pose(dash.locator('.demo-player'))
    page.wait_for_timeout(1850)
    assert pose(dash.locator('.demo-player')) != before, 'Dash must visibly move'
    dash.locator('.demo-toggle').click()
    paused = pose(dash.locator('.demo-player'))
    page.wait_for_timeout(250)
    assert pose(dash.locator('.demo-player')) == paused, 'Pause must stop movement'
    dash.locator('.demo-replay').click()
    assert dash.locator('.demo-replay').evaluate('(el) => el === document.activeElement')
    assert dash.locator('.demo-toggle').get_attribute('aria-label') == 'Pause Dash animation'
    page.locator('details summary').first.click()
    assert page.get_by_role('heading', name='Perfect guard → counter').is_visible()
    page.locator('details summary').first.click()
    for width, height in [(320, 568), (390, 844), (844, 390), (768, 1024)]:
        page.set_viewport_size({'width': width, 'height': height})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path=str(OUT / 'guide-mobile.png'), full_page=True)

    page.emulate_media(reduced_motion='reduce')
    for move in ['dash', 'guard', 'special', 'steer', 'charge', 'burst', 'drop']:
        demo = page.locator(f'move-demo[move="{move}"]')
        demo.scroll_into_view_if_needed()
        assert not demo.locator('.demo-toggle').is_visible()
        before = pose(demo.locator('.demo-player'))
        page.wait_for_timeout(100)
        assert pose(demo.locator('.demo-player')) == before
        assert demo.locator('svg').evaluate('(el) => el.getAnimations({subtree:true}).length') == 0
    assert page.locator('move-demo[move="guard"] .demo-shield').evaluate('(el) => getComputedStyle(el).opacity') == '1'
    page.emulate_media(reduced_motion='no-preference')

    page.goto(BASE + '/beybattle.html')
    page.wait_for_function('window.__bey')
    page.click('#help-button')
    assert page.locator('#help-dialog move-demo svg').count() == 4
    for width, height in [(320, 568), (390, 844), (844, 390), (1100, 1000)]:
        page.set_viewport_size({'width': width, 'height': height})
        assert page.locator('#help-dialog').evaluate('(el) => el.scrollWidth <= el.clientWidth')
    page.click('#help-practice')
    page.click('#auto-launch')
    assert page.locator('#coach-demo').get_attribute('move') == 'dash'
    page.click('#dash-button')
    page.wait_for_function('document.getElementById("coach-demo").getAttribute("move") === "guard"')
    # Real warning and real guard; do not inject success stats.
    for _ in range(20):
        if page.locator('#coach-demo').get_attribute('move') == 'special':
            break
        page.wait_for_function('document.getElementById("guard-button").classList.contains("incoming") && !document.getElementById("guard-button").disabled', timeout=20000)
        page.click('#guard-button')
        page.wait_for_timeout(1100)
    assert page.locator('#coach-demo').get_attribute('move') == 'special'
    page.click('#special-button')
    page.wait_for_function('__bey.screen === "result"')
    assert page.locator('#result-eyebrow').inner_text() == 'PRACTICE COMPLETE'
    # Saved game preference also produces useful static demos.
    page.click('#settings-button')
    page.check('#motion-setting')
    page.click('#settings-dialog .dialog-close')
    page.click('#help-button')
    assert page.locator('#help-dialog .demo-toggle:visible').count() == 0
    assert page.locator('#help-dialog .demo-player').first.evaluate('(el) => el.getAnimations({subtree:true}).length') == 0
    page.screenshot(path=str(OUT / 'help-reduced.png'))

    page.goto(BASE + '/beyblade-climber.html')
    assert page.locator('.how-demos move-demo svg').count() == 3
    page.click('a[href="how-to-play.html#climber"]')
    assert page.locator('#climb-guide-title').is_visible()
    assert not errors, errors
    assert not bad, bad
    browser.close()
    print('Tutorial checks passed: animated playback, pause/replay, accessible stills, small screens, help → Practice completion, and Skybound → guide.')
