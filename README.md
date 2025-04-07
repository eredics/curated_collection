# 🖼️ Federation Gallery

An AI-curated, modular virtual gallery built with Claude Sonnet (via GitHub Copilot Chat) using a step-by-step prompt system.

Designed to be fully offline, accessible, and responsive, this gallery loads artwork from a local CSV and displays it using a grid-based layout.

---

## 📁 Folder Structure

```
curated_collection/
├── css/
│   └── styles.css
├── data/
│   └── filtered.csv
│   └── artworks.csv
├── images_scraped/
├── js/
│   ├── constants.js
│   ├── dataController.js
│   ├── dataModel.js
│   ├── failsafe.js
│   ├── main.js
│   ├── uiController.js
│   └── utils.js
├── scripts/
│   └── setup.sh
├── .vscode/
│   └── settings.json
├── index.html
└── README.md

```

---

## 🚀 Live Preview (Local)

You can run this locally with Python:

```bash
cd curated_collection
python3 -m http.server 8000
```

Then visit: [http://localhost:8000](http://localhost:8000)

Or use VS Code's "Live Server" extension.

---

## 🌱 Initialize GitHub Repo

```bash
cd curated_collection
git init
git remote add origin <your-repo-url>
git add .
git commit -m "Initial build from modular prompts"
git push -u origin main
```

---

## 📦 Prompt Module System

This project is built from 5 Claude prompt stacks, each broken into modular instructions:

| Prompt | Scope                              | Modules                    |
|--------|-------------------------------------|----------------------------|
| 1      | Core structure + gallery rendering | Layout, splash, images     |
| 2      | CSV loading + basic filtering      | Data pipeline, filter UI   |
| 3      | Advanced filtering + search        | AND filters, live search   |
| 4      | UI design + animation              | Typography, transitions    |
| 5      | Frame visualization + export       | Modal preview, download    |

Use Claude Sonnet + GitHub Copilot Chat to implement each module.

---

## 🤖 Working With Claude Sonnet (Copilot Chat)

Paste one module at a time and say:

> “Claude, please implement this module. Generate HTML, CSS, and JS. Include inline comments.”

Ask follow-ups like:
- “Use mobile-first styles”
- “Make the modal keyboard accessible”
- “Refactor this to use canvas layers”

---

This file will grow as the project evolves.