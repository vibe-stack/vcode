#!/bin/bash

# Simple release script for vcode-ide
# Usage: ./release.sh [patch|minor|major]

set -e

# Default to patch if no argument provided
BUMP_TYPE=${1:-patch}

echo "🚀 Creating a $BUMP_TYPE release..."

# Check if git is clean
if [[ -n $(git status --porcelain) ]]; then
    echo "❌ Git working directory is not clean. Please commit or stash changes first."
    exit 1
fi

# Make sure we're on main
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo "❌ Please switch to the main branch first."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Bump version using npm
echo "📦 Bumping version..."
npm version $BUMP_TYPE --no-git-tag-version

# Get the new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "📈 New version: $NEW_VERSION"

# Commit the version bump
echo "💾 Committing version bump..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"

# Create and push tag
echo "🏷️  Creating tag v$NEW_VERSION..."
git tag "v$NEW_VERSION"

echo "🚀 Pushing changes and tag..."
git push origin main
git push origin "v$NEW_VERSION"

echo "✅ Release v$NEW_VERSION created!"
echo "🔗 Check the GitHub Actions tab for build progress:"
echo "   https://github.com/vibe-stack/vcode/actions"
echo ""
echo "📦 The release will be available at:"
echo "   https://github.com/vibe-stack/vcode/releases/tag/v$NEW_VERSION"
