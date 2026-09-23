# JanSetu

**Unified E-Governance and Digital Services Portal**
*Connecting Citizens to Government Services*

JanSetu is a concept e-governance web portal that lets citizens discover government services, submit applications, track their status in real time, manage documents, and file grievances — all from one platform. Built as a 4-week Frontend Development Internship project, covering planning, UI/UX design, implementation, and QA.

---

## 📁 Repository Structure

| File / Folder | Description |
|---|---|
| `JanSetu_Requirements_Specification.docx` | **Week 1** — Strategic planning, requirements, system architecture, user roles, and workflow diagrams |
| `JanSetu_Week2_UIUX_Design_Document.docx` | **Week 2** — UI/UX design document with 11 high-fidelity wireframes, design system, and annotations |
| `jansetu-frontend/` | **Week 3** — Front-end source code (HTML, CSS, JavaScript) implementing the designed interface |
| `JanSetu_Week3_Frontend_Implementation_Report.docx` | **Week 3** — Implementation report with code snippets, screenshots, and coding decisions |
| `jansetu-frontend-v1.1/` | **Week 4** — Updated front-end source after testing and bug fixes |
| `JanSetu_Week4_Testing_Evaluation_Report.docx` | **Week 4** — Test plan, bug log, debugging record, and final evaluation |
| `JanSetu_Interactive_Prototype.html` | Standalone clickable prototype (design-stage demo) |

---

## ✨ Key Features

- 🔍 **Service discovery** — search and browse government services by category
- 📝 **Multi-step application wizard** — dynamic forms with validation, autosaved drafts, and document uploads
- 📊 **Application tracker** — real-time status tracking with a reference ID, no login required
- 📁 **Document handling** — reusable document uploads (PDF/JPG/PNG)
- 📢 **Grievance filing** — report civic issues and track resolution
- 🌐 **Accessible & responsive** — WCAG 2.1 AA–aligned, mobile-first, dark mode, and multilingual UI (English, Hindi, Bengali)

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (no framework/build step)
- **Testing:** Node.js test runner, Playwright, axe-core, ESLint, html-validate, Stylelint, Lighthouse
- **Design:** Figma-style design system (documented in Week 2 report)

---

## 🚀 Running the Frontend Locally

```bash
# Clone the repo
git clone https://github.com/srijitabiswas/jansetu.git
cd jansetu/jansetu-frontend-v1.1

# Option 1: just open it
open index.html

# Option 2: serve it (recommended)
python -m http.server 8000
# then visit http://localhost:8000
```

### Running tests

```bash
node --test tests/validators.test.js        # unit tests

pip install playwright && playwright install chromium
python tests/qa_suite.py http://localhost:8000 my-run   # end-to-end test suite
```

---

## 📅 Project Timeline

| Week | Phase | Deliverable |
|---|---|---|
| 1 | Strategic Planning & Requirements | Requirements specification, architecture diagrams |
| 2 | UI/UX Design | Wireframes, design system, interactive prototype |
| 3 | Front-End Implementation | Working responsive site (HTML/CSS/JS) |
| 4 | Testing & Evaluation | Bug fixes, QA report, performance audit |

---

## 👤 Author

**Srijita Biswas**
[GitHub](https://github.com/srijitabiswas) · [LinkedIn](https://linkedin.com/in/srijita-biswas-9690a3284)

---

## 📄 License

This project was built as an academic/internship deliverable and is not licensed for production use.
