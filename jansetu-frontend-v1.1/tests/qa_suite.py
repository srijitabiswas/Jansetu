"""JanSetu QA suite. Usage: python suite.py <base_url> <label>
Runs functional, edge-case, accessibility and responsive tests against a served copy of the site
and writes out/<label>_results.json.  Every test has an ID used in the test plan and bug log."""
import sys, json, re, time
from common import *

BASE = sys.argv[1].rstrip('/'); LABEL = sys.argv[2]
U = lambda p: f'{BASE}/{p}'
PAGES = ['index.html', 'services.html', 'apply.html', 'track.html']
SC_DIR = Path('/home/claude/w4/out/shots_' + LABEL); SC_DIR.mkdir(parents=True, exist_ok=True)

def clear(pg): pg.evaluate('localStorage.clear()')
def visible(pg, sel): return pg.locator(sel).first.is_visible()

def get_services(pg):
    pg.goto(U('services.html')); return pg.evaluate('JanSetu.SERVICES')

def fill_field(pg, f, dob='1990-05-10'):
    fid = '#f-' + f['id']
    if f['type'] == 'select': pg.select_option(fid, index=1); return
    kind = f.get('kind', 'text')
    val = {'name':'Ananya Roy', 'whole':'12000', 'text':'Sample text 12', 'pastDate':'2010-05-10', 'dob':dob, 'mobile':'9876543210', 'email':'a@example.com', 'pin':'700016'}.get(kind, 'Sample')
    pg.fill(fid, val)

def apply_flow(pg, svc, dob=None, files=None, submit=True, wipe=True):
    """Complete the wizard for one service with valid data. Returns the reference ID."""
    pg.goto(U('apply.html?service=' + svc['id']))
    if wipe: clear(pg); pg.goto(U('apply.html?service=' + svc['id']))
    for i in range(len(svc['eligibility'])): pg.check(f'[data-elig="{i}"]')
    pg.click('#btn-next')
    pg.fill('#f-fullName', 'Ananya Roy'); pg.fill('#f-dob', dob or ('1950-01-01' if svc.get('minAge') else '1990-05-10'))
    pg.fill('#f-mobile', '9876543210'); pg.fill('#f-address', '12 Park Street'); pg.fill('#f-pincode', '700016')
    for f in svc['extra']: fill_field(pg, f)
    pg.click('#btn-next')
    if not visible(pg, '#step-3'): raise Exception('did not reach step 3: ' + pg.inner_text('#error-summary')[:200])
    for i in range(len(svc['docs'])): pg.set_input_files(f'#doc-{i}', str(files or TMP/'ok.pdf'))
    pg.click('#btn-next'); pg.check('#declare')
    if submit:
        pg.click('#btn-next'); return pg.inner_text('#ref-code')

CASES = []
def case(id, cat, title, expected, severity='Medium', kind='desktop', ctx_kw=None):
    def deco(fn): CASES.append((id, cat, title, expected, severity, kind, ctx_kw or {}, fn)); return fn
    return deco

# ============================ FUNCTIONAL ============================
@case('FUN-01','Functional','Hero search sends the query to the directory','services.html?q=income with 1+ result')
def _(pg):
    pg.goto(U('index.html')); pg.fill('#hero-q','income'); pg.click('#hero-search button')
    pg.wait_for_url(re.compile('services.html')); n = pg.locator('#results article').count()
    return n >= 1 and 'q=income' in pg.url, f'url={pg.url} results={n}'
@case('FUN-02','Functional','Quick-track with a valid demo ID opens the tracker result','Result card for JS-2026-88912')
def _(pg):
    pg.goto(U('index.html')); pg.fill('#quick-ref','JS-2026-88912'); pg.click('#quick-track button'); pg.wait_for_url(re.compile('track.html'))
    pg.wait_for_selector('#result h2'); return 'Income Certificate' in pg.inner_text('#result'), pg.inner_text('#result')[:80]
@case('FUN-03','Functional','Directory search is case-insensitive and matches department names','"REVENUE" finds 2 services')
def _(pg):
    pg.goto(U('services.html')); pg.fill('#q','REVENUE'); pg.wait_for_timeout(300); n = pg.locator('#results article').count(); return n == 2, n
@case('FUN-04','Functional','Whitespace-only search shows all services','12 results')
def _(pg):
    pg.goto(U('services.html')); pg.fill('#q','   '); pg.wait_for_timeout(300); n = pg.locator('#results article').count(); return n == 12, n
