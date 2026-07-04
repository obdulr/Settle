#!/bin/bash

# Install git hooks for the monorepo
echo "Installing git hooks..."

# Copy hooks to .git/hooks directory
cp scripts/git-hooks/pre-commit .git/hooks/pre-commit
cp scripts/git-hooks/post-merge .git/hooks/post-merge
cp scripts/git-hooks/post-checkout .git/hooks/post-checkout
cp scripts/git-hooks/post-commit .git/hooks/post-commit
cp scripts/git-hooks/pre-push .git/hooks/pre-push

# Make them executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/post-merge
chmod +x .git/hooks/post-checkout
chmod +x .git/hooks/post-commit
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed successfully."
