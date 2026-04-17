#!/bin/bash
# ==============================================================================
# GitHub Safety Launch Script
#
# PURPOSE: This script ensures that when you upload to GitHub for the first time,
# you start with a "blank slate" history. This is the only way to be 100% sure
# that old secrets (committed before the strict .gitignore existed) don't leak.
# ==============================================================================

# 1. Ask for confirmation
echo "⚠️ WARNING: This will DELETE your LOCAL git history and start fresh."
echo "This is recommended for maximum security before pushing to GitHub."
read -p "Are you sure you want to proceed? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Aborted."
    exit 1
fi

# 2. Delete the current .git folder (if it exists)
if [ -d ".git" ]; then
    echo "Removing existing .git directory..."
    rm -rf .git
else
    echo "No existing .git directory found. Starting fresh."
fi

# 3. Initialize fresh repository
echo "Initializing new git repository..."
git init

# 4. Add files (following strict .gitignore rules)
echo "Staging files (obeying .gitignore)..."
git add .

# 5. Show what is staged (to let user verify)
echo "=============================================================================="
echo "STAGED FILES (The files below WILL be in your first commit):"
git status --short
echo "=============================================================================="

echo "🚀 COMPLETED. To finalize, run:"
echo 'git commit -m "Initialize project with strict security settings"'
echo "git remote add origin YOUR_GITHUB_REPO_URL"
echo "git branch -M main"
echo "git push -u origin main"