@case('FUN-05','Functional','Category and search combine (Civic + "licence")','1 result: Trade Licence')
def _(pg):
    pg.goto(U('services.html?cat=Civic')); pg.fill('#q','licence'); pg.wait_for_timeout(300); t = pg.inner_text('#results'); return pg.locator('#results article').count() == 1 and 'Trade Licence' in t, t[:60]
@case('FUN-06','Functional','Invalid ?cat= value is ignored','12 results, no crash')
def _(pg):
    pg.goto(U('services.html?cat=Hacking')); n = pg.locator('#results article').count(); return n == 12 and not pg._errs, (n, pg._errs)
@case('FUN-07','Functional','Every one of the 12 services can be applied for end to end','12 of 12 return a valid reference ID', 'High')
def _(pg):
    svcs = get_services(pg); bad = []
    for s in svcs:
        try:
            ref = apply_flow(pg, s)
            if not re.fullmatch(r'JS-\d{4}-\d{5}', ref): bad.append((s['id'], ref))
        except Exception as e: bad.append((s['id'], str(e)[:100]))
    return not bad, bad
@case('FUN-08','Functional','Pension requires age 60+ (59 rejected, 60 accepted)','Error for 59-year-old, success for 60')
def _(pg):
    from datetime import date
    svcs = {s['id']: s for s in get_services(pg)}; t = date.today()
    younger = f'{t.year-59}-01-01'; older = f'{t.year-61}-01-01'
    try: apply_flow(pg, svcs['pension'], dob=younger, submit=False); r1 = False
    except Exception as e: r1 = 'at least 60' in str(e)
    ref = apply_flow(pg, svcs['pension'], dob=older); return r1 and bool(ref), (r1, ref)
@case('FUN-09','Functional','Tracker lifecycle: simulate updates until Approved, history shows 4 entries','4 history rows, no demo button after approval')
def _(pg):
    pg.goto(U('track.html')); clear(pg); pg.goto(U('track.html?ref=JS-2026-88912'))
    pg.wait_for_selector('#simulate')
    for _ in range(2): pg.click('#simulate'); pg.wait_for_timeout(200)
    rows = pg.locator('.timeline li').count(); demo = pg.locator('#simulate').count()
    return rows == 4 and demo == 0, (rows, demo)
@case('FUN-10','Functional','Two submissions get different reference IDs and both appear in "Applications on this device"','Both new IDs listed on the tracker page')
def _(pg):
    svcs = get_services(pg); a = apply_flow(pg, svcs[0]); b = apply_flow(pg, svcs[1], wipe=False)
    pg.goto(U('track.html')); rows = pg.inner_text('#my-apps'); return a != b and a in rows and b in rows, (a, b)
@case('FUN-11','Functional','A draft for one service survives opening a different service','Birth draft still restorable after visiting Income', 'High')
def _(pg):
    pg.goto(U('apply.html?service=birth')); clear(pg); pg.goto(U('apply.html?service=birth'))
    pg.check('[data-elig="0"]'); pg.check('[data-elig="1"]'); pg.click('#btn-next'); pg.fill('#f-fullName','Ramesh Das'); pg.click('#btn-save')
    pg.goto(U('apply.html?service=income')); pg.goto(U('apply.html?service=birth'))
    ok = visible(pg, '#restore-note') and pg.locator('#f-fullName').count() and pg.input_value('#f-fullName') == 'Ramesh Das'
    return bool(ok), 'draft lost' if not ok else ''
@case('FUN-12','Functional','After reload, a restored draft never claims files are attached that the browser no longer has','Documents must be re-attached before review', 'High')
def _(pg):
    svc = get_services(pg)[0]; apply_flow(pg, svc, submit=False)    # now on step 4 with 3 files, autosaved
    pg.goto(U('apply.html')); step = pg.inner_text('#step-count')
    listed = pg.locator('#review dd').all_inner_texts() if visible(pg, '#step-4') else []
    fake = [t for t in listed if '.pdf' in t]
    return not fake, f'{step}; review lists files: {fake[:1]}'
@case('FUN-13','Functional','Double-clicking "Submit application" creates exactly one application','1 new application stored')
def _(pg):
    svc = get_services(pg)[0]; apply_flow(pg, svc, submit=False); before = len(json.loads(pg.evaluate('localStorage.getItem("js.apps")') or '[]'))
    pg.dblclick('#btn-next'); pg.wait_for_timeout(300)
    after = len(json.loads(pg.evaluate('localStorage.getItem("js.apps")') or '[]')); return after - before == 1, (before, after)
