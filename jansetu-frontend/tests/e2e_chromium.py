"""End-to-end tests for the JanSetu front end (Playwright + Chromium).

Setup (once):   pip install playwright && playwright install chromium
Run:            python tests/e2e_chromium.py [--shots screenshots_folder]

The script opens the static site from disk (file://), exercises every interactive
component at a desktop and a mobile viewport, prints PASS / FAIL for each check
and writes test_results.json.  Optional --shots saves screenshots for the report.
"""
import json, os, re, sys, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
def URL(p):
    path, _, qs = p.partition('?')
    return (ROOT / path).as_uri() + ('?' + qs if qs else '')
SHOTS = None
if '--shots' in sys.argv:
    SHOTS = Path(sys.argv[sys.argv.index('--shots') + 1]); SHOTS.mkdir(parents=True, exist_ok=True)

results = []
def check(name, cond, detail=''):
    results.append({'name': name, 'pass': bool(cond), 'detail': detail})
    print(('PASS  ' if cond else 'FAIL  ') + name + (('  -> ' + str(detail)) if (detail and not cond) else ''))

def shot(page, name, main=False, wait=450, **kw):
    if not SHOTS: return
    page.evaluate("document.getElementById('toast-region').innerHTML=''")   # no half-faded toasts in screenshots
    page.wait_for_timeout(wait)                                             # let CSS animations finish
    if main:   # element screenshot of <main>: un-stick the header so it does not cover the top
        page.evaluate("document.querySelector('.site-header').style.position='static'")
        page.locator('main .container').first.screenshot(path=str(SHOTS / f'{name}.png'), **kw)
        page.evaluate("document.querySelector('.site-header').style.position=''")
    else:
        page.screenshot(path=str(SHOTS / f'{name}.png'), **kw)

tmp = Path(tempfile.mkdtemp())
(tmp / 'valid.pdf').write_bytes(b'%PDF-1.4 sample document ' * 40)
(tmp / 'virus.exe').write_bytes(b'MZ' * 100)
(tmp / 'big.pdf').write_bytes(b'0' * (3 * 1024 * 1024))

def visible(page, sel): return page.locator(sel).first.is_visible()
def new_page(browser, kind):
    if kind == 'desktop':
        ctx = browser.new_context(viewport={'width': 1366, 'height': 768})
    else:   # iPhone-sized viewport with touch and 2x pixel density
        ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'), lambda r: r.abort())   # tests must not depend on the network
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    page._errors = errors
    return page

def apply_flow(page, tag):
    page.goto(URL('apply.html'))
    page.evaluate('localStorage.clear()'); page.goto(URL('apply.html'))
    page.click('#btn-next')
    check(f'{tag} apply: step 1 blocks without a service', 'Select a service' in page.inner_text('#error-summary'))
    page.select_option('#service', 'income')
    page.click('#btn-next')
    check(f'{tag} apply: step 1 blocks until eligibility confirmed', 'confirm all' in page.inner_text('#error-summary'))
    shot(page, f'{tag}_apply_step1', main=True)
    page.check('[data-elig="0"]'); page.check('[data-elig="1"]'); page.click('#btn-next')
    check(f'{tag} apply: reaches step 2 (dynamic fields for Income Certificate)', visible(page, '#step-2') and page.locator('#f-annualIncome').count() == 1)
    page.click('#btn-next')
    n = page.locator('#error-summary li').count()
    check(f'{tag} apply: empty step 2 lists 6 problems', n == 6, n)
    check(f'{tag} apply: invalid inputs get aria-invalid', page.locator('[aria-invalid="true"]').count() >= 6)
    page.fill('#f-fullName', 'Ananya Roy'); page.fill('#f-dob', '2000-05-10'); page.fill('#f-mobile', '12345')
    page.fill('#f-address', '12 Park Street'); page.fill('#f-pincode', '700016'); page.fill('#f-annualIncome', 'abc')
    page.click('#btn-next')
    txt = page.inner_text('#error-summary')
    check(f'{tag} apply: mobile and income rules explained in plain language', '10-digit' in txt and 'whole number' in txt)
    shot(page, f'{tag}_apply_step2_errors', main=True)
    page.fill('#f-mobile', '98765 43210'); page.fill('#f-annualIncome', '1,20,000'); page.click('#btn-next')
    check(f'{tag} apply: valid details reach step 3', visible(page, '#step-3'))
    page.click('#btn-next')
    check(f'{tag} apply: step 3 requires all 3 documents', page.locator('#error-summary li').count() == 3)
    page.set_input_files('#doc-0', str(tmp / 'virus.exe'))
    check(f'{tag} upload: .exe rejected', 'Only PDF' in page.inner_text('#doc-0-err'))
    page.set_input_files('#doc-0', str(tmp / 'big.pdf'))
    check(f'{tag} upload: 3 MB file rejected', 'larger than 2 MB' in page.inner_text('#doc-0-err'))
    for i in range(3): page.set_input_files(f'#doc-{i}', str(tmp / 'valid.pdf'))
    check(f'{tag} upload: valid files listed', page.locator('.filelist li').count() == 3)
    shot(page, f'{tag}_apply_step3', main=True)
    page.click('#btn-next')
    check(f'{tag} apply: review shows entered data', 'Ananya Roy' in page.inner_text('#review') and 'JS' not in page.inner_text('#review')[:0])
    page.click('#btn-next')
    check(f'{tag} apply: declaration required', 'declaration' in page.inner_text('#error-summary'))
    shot(page, f'{tag}_apply_step4', main=True)
    page.check('#declare'); page.click('#btn-next')
    ref = page.inner_text('#ref-code')
    check(f'{tag} apply: submit shows valid reference ID', re.fullmatch(r'JS-\d{4}-\d{5}', ref), ref)
    shot(page, f'{tag}_apply_success', main=True)
    return ref

