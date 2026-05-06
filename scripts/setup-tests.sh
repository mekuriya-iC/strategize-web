#!/bin/bash

# Automated Test Setup Script
# This script sets up everything needed to run the E2E tests

echo "🚀 Setting up Automated Tests..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install Playwright
echo "📦 Installing Playwright..."
npm install -D @playwright/test

if [ $? -eq 0 ]; then
    echo "✅ Playwright installed successfully"
else
    echo "❌ Failed to install Playwright"
    exit 1
fi

echo ""

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install

if [ $? -eq 0 ]; then
    echo "✅ Browsers installed successfully"
else
    echo "❌ Failed to install browsers"
    exit 1
fi

echo ""

# Create .env.test if it doesn't exist
if [ ! -f .env.test ]; then
    echo "📝 Creating .env.test file..."
    cp tests/e2e/.env.example .env.test
    echo "✅ .env.test created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.test and add your test credentials!"
    echo ""
else
    echo "✅ .env.test already exists"
    echo ""
fi

# Add test scripts to package.json if not already present
echo "📝 Checking package.json scripts..."

if ! grep -q "test:e2e" package.json; then
    echo "Adding test scripts to package.json..."
    
    # This is a simple approach - you might want to use a JSON parser for production
    echo ""
    echo "⚠️  Please add these scripts to your package.json manually:"
    echo ""
    echo '  "scripts": {'
    echo '    "test:e2e": "playwright test",'
    echo '    "test:e2e:ui": "playwright test --ui",'
    echo '    "test:e2e:headed": "playwright test --headed",'
    echo '    "test:e2e:debug": "playwright test --debug",'
    echo '    "test:e2e:report": "playwright show-report"'
    echo '  }'
    echo ""
else
    echo "✅ Test scripts already in package.json"
    echo ""
fi

echo "✨ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Edit .env.test with your test credentials"
echo "  2. Start your dev server: npm run dev"
echo "  3. Run tests: npm run test:e2e:ui"
echo ""
echo "📖 For more information, see TEST_SETUP_GUIDE.md"
echo ""