@case('FUN-14','Functional','Browser Back button inside the wizard returns to the previous step, not out of the form','Back from step 2 shows step 1 on apply.html', 'Medium')
def _(pg):
    pg.goto(U('index.html')); pg.goto(U('apply.html?service=income')); clear(pg); pg.goto(U('apply.html?service=income'))
    pg.check('[data-elig="0"]'); pg.check('[data-elig="1"]'); pg.click('#btn-next'); pg.go_back(); pg.wait_for_timeout(300)
    return 'apply.html' in pg.url and visible(pg, '#step-1'), pg.url
@case('FUN-15','Functional','Copy-ID button handles a rejected Clipboard API call gracefully','User sees a message; no unhandled promise rejection', 'Low')
def _(pg):
    pg.add_init_script("navigator.clipboard.writeText = () => Promise.reject(new DOMException('denied','NotAllowedError')); window.__ur=0; addEventListener('unhandledrejection',()=>window.__ur++);")
    svc = get_services(pg)[0]; apply_flow(pg, svc); pg.click('#copy-ref'); pg.wait_for_timeout(500)
    ur = pg.evaluate('window.__ur'); toast = pg.inner_text('#toast-region'); return ur == 0 and toast.strip() != '', (ur, toast)
@case('FUN-16','Functional','Language, theme and text size persist across pages','Same settings on the next page')
def _(pg):
    pg.goto(U('index.html')); clear(pg); pg.goto(U('index.html')); pg.select_option('#lang','hi'); pg.click('#theme-toggle'); pg.click('#text-size')
    pg.goto(U('services.html'))
    d = pg.evaluate('[document.documentElement.lang, document.documentElement.dataset.theme, document.documentElement.dataset.text]'); return d == ['hi','dark','lg'], d

# ============================ EDGE / ROBUSTNESS ============================
def bv(pg, svc_id, dob=None):  # helper: go to step 2 of a service
    pg.goto(U('apply.html?service='+svc_id)); clear(pg); pg.goto(U('apply.html?service='+svc_id))
    pg.check('[data-elig="0"]'); 
    if pg.locator('[data-elig="1"]').count(): pg.check('[data-elig="1"]')
    pg.click('#btn-next')
@case('EDG-01','Edge','Boundary values: mobile, PIN, income','Valid accepted / invalid rejected exactly at the boundaries')
def _(pg):
    pg.goto(U('apply.html')); V = 'window.JanSetuValidators'; bad = []
    tests = {'mobile': [('6000000000',1),('5999999999',0),('99999999999',0),('+91 98765 43210',1),('98765-4321',0)], 'pincode':[('100000',1),('099999',0),('1000000',0),('70001',0)], 'wholeNumber':[('0',1),('007',1),('1,2,3',1),('-5',0),('1e5',0),('',0)]}
    for fn, lst in tests.items():
        for v, exp in lst:
            got = pg.evaluate(f'{V}.{fn}({json.dumps(v)})') 
            if bool(got) != bool(exp): bad.append((fn, v, got))
    return not bad, bad
@case('EDG-02','Edge','Unrealistic dates of birth are rejected (year 1800, 0001, age over 120)','Error message shown', 'Medium')
def _(pg):
    bv(pg, 'income'); bad = []
    for dob in ['1800-01-01', '0001-01-01', '1899-12-31']:
        pg.fill('#f-fullName','Ananya Roy'); pg.fill('#f-dob', dob); pg.fill('#f-mobile','9876543210'); pg.fill('#f-address','x y'); pg.fill('#f-pincode','700016'); pg.fill('#f-annualIncome','1000'); pg.click('#btn-next')
        if visible(pg, '#step-3'): bad.append(dob); pg.click('#btn-back')
    return not bad, f'accepted: {bad}'
@case('EDG-03','Edge','Very large income numbers and 500-character text are handled without breaking layout','Either rejected or displayed without overflow', 'Low')
def _(pg):
    bv(pg, 'income'); pg.fill('#f-fullName','A'*70); pg.fill('#f-address','B'*500); pg.fill('#f-annualIncome','9'*40); pg.click('#btn-next')
    ov = pg.evaluate('document.documentElement.scrollWidth - innerWidth'); msg = pg.inner_text('#error-summary') if visible(pg,'#error-summary') else ''
    return ov <= 0 and ('income' in msg.lower() or 'whole' in msg.lower() or 'too' in msg.lower()), f'overflow={ov}; msg={msg[:120]}'
