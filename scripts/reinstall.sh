#!/usr/bin/env bash
# Compile, package, and force-install zen-todo into the local `code` CLI.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v code >/dev/null 2>&1; then
  echo "error: 'code' CLI not found. Install it from VS Code: Command Palette → Shell Command: Install 'code' command in PATH." >&2
  exit 1
fi

if [[ ! -x node_modules/.bin/vsce ]]; then
  echo "error: @vscode/vsce is not installed. Run npm install first." >&2
  exit 1
fi

vsix="$PWD/zen-todo.vsix"

# vscode:prepublish runs compile. Flags keep vsce from prompting.
./node_modules/.bin/vsce package \
  --out "$vsix" \
  --no-dependencies \
  --no-yarn \
  --no-rewrite-relative-links \
  --allow-missing-repository

code --install-extension "$vsix" --force

echo "Installed $vsix"
echo "Reload the VS Code window to pick it up (Developer: Reload Window)."
