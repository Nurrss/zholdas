#!/bin/sh
# Builds the app for GitHub Pages and pushes it to the gh-pages branch.
# Usage: npm run deploy
set -e
REPO_URL=$(git remote get-url origin)
REPO_NAME=$(basename -s .git "$REPO_URL")

BASE_PATH="/$REPO_NAME/" npm run build
touch dist/.nojekyll

cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git push -f -q "$REPO_URL" gh-pages
rm -rf .git
echo "Deployed: https://$(git -C .. remote get-url origin | sed -E 's#.*github.com[:/]([^/]+)/.*#\1#' | tr 'A-Z' 'a-z').github.io/$REPO_NAME/"