@case('EDG-04','Edge','Upload boundaries: exactly 2 MB ok; 2 MB + 1 byte, empty, .exe, double extension, no extension rejected; UPPERCASE .PDF ok','Correct accept / reject for each')
def _(pg):
    svc = get_services(pg)[0]; bad = []
    apply_flow(pg, svc, submit=False); pg.click('#btn-back'); 
    def tryfile(name, expect):
        pg.set_input_files('#doc-0', str(TMP/name)); err = pg.inner_text('#doc-0-err').strip()
        ok = (err == '') if expect else (err != '')
        if not ok: bad.append((name, expect, err))
        if expect: pg.click('#docs [data-remove]') if pg.locator('#docs [data-remove]').count() else None
    for n, e in [('exact2mb.pdf',1),('over2mb.pdf',0),('empty.pdf',0),('double.pdf.exe',0),('noext',0),('UPPER.PDF',1)]: tryfile(n, e)
    return not bad, bad
@case('EDG-05','Edge','Cross-site scripting: script/HTML in URL parameters and file names is never executed','No dialog, no injected elements')
def _(pg):
    pg.add_init_script('window.__xss=0'); dialogs = []; pg.on('dialog', lambda d: (dialogs.append(d.message), d.dismiss()))
    payload = '"><img src=x onerror=window.__xss=1><script>window.__xss=1</script>'
    for path in [f'services.html?q={payload}&cat={payload}', f'track.html?ref={payload}', f'apply.html?service={payload}', f'index.html?x={payload}']:
        pg.goto(U(path)); pg.wait_for_timeout(200)
    svc = get_services(pg)[0]; apply_flow(pg, svc, files=TMP/'<img src=x onerror=window.__xss=1>.pdf', submit=False)
    x = pg.evaluate('window.__xss'); injected = pg.locator('#review img, #results img, #result img').count()
    return x == 0 and not dialogs and injected == 0, (x, dialogs, injected)
@case('EDG-06','Edge','Corrupted localStorage (wrong JSON shape) does not break the tracker or submission','Pages work; no JavaScript errors', 'High')
def _(pg):
    bad = []
    for key, val in [('js.apps','{"a":1}'),('js.apps','"text"'),('js.apps','not json at all'),('js.draft','[1,2,3]'),('js.seeded','"x"')]:
        pg.goto(U('track.html')); pg.evaluate('localStorage.clear()'); pg.evaluate(f'localStorage.setItem({json.dumps(key)}, {json.dumps(val)})'); pg._errs.clear()
        pg.goto(U('track.html')); pg.wait_for_timeout(200); e1 = list(pg._errs)
        pg.goto(U('apply.html')); pg.wait_for_timeout(200); e2 = list(pg._errs)
        if e1 or e2: bad.append((key, val[:12], (e1 + e2)[0][:90]))
    return not bad, bad
@case('EDG-07','Edge','Storage blocked by the browser: pages still load, and the user is told applications cannot be saved','No JS errors; warning visible on Apply', 'Medium')
def _(pg):
    pg.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError')}})")
    errs = []
    for p in PAGES: pg.goto(U(p)); pg.wait_for_timeout(150)
    pg.goto(U('apply.html')); warn = pg.locator('#storage-warning').count() and pg.locator('#storage-warning').first.is_visible()
    return not pg._errs and bool(warn), (pg._errs[:1], 'warning shown' if warn else 'no warning about storage')
@case('EDG-08','Edge','With JavaScript disabled, dynamic pages tell the user what to do','Visible fallback message on Services, Apply and Track', 'Medium', ctx_kw={'java_script_enabled': False})
def _(pg):
    bad = []
    for p in ['services.html','apply.html','track.html']:
        pg.goto(U(p)); txt = pg.inner_text('main').lower()
        if 'javascript' not in txt: bad.append(p)
    pg.goto(U('index.html')); ok_home = visible(pg, 'h1') and visible(pg, '.nav__list')
    return not bad and ok_home, f'no fallback on {bad}'
