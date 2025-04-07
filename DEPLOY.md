# 🚀 GitHub Deployment Guide: Federation Gallery (Claude Project)

This guide walks you through resetting your GitHub repository and connecting it to your existing Claude project files.

---

## ✅ Assumptions

- Your Claude project already exists locally with folders, source data, and code.
- You previously created a GitHub repo here:  
  🔗 https://github.com/eredics/curated_collection (this will be deleted)
- You will recreate the repo with the same name: `curated_collection`
- Your **local project will live here**:  
  📂 `/Users/pete5553/Documents/Projects/curated_collection`

---

## 🧹 Step 1: Delete the Existing GitHub Repo

1. Go to: https://github.com/eredics/curated_collection
2. Click **Settings**
3. Scroll to the **Danger Zone**
4. Click **Delete this repository**
5. Type `eredics/curated_collection` to confirm

---

## 🆕 Step 2: Create the New GitHub Repo

1. Go to: https://github.com/new
2. Name the repository: `curated_collection`
3. Leave it **empty**: ❌ No README, license, or .gitignore
4. Choose visibility: Public or Private
5. Click **Create repository**

---

## 📦 Step 3: Prepare Your Local Folder

1. Move your Claude build into the working project directory:

```bash
mkdir -p /Users/pete5553/Documents/Projects
mv ~/Downloads/curated_collection /Users/pete5553/Documents/Projects/
cd /Users/pete5553/Documents/Projects/curated_collection
```

2. Initialize Git and set the remote:

```bash
git init
git remote add origin https://github.com/eredics/curated_collection.git
```

---

## ✅ Step 4: Add, Commit, and Push to GitHub

```bash
git add .
git commit -m "Initial Claude modular build"
git branch -M main
git push -u origin main
```

---

## 🧠 Tip: Avoid Uploading 10,000+ Images

To avoid bloating the repo:
1. Add this to `.gitignore`:

```
images_scraped/
```

2. Then commit and push without that folder.

---

## 🎉 Done!

Your Claude project is now:
- Backed up on GitHub
- Located in a logical local folder
- Ready for Copilot and Claude modular development