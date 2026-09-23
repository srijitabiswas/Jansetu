# JanSetu Front End — v1.1 (Week 4 fixes)

Fixes applied after the Week 4 testing and debugging phase, on top of the Week 3 (v1.0) build.
See JanSetu_Week4_Testing_Evaluation_Report.docx for full detail, evidence and verification.

1. Draft lost when opening a different service before saving (js/apply.js)
2. Restored draft could show documents as attached when the actual files were gone (js/apply.js)
3. No upper bound on date of birth — 1800 accepted as valid (js/apply.js)
4. No sanity limit on annual income length (js/apply.js)
5. Clipboard-copy failure was not handled, leaving the user with no feedback (js/apply.js)
6. Corrupted localStorage values could crash the tracker and application list (js/utils.js, js/track.js, js/apply.js)
7. No warning when the browser blocks storage entirely (js/apply.js, apply.html)
8. No fallback message when JavaScript is disabled (services.html, apply.html, track.html)
9. Mobile menu could reopen "already open" after a viewport resize (js/layout.js)
10. Background page scrolled behind an open modal; focus could leave the modal (js/services.js)
11. Heading level skipped (h1 → h3) on the service directory (services.html)
12. Tracker's progress bar/fill broke <ol> list semantics for assistive tech (js/track.js, css/components.css)
13. Category filter chips were 4px under the 44px touch-target minimum (css/components.css)
14. Stepper step labels were removed from the accessibility tree on phones, not just hidden visually (css/components.css)
15. Error-summary links could scroll a field to sit underneath the sticky header (css/base.css)
16. Browser Back button left the application wizard instead of moving between steps (js/apply.js)
17. (Fixed during work on #16, before release) a popstate handler mis-fired on in-page anchor clicks
18. Defensive: reserved space for the async-rendered service grid to avoid any layout jump

Verified with: 53/53 automated Playwright checks (qa_suite.py), 9/9 unit tests, 0 ESLint errors,
0 html-validate errors, axe-core clean on every audited page/state.