@case('EDG-09','Edge','Resizing from mobile to desktop and back closes the hamburger menu state','Menu closed and aria-expanded=false after resize', 'Low', kind='mobile')
def _(pg):
    pg.goto(U('index.html')); pg.tap('.nav-toggle'); pg.set_viewport_size({'width':1366,'height':768}); pg.wait_for_timeout(200)
    pg.set_viewport_size({'width':390,'height':844}); pg.wait_for_timeout(200)
    st = pg.get_attribute('.nav-toggle','aria-expanded'); openp = visible(pg,'#primary-nav'); return st == 'false' and not openp, (st, openp)
@case('EDG-10','Edge','Background page does not scroll while a modal is open','scrollY unchanged after wheel over the backdrop', 'Low')
def _(pg):
    pg.set_viewport_size({'width':1366,'height':420}); pg.goto(U('services.html')); pg.click('[data-open="income"]'); y0 = pg.evaluate('scrollY')
    pg.mouse.move(20, 300); pg.mouse.wheel(0, 700); pg.wait_for_timeout(300); y1 = pg.evaluate('scrollY'); return y1 == y0, (y0, y1)
@case('EDG-11','Edge','Focus stays trapped inside the open modal','15 Tab presses never leave the dialog')
def _(pg):
    pg.goto(U('services.html')); pg.click('[data-open="income"]'); out = 0
    for _ in range(15): pg.keyboard.press('Tab'); out += 0 if pg.evaluate('!!document.activeElement.closest("dialog")') else 1
    return out == 0, out
@case('EDG-12','Edge','Error-summary links scroll the field into view below the sticky header','Focused field top >= header bottom', 'Medium')
def _(pg):
    pg.set_viewport_size({'width':1366,'height':500}); bv(pg, 'income'); pg.click('#btn-next'); pg.click('#error-summary a >> nth=2'); pg.wait_for_timeout(300)
    top = pg.evaluate('(() => { const el = document.querySelector(":target") || document.activeElement; return el.getBoundingClientRect().top })()'); hb = pg.evaluate('document.querySelector(".site-header").getBoundingClientRect().bottom')
    return top >= hb - 1, f'field top={top:.0f}px, header bottom={hb:.0f}px'
@case('EDG-13','Edge','Dropdown keyboard support: ArrowDown/ArrowUp wrap, Escape returns focus','Focus moves as documented')
def _(pg):
    pg.goto(U('index.html')); pg.focus('.has-sub > button'); pg.keyboard.press('ArrowDown'); first = pg.evaluate('document.activeElement.textContent')
    pg.keyboard.press('ArrowUp'); last = pg.evaluate('document.activeElement.textContent'); pg.keyboard.press('Escape'); back = pg.evaluate('document.activeElement.getAttribute("aria-controls")')
    return first == 'All services' and last == 'Grievances' and back == 'sub-services', (first, last, back)
@case('EDG-14','Edge','Stepper on phones exposes every step name to assistive technology','Non-current step labels not removed from the accessibility tree', 'Medium', kind='mobile')
def _(pg):
    pg.goto(U('apply.html')); hidden = pg.evaluate('Array.from(document.querySelectorAll(".stepper__label")).filter(l => getComputedStyle(l).display === "none" || getComputedStyle(l).visibility === "hidden").length')
    return hidden == 0, f'{hidden} of 5 step names are display:none (invisible to screen readers)'
@case('EDG-15','Edge','Text-size button accessible name contains its visible label (WCAG 2.5.3)','aria-label includes visible text "A"', 'Low')
def _(pg):
    pg.goto(U('index.html')); vis = pg.inner_text('#text-size').strip(); name = pg.get_attribute('#text-size','aria-label') or ''
    return vis.lower() in name.lower(), f'visible "{vis}" vs accessible name "{name}"'
@case('EDG-16','Edge','Restoring the previous state: quick actions do not lose the search term on Back from a service modal link','Search term preserved via URL', 'Low')
def _(pg):
    pg.goto(U('services.html')); pg.fill('#q','tax'); pg.wait_for_timeout(300); pg.reload(); return pg.input_value('#q') == 'tax', pg.input_value('#q')

# ============================ ACCESSIBILITY (axe-core 4.x, WCAG 2.2 AA + best practice) ============================
def axe_case(id, title, setup, kind='desktop'):
    def fn(pg):
        setup(pg); v = run_axe(pg); return not v, v
    case(id, 'Accessibility', title, 'Zero axe-core violations', 'Medium', kind)(fn)
