#!/bin/bash
# GET BRANDON — Install script

set -e

INSTALL_DIR="$HOME/.claude/get-brand-done"
COMMANDS_DIR="$HOME/.claude/commands/gbd"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " GET BRANDON — Installation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create directories
mkdir -p "$INSTALL_DIR/workflows"
mkdir -p "$INSTALL_DIR/bin"
mkdir -p "$COMMANDS_DIR"

# Install workflows
cp workflows/*.md "$INSTALL_DIR/workflows/"
echo "✓ Workflows installés"

# Install utility script
cp bin/gbd-tools.cjs "$INSTALL_DIR/bin/"
echo "✓ gbd-tools.cjs installé"

# Install Claude Code commands
cp commands/*.md "$COMMANDS_DIR/"
echo "✓ Commandes Claude Code installées"

echo ""
echo "Installation terminée."
echo ""
echo "Lance Claude Code dans ton dossier de travail et utilise :"
echo "  /gbd:start <nom-client>"
echo ""
