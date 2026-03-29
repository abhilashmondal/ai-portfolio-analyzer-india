#!/bin/bash
# GitHub push helper — run this from the Replit Shell

echo ""
echo "=== GitHub Push Helper ==="
echo ""
echo "Paste your GitHub Personal Access Token below."
echo "(Create one at: https://github.com/settings/tokens — tick the 'repo' box)"
echo ""
read -rsp "Token: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
  echo "ERROR: No token entered. Exiting."
  exit 1
fi

REPO_URL="https://${TOKEN}@github.com/abhilashmondal/ai-portfolio-analyzer-india.git"

echo "Configuring remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "Done! Check your repo at:"
echo "https://github.com/abhilashmondal/ai-portfolio-analyzer-india"
