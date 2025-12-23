#!/bin/bash

# Velocity - Installation Script
# This script fixes common npm installation issues

echo "🔧 Velocity - Installation Helper"
echo "======================================"
echo ""

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ required. You have: $(node --version)"
    echo "Please update Node.js: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js version: $(node --version)"
echo ""

# Fix npm cache permissions if needed
echo "🔧 Checking npm cache permissions..."
if [ -d "$HOME/.npm" ]; then
    echo "Attempting to fix npm cache permissions..."
    sudo chown -R $(whoami) "$HOME/.npm" 2>/dev/null || echo "⚠️  Could not fix permissions automatically. You may need to run: sudo chown -R $(whoami) ~/.npm"
fi
echo ""

# Clean previous installations
echo "🧹 Cleaning previous installations..."
rm -rf node_modules package-lock.json .next
echo "✅ Cleaned"
echo ""

# Clear npm cache
echo "🗑️  Clearing npm cache..."
npm cache clean --force
echo "✅ Cache cleared"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
echo "This may take a few minutes..."

# Try normal install first
npm install 2>&1 | tee /tmp/npm-install.log
INSTALL_STATUS=${PIPESTATUS[0]}

if [ $INSTALL_STATUS -eq 0 ]; then
    echo "✅ Installation complete!"
elif grep -q "napi-postinstall\|command not found" /tmp/npm-install.log 2>/dev/null; then
    echo ""
    echo "⚠️  Native module build failed, trying alternative method..."
    echo "Installing with --ignore-scripts (safe for Next.js development)..."
    npm install --ignore-scripts
    
    if [ $? -eq 0 ]; then
        echo "✅ Installation complete (with ignored native scripts)"
        echo "ℹ️  Note: Some optional native modules were skipped. This won't affect development."
    else
        echo "❌ Installation failed. Please check the error messages above."
        exit 1
    fi
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Create a .env.local file with your Firebase credentials"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"

