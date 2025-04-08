# 🚀 Final Deployment Guide: Federation Gallery (Claude Project)

This guide walks you through setting up your Claude project in GitHub, cleaning out any large or unwanted files, and keeping your repo lightweight and ready for production.

---

## ✅ Context

- Project lives here locally: `/Users/pete5553/Documents/curated_collection`
- Remote GitHub repo: https://github.com/eredics/curated_collection
- The goal: Remove large files (e.g. `Archive.zip`), exclude image folders, and ensure GitHub accepts your clean repo

---

## 🧹 Step 1: Clean GitHub and Start Fresh

### Delete the old GitHub repo (if needed)

1. Visit: https://github.com/eredics/curated_collection
2. Go to **Settings → Danger Zone**
3. Click **Delete this repository**
4. Confirm deletion

---

## 🆕 Step 2: Create a New GitHub Repo

1. Visit: https://github.com/new
2. Name: `curated_collection`
3. Leave it **empty**: ❌ no README, license, or .gitignore
4. Click **Create repository**

---

## 💻 Step 3: Initialize Git Locally and Add Remote

```bash
cd ~/Documents/curated_collection
git init
git remote add origin https://github.com/eredics/curated_collection.git
```

---

## 📄 Step 4: Configure `.gitignore` to Exclude Large Files

```bash
echo "images_scraped/" >> .gitignore
echo "Archive.zip" >> .gitignore
echo "*.zip" >> .gitignore
echo ".DS_Store" >> .gitignore
```

Then untrack files already in Git:

```bash
git rm -r --cached images_scraped/
git rm --cached Archive.zip
```

---

## ✅ Step 5: Commit and Force Push

```bash
git add .
git commit -m "Clean project: exclude images and archive"
git branch -M main
git push origin main --force
```

---

## 🧼 Step 6: Clean Git History (if needed)

If GitHub **still rejects your push** because of a file that was *previously* committed:

```bash
git filter-branch --force --index-filter   "git rm --cached --ignore-unmatch Archive.zip"   --prune-empty --tag-name-filter cat -- --all
```

Then clean and optimize the repo:

```bash
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

Then push again:

```bash
git push origin main --force
```

---

## 🧪 Step 7: Confirm It's Working

```bash
git status
```

You should **not** see `images_scraped/` or `.zip` files in the list of tracked files.

---

## 🎉 Done!

You now have a:

- Clean repo without bloated files
- Synced local + GitHub repo
- Claude/Copilot-ready project structure
- .gitignore that prevents future size issues

You’re ready to build, test, and push safely from here on out.