def _theme(pg, t): pg.evaluate(f'document.documentElement.dataset.theme = "{t}"')
for i, p in enumerate(PAGES, 1):
    axe_case(f'ACC-0{i}', f'axe: {p} (light, desktop)', lambda pg, p=p: pg.goto(U(p)))
    axe_case(f'ACC-0{i+4}', f'axe: {p} (dark, desktop)', lambda pg, p=p: (pg.goto(U(p)), _theme(pg, 'dark')))
axe_case('ACC-09', 'axe: apply step 2 with validation errors (mobile)', lambda pg: (bv(pg,'income'), pg.click('#btn-next')), 'mobile')
def _open_modal(pg): pg.goto(U('services.html')); pg.click('[data-open="income"]'); pg.wait_for_timeout(300)
axe_case('ACC-10', 'axe: modal open', _open_modal)
def _open_dd(pg): pg.goto(U('index.html')); pg.click('.has-sub > button'); pg.wait_for_timeout(300)
axe_case('ACC-11', 'axe: dropdown open', _open_dd)
def _track_res(pg): pg.goto(U('track.html?ref=JS-2026-88912')); pg.wait_for_timeout(1200)
axe_case('ACC-12', 'axe: tracker with result (dark)', lambda pg: (_track_res(pg), _theme(pg,'dark')))

@case('ACC-13','Accessibility','Interactive controls are at least 24x24 px (WCAG 2.2 target size, minimum) on phones','No violations', 'Medium', kind='mobile')
def _(pg):
    bad = []
    for p in PAGES:
        pg.goto(U(p)); pg.evaluate('document.querySelector("#toast-region") && (document.querySelector("#toast-region").innerHTML="")')
        r = pg.evaluate('''() => Array.from(document.querySelectorAll('a,button,select,input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea')).filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width>0 && r.height>0 && cs.visibility!=='hidden' && !e.closest('[hidden]') && !e.classList.contains('skip-link') && !(e.tagName==='A' && e.closest('p,li,dd,footer,td')) && (r.width<24||r.height<24) }).map(e => (e.id||e.className||e.tagName)+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height))''')
        bad += [(p, x) for x in r]
    return not bad, bad[:6]
@case('ACC-14','Accessibility','Design-system claim: buttons, chips and menu items are at least 44 px tall on phones','No control shorter than 44 px', 'Low', kind='mobile')
def _(pg):
    bad = []
    for p in ['index.html','services.html','apply.html','track.html']:
        pg.goto(U(p))
        if p == 'apply.html': pg.select_option('#service','income'); pg.check('[data-elig="0"]'); pg.check('[data-elig="1"]'); pg.click('#btn-next'); pg.click('#btn-next')
        r = pg.evaluate('''() => Array.from(document.querySelectorAll('button,.btn,select,input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]),textarea')).filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width>0 && r.height>0 && !e.closest('[hidden]') && !e.classList.contains('skip-link') && !e.closest('.nav') && r.height<43.5 }).map(e => (e.id||e.className||e.tagName)+':'+Math.round(e.getBoundingClientRect().height)+'px')''')
        bad += [(p, x) for x in r]
    return not bad, bad[:8]
@case('ACC-15','Accessibility','Every focusable element shows a visible focus indicator (first 30 Tab stops on 4 pages)','0 elements without focus ring')
def _(pg):
    bad = []
    for p in PAGES:
        pg.goto(U(p))
        for _ in range(30):
            pg.keyboard.press('Tab')
            r = pg.evaluate('''() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const ok = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || cs.boxShadow !== 'none'; return ok ? '' : (e.id || e.tagName + '.' + e.className) }''')
            if r: bad.append((p, r))
    return not bad, bad[:5]
@case('ACC-16','Accessibility','Reflow: at 320 px with 135% text size, no page needs horizontal scrolling (WCAG 1.4.10)','No horizontal scroll', 'Medium', kind='mobile')
def _(pg):
    bad = []; pg.set_viewport_size({'width':320,'height':640})
    for p in PAGES:
        pg.goto(U(p)); pg.evaluate('document.documentElement.dataset.text="xl"'); pg.wait_for_timeout(100)
        ov = pg.evaluate('document.documentElement.scrollWidth - innerWidth')
        if ov > 0: bad.append((p, ov))
    return not bad, bad
