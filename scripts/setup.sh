#!/bin/bash

# Install local HTTP server (Python fallback)
echo "Setting up local dev environment..."

if command -v python3 &>/dev/null; then
  echo "Python3 found. You can run: python3 -m http.server 8000"
else
  echo "Python3 not found. Consider installing it to run a local server."
fi

# Basic git init help
echo ""
echo "To initialize GitHub for this project, run:"
echo "cd curated_collection"
echo "git init"
echo "git remote add origin <your-repo-url>"
echo "git add ."
echo 'git commit -m "Initial build from modular prompts"'
echo "git push -u origin main"