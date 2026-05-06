@echo off
REM Automated Test Setup Script for Windows
REM This script sets up everything needed to run the E2E tests

echo 🚀 Setting up Automated Tests...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Install Playwright
echo 📦 Installing Playwright...
call npm install -D @playwright/test

if %ERRORLEVEL% EQU 0 (
    echo ✅ Playwright installed successfully
) else (
    echo ❌ Failed to install Playwright
    exit /b 1
)

echo.

REM Install Playwright browsers
echo 🌐 Installing Playwright browsers...
call npx playwright install

if %ERRORLEVEL% EQU 0 (
    echo ✅ Browsers installed successfully
) else (
    echo ❌ Failed to install browsers
    exit /b 1
)

echo.

REM Create .env.test if it doesn't exist
if not exist .env.test (
    echo 📝 Creating .env.test file...
    copy tests\e2e\.env.example .env.test
    echo ✅ .env.test created
    echo.
    echo ⚠️  IMPORTANT: Please edit .env.test and add your test credentials!
    echo.
) else (
    echo ✅ .env.test already exists
    echo.
)

echo ✨ Setup complete!
echo.
echo 📚 Next steps:
echo   1. Edit .env.test with your test credentials
echo   2. Start your dev server: npm run dev
echo   3. Run tests: npm run test:e2e:ui
echo.
echo 📖 For more information, see TEST_SETUP_GUIDE.md
echo.

pause
