#!/bin/bash
# GitHub push helper — run this from the Replit Shell

echo ""
echo "=== GitHub Push Helper ==="
echo ""
echo "Paste your GitHub Personal Access Token and press Enter:"
echo "(Create one at: https://github.com/settings/tokens — tick the 'repo' box)"
echo ""

read -r TOKEN

# Strip ALL whitespace, newlines, carriage returns
TOKEN="$(echo -n "$TOKEN" | tr -d '[:space:]\r\n')"

if [ -z "$TOKEN" ]; then
  echo "ERROR: No token entered. Exiting."
  exit 1
fi

echo "Token received (length: ${#TOKEN} chars). Configuring..."

# Set up credentials via git credential store (avoids URL encoding issues)
git config --global credential.helper "store --file /tmp/.git-credentials"
echo "https://${TOKEN}:x-oauth-basic@github.com" > /tmp/.git-credentials
chmod 600 /tmp/.git-credentials

# Set the remote using a plain URL (no token in URL)
echo "Setting up remote..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/abhilashmondal/ai-portfolio-analyzer-india.git

echo "Pushing to GitHub..."
git push -u origin main

# Clean up credentials from disk
rm -f /tmp/.git-credentials

echo ""
echo "Done! View your repo at:"
echo "https://github.com/abhilashmondal/ai-portfolio-analyzer-india"
