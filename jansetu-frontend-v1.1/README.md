# JanSetu - Front-End Prototype (Week 3)

Responsive, accessible front end for the JanSetu e-governance portal, built with
plain HTML, CSS and JavaScript (no framework, no build step).

## Run it

Option 1 - just open `index.html` in a browser (works from disk).

Option 2 - a local server (recommended):

    cd jansetu-frontend
    python -m http.server 8000        # then open http://localhost:8000
    # or:  npx serve .

## Pages

| Page | What it demonstrates |
|------|----------------------|
| `index.html`    | Responsive nav + dropdown, hero search, animated counters, FAQ accordion, quick track |
| `services.html` | Live search, category filter, sort, modal pop-up with service details |
| `apply.html`    | Dynamic multi-step form: validation, autosave draft, file checks, reference ID |
| `track.html`    | Animated status tracker, timeline, "simulate officer update" demo |

Header tools on every page: language (EN / HI / BN), text size (A, A+, A++), dark mode.

## Project structure

    jansetu-frontend/
    |- index.html  services.html  apply.html  track.html
    |- css/   tokens.css (design tokens)  base.css (reset, a11y)  components.css
    |- js/    utils.js  validators.js  data.js  i18n.js  layout.js
    |           accordion.js  home.js  services.js  apply.js  track.js
    |- tests/ validators.test.js (Node unit tests)  e2e_chromium.py (Playwright)
    |- package.json

## Tests

    node --test tests/validators.test.js        # unit tests, Node 18+, no packages

    pip install playwright && playwright install chromium
    python tests/e2e_chromium.py                # end-to-end tests, desktop + mobile

## Deploy to GitHub Pages

    git init && git add . && git commit -m "JanSetu front end"
    git branch -M main
    git remote add origin https://github.com/<your-username>/jansetu-frontend.git
    git push -u origin main
    # GitHub > Settings > Pages > Deploy from branch > main / (root)

## Notes

- Data is stored only in the browser (localStorage). There is no server.
- Hindi and Bengali strings are samples and need review by native speakers.
- Sample names, IDs and the helpline number are fictional.