def run():
    with sync_playwright() as p:
        b = p.chromium.launch()
        # ------------------------- DESKTOP -------------------------
        page = new_page(b, 'desktop')
        page.goto(URL('index.html'))
        check('desktop home: title present', 'JanSetu' in page.title())
        shot(page, 'desktop_home', wait=1800)
        # Navigation dropdown
        btn = page.locator('#primary-nav .has-sub > button')
        check('desktop nav: hamburger hidden, links visible', not visible(page, '.nav-toggle') and visible(page, '.nav__list'))
        check('desktop nav: dropdown closed by default', not visible(page, '#sub-services') and btn.get_attribute('aria-expanded') == 'false')
        btn.click()
        check('desktop nav: click opens dropdown (aria-expanded=true)', visible(page, '#sub-services') and btn.get_attribute('aria-expanded') == 'true')
        shot(page, 'desktop_nav_dropdown')
        page.keyboard.press('Escape')
        check('desktop nav: Escape closes dropdown and returns focus', not visible(page, '#sub-services') and page.evaluate('document.activeElement.getAttribute("aria-controls")') == 'sub-services')
        page.keyboard.press('ArrowDown')
        check('desktop nav: ArrowDown opens menu and focuses first link', visible(page, '#sub-services') and page.evaluate('document.activeElement.textContent') == 'All services')
        page.click('h1'); 
        check('desktop nav: click outside closes dropdown', not visible(page, '#sub-services'))
        # Accordion
        page.click('#faq-b0')
        check('desktop faq: first panel opens', visible(page, '#faq-p0') and page.get_attribute('#faq-b0', 'aria-expanded') == 'true')
        page.click('#faq-b1')
        check('desktop faq: opening another closes the first', not visible(page, '#faq-p0') and visible(page, '#faq-p1'))
        page.locator('#faq').scroll_into_view_if_needed(); shot(page, 'desktop_faq')
        # Counters
        page.locator('.stats').scroll_into_view_if_needed(); page.wait_for_timeout(2000)
        check('desktop counters: animate to final values', page.inner_text('[data-count="98000"]') == '98,000+', page.inner_text('[data-count="98000"]'))
        # Quick track validation
        page.fill('#quick-ref', 'abc'); page.click('#quick-track button')
        check('desktop home: quick track rejects bad ID', 'Enter an ID' in page.inner_text('#quick-ref-error'))
        # Theme, text size, language
        page.evaluate('window.scrollTo(0,0)')
        page.click('#theme-toggle')
        check('desktop tools: dark mode toggles', page.evaluate('document.documentElement.dataset.theme') == 'dark' and page.get_attribute('#theme-toggle', 'aria-pressed') == 'true')
        shot(page, 'desktop_home_dark')
        page.reload()
        check('desktop tools: dark mode persists after reload', page.evaluate('document.documentElement.dataset.theme') == 'dark')
        page.click('#theme-toggle'); page.click('#text-size')
        check('desktop tools: text size increases', page.evaluate('document.documentElement.dataset.text') == 'lg')
        page.click('#text-size'); page.click('#text-size')
        page.evaluate('window.scrollTo(0,0)'); page.select_option('#lang', 'hi')
        check('desktop tools: language switch to Hindi', page.inner_text('.nav__list li:first-child a') == 'होम' and page.evaluate('document.documentElement.lang') == 'hi')
        shot(page, 'desktop_home_hindi', clip={'x': 0, 'y': 0, 'width': 1366, 'height': 560})
        page.select_option('#lang', 'en')
        check('desktop home: no JavaScript errors', not page._errors, page._errors)

        # Services directory
        page.goto(URL('services.html'))
        check('desktop services: 12 cards rendered from data', page.locator('#results article').count() == 12)
        shot(page, 'desktop_services')
        page.fill('#q', 'tax'); page.wait_for_timeout(350)
        check('desktop services: live search "tax" -> 1 result', page.locator('#results article').count() == 1 and 'Property Tax' in page.inner_text('#results'))
        check('desktop services: result count announced', page.inner_text('#count') == '1 service found')
        page.fill('#q', 'zzzz'); page.wait_for_timeout(350)
        check('desktop services: empty state message', 'No services match' in page.inner_text('#results'))
        page.click('#clear')
        check('desktop services: clear filters restores all', page.locator('#results article').count() == 12)
        page.click('[data-cat="Welfare"]')
        check('desktop services: category filter Welfare -> 3', page.locator('#results article').count() == 3)
        page.click('[data-cat="All"]'); page.select_option('#sort', 'days')
        check('desktop services: sort fastest first (1-day service on top)', 'Property Tax Record' in page.inner_text('#results article:first-child'))
        page.select_option('#sort', 'relevance')
        # Modal
        trigger = page.locator('[data-open="income"]'); trigger.click()
        check('desktop modal: opens with service title', page.evaluate('document.getElementById("service-modal").open') and page.inner_text('#modal-title') == 'Income Certificate')
        shot(page, 'desktop_modal')
        page.keyboard.press('Escape')
        check('desktop modal: Escape closes and returns focus to trigger', not page.evaluate('document.getElementById("service-modal").open') and page.evaluate('document.activeElement.dataset.open') == 'income')
        trigger.click(); page.mouse.click(5, 5)
        check('desktop modal: backdrop click closes', not page.evaluate('document.getElementById("service-modal").open'))
        page.goto(URL('services.html?q=birth&cat=Certificates'))
        check('desktop services: URL parameters set filters', page.locator('#results article').count() == 1 and page.input_value('#q') == 'birth')

        # Apply flow + draft
        ref = apply_flow(page, 'desktop')
        page.click('#track-link')
        page.wait_for_timeout(1300)
        check('desktop track: link opens the new application (Submitted)', ref in page.inner_text('#result') and 'Submitted' in page.inner_text('#result'))
        page.goto(URL('apply.html?service=birth')); page.evaluate('localStorage.removeItem("js.draft")'); page.goto(URL('apply.html?service=birth'))
        page.check('[data-elig="0"]'); page.check('[data-elig="1"]'); page.click('#btn-next')
        page.fill('#f-fullName', 'Ramesh Das'); page.click('#btn-save')
        check('desktop draft: Save draft shows confirmation', 'Draft saved' in page.inner_text('#draft-status'))
        page.goto(URL('apply.html'))
        check('desktop draft: restored after reload', visible(page, '#restore-note') and page.input_value('#f-fullName') == 'Ramesh Das')
        shot(page, 'desktop_apply_restored', main=True)
        # Track page
        page.goto(URL('track.html')); page.evaluate('localStorage.clear()'); page.goto(URL('track.html'))
        page.fill('#ref', 'nope'); page.click('#track-form button')
        check('desktop track: invalid ID format explained', 'Enter an ID' in page.inner_text('#ref-error'))
        page.fill('#ref', 'JS-2026-00001'); page.click('#track-form button')
        check('desktop track: unknown ID handled', 'No application found' in page.inner_text('#ref-error'))
        page.fill('#ref', 'js-2026-88912'); page.click('#track-form button'); page.wait_for_timeout(1300)
        check('desktop track: demo ID shows Under review', page.inner_text('#result .chip') == 'Under review')
        shot(page, 'desktop_track')
        page.click('#simulate'); page.wait_for_timeout(1300)
        check('desktop track: simulate advances status to Document verification', page.inner_text('#result .chip') == 'Document verification', page.inner_text('#result .chip'))
        page.fill('#ref', 'JS-2026-87740'); page.click('#track-form button'); page.wait_for_timeout(1300)
        check('desktop track: approved application', 'ready to download' in page.inner_text('#result'))
        # Labels present on every field, every page
        for pg in ['index.html', 'services.html', 'apply.html', 'track.html']:
            page.goto(URL(pg))
            bad = page.evaluate('''() => Array.from(document.querySelectorAll("input:not([type=hidden]),select,textarea")).filter(e => !(e.labels && e.labels.length) && !e.getAttribute("aria-label")).map(e => e.id)''')
            check(f'a11y: every form control on {pg} has a label', not bad, bad)
        page.context.close()

        # -------------------------- MOBILE --------------------------
        page = new_page(b, 'mobile')
        page.goto(URL('index.html'))
        shot(page, 'mobile_home', wait=1800)
        check('mobile nav: hamburger visible, nav hidden', visible(page, '.nav-toggle') and not visible(page, '#primary-nav'))
        page.tap('.nav-toggle')
        check('mobile nav: hamburger opens panel (aria-expanded=true)', visible(page, '#primary-nav') and page.get_attribute('.nav-toggle', 'aria-expanded') == 'true')
        page.tap('#primary-nav .has-sub > button')
        check('mobile nav: dropdown expands inline', visible(page, '#sub-services'))
        shot(page, 'mobile_nav_open')
        page.keyboard.press('Escape')
        check('mobile nav: Escape closes panel', not visible(page, '#primary-nav'))
        for pg in ['index.html', 'services.html', 'apply.html', 'track.html']:
            for w in (320, 390):
                page.set_viewport_size({'width': w, 'height': 800}); page.goto(URL(pg))
                ov = page.evaluate('document.documentElement.scrollWidth - window.innerWidth')
                check(f'mobile layout: no horizontal scroll on {pg} at {w}px', ov <= 0, ov)
        page.set_viewport_size({'width': 390, 'height': 844})
        page.goto(URL('services.html')); shot(page, 'mobile_services')
        page.tap('[data-open="birth"]')
        check('mobile modal: opens and fits the screen', page.evaluate('document.getElementById("service-modal").getBoundingClientRect().width <= window.innerWidth'))
        shot(page, 'mobile_modal'); page.keyboard.press('Escape')
        ref2 = apply_flow(page, 'mobile')
        page.goto(URL('apply.html')); page.evaluate('localStorage.clear()'); page.goto(URL('apply.html?service=income'))
        page.check('[data-elig="0"]'); page.check('[data-elig="1"]'); page.click('#btn-next')
        labels_visible = page.locator('.stepper__label:visible').count()
        check('mobile stepper: only the current label is shown', labels_visible == 1, labels_visible)
        shot(page, 'mobile_apply_step2', main=True)
        for w in (320, 390):
            page.set_viewport_size({'width': w, 'height': 844}); page.goto(URL('track.html?ref=JS-2026-88912')); page.wait_for_timeout(1200)
            ov = page.evaluate('document.documentElement.scrollWidth - window.innerWidth')
            check(f'mobile layout: no horizontal scroll on track result at {w}px', ov <= 0, ov)
        page.set_viewport_size({'width': 390, 'height': 844}); shot(page, 'mobile_track', main=True)
        check('mobile home: no JavaScript errors', not page._errors, page._errors)
        page.context.close(); b.close()
    passed = sum(r['pass'] for r in results)
    print(f'\n{passed}/{len(results)} checks passed')
    (ROOT / 'test_results.json').write_text(json.dumps(results, indent=1), encoding='utf-8')
    return passed == len(results)

if __name__ == '__main__':
    sys.exit(0 if run() else 1)