@case('ACC-17','Accessibility','Respects prefers-reduced-motion (no animation/transition running)','animation-duration 0 on the dropdown and tracker', 'Low')
def _(pg):
    pg.emulate_media(reduced_motion='reduce'); pg.goto(U('index.html')); pg.click('.has-sub > button')
    d = pg.evaluate('getComputedStyle(document.getElementById("sub-services")).animationName'); return d == 'none', d

# ============================ RESPONSIVE ============================
WIDTHS = [320, 360, 375, 390, 412, 600, 768, 820, 1024, 1280, 1366, 1440, 1920]
@case('RES-01','Responsiveness','No horizontal scrolling at 13 viewport widths (320-1920 px) on 4 pages plus key states','0 overflow cases', 'High')
def _(pg):
    bad = []
    for w in WIDTHS:
        pg.set_viewport_size({'width':w,'height':800})
        for p in PAGES:
            pg.goto(U(p)); ov = pg.evaluate('document.documentElement.scrollWidth - innerWidth')
            if ov > 0: bad.append((w, p, ov))
        pg.goto(U('track.html?ref=JS-2026-88912')); pg.wait_for_timeout(200)
        if pg.evaluate('document.documentElement.scrollWidth - innerWidth') > 0: bad.append((w, 'track result'))
        bv(pg, 'trade')
        if pg.evaluate('document.documentElement.scrollWidth - innerWidth') > 0: bad.append((w, 'apply step 2 (trade)'))
    return not bad, bad[:8]
@case('RES-02','Responsiveness','Navigation switches between hamburger (below 900 px) and inline menu (900 px and above) at the breakpoint','Correct at 899 and 900 px')
def _(pg):
    out = {}
    for w in (899, 900):
        pg.set_viewport_size({'width':w,'height':800}); pg.goto(U('index.html')); out[w] = visible(pg, '.nav-toggle')
    return out == {899: True, 900: False}, out
@case('RES-03','Responsiveness','Device emulation smoke test: 6 phones and tablets render, navigate and open the form','All 6 pass', 'High')
def _(pg):
    return True, 'run in RES-03 block below'
@case('RES-04','Responsiveness','Landscape phone (844 x 390): sticky header uses less than 20% of the viewport height','Header <= 78 px', 'Low')
def _(pg):
    pg.set_viewport_size({'width':844,'height':390}); pg.goto(U('index.html')); h = pg.evaluate('document.querySelector(".site-header").getBoundingClientRect().height'); return h <= 78, f'{h:.0f}px of 390px'

def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        for (id, cat, title, expected, severity, kind, ckw, fn) in CASES:
            if id == 'RES-03': continue
            ctx = make_ctx(b, kind, **ckw); pg = new_page(ctx)
            try:
                res = fn(pg); ok, actual = res if isinstance(res, tuple) else (bool(res), '')
                if isinstance(actual, list) and actual and isinstance(actual[0], dict): actual = json.dumps(actual)[:600]
                record(id, cat, title, expected, 'PASS' if ok else 'FAIL', actual, '' if ok else severity)
            except Exception as e:
                record(id, cat, title, expected, 'FAIL', 'test error: ' + str(e).split('\n')[0][:200], severity)
            ctx.close()
        # RES-03 device emulation (Chromium engine with device metrics / user agents)
        bad = []
        for name in ['iPhone SE','iPhone 13','Pixel 7','Galaxy S9+','iPad Mini','iPad Pro 11']:
            d = p.devices[name]; ctx = b.new_context(**d); pg = new_page(ctx)
            try:
                pg.goto(U('index.html')); w = pg.evaluate('innerWidth')
                nav_ok = visible(pg, '.nav-toggle') or visible(pg, '.nav__list')
                ov = pg.evaluate('document.documentElement.scrollWidth - innerWidth'); bv(pg, 'income'); step2 = visible(pg, '#step-2')
                if not (nav_ok and ov <= 0 and step2 and not pg._errs): bad.append((name, nav_ok, ov, step2, pg._errs[:1]))
            except Exception as e: bad.append((name, str(e)[:80]))
            ctx.close()
        record('RES-03','Responsiveness','Device emulation smoke test: 6 phones and tablets render, navigate and open the form','All 6 pass','PASS' if not bad else 'FAIL', bad, '' if not bad else 'High')
        b.close()
    passed = sum(r['status']=='PASS' for r in RESULTS); print(f'\n{LABEL}: {passed}/{len(RESULTS)} passed')
    Path(f'/home/claude/w4/out/{LABEL}_results.json').write_text(json.dumps(RESULTS, indent=1))
main()
