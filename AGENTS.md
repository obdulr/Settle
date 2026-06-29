<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# macOS Metadata Files Prevention

This project has multiple layers of protection against macOS metadata files (._*):

1. **Git hooks**: Pre-commit hook blocks ._ files from being committed
2. **Auto-cleanup**: Post-merge and post-checkout hooks automatically clean ._ files
3. **Git ignores**: All .gitignore files exclude ._ patterns
4. **Cleanup command**: Run `npm run clean:mac-files` to manually clean
5. **macOS config**: Run `./scripts/configure-macos.sh` to reduce ._ file creation

If you encounter ._ files, run the cleanup command. The git hooks will prevent them from being committed.
