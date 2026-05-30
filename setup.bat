@echo off
chcp 65001 >nul 2>&1

:: ============================================================
::  UmairDocs - One-Click Setup
::  Just extract this ZIP and run setup.bat!
:: ============================================================

echo.
echo  ============================================================
echo     UmairDocs - Automated Setup
echo  ============================================================
echo.
echo  This will install all dependencies and set up the database.
echo  It will take 3-5 minutes. Please wait!
echo.

:: --- Check Node.js ---
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Node.js is NOT installed!
    echo.
    echo  Please install Node.js from https://nodejs.org
    echo  Download the LTS version, install it, restart VS Code.
    echo  Then run setup.bat again.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do echo  Node.js found: %%v
for /f "tokens=*" %%v in ('npm -v') do echo  npm found: %%v
echo.

:: --- Check if package.json exists ---
if not exist "package.json" (
    echo.
    echo  [ERROR] package.json not found!
    echo.
    echo  Make sure you extracted the ZIP file into this folder.
    echo  All files from the ZIP should be here, including package.json.
    echo.
    pause
    exit /b 1
)

:: ============================================================
:: STEP 1: Install npm dependencies
:: ============================================================
echo.
echo  [1/5] Installing npm dependencies...
echo  (This takes 2-3 minutes, please wait)
echo.

call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] npm install failed!
    echo  Check your internet connection and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo  [OK] All dependencies installed!
echo.

:: ============================================================
:: STEP 2: Initialize shadcn/ui
:: ============================================================
echo.
echo  [2/5] Setting up shadcn/ui...
echo.

call npx shadcn@latest init -d

if %ERRORLEVEL% NEQ 0 (
    echo  [WARN] shadcn init had an issue, trying to continue...
)

echo.

:: ============================================================
:: STEP 3: Install shadcn components
:: ============================================================
echo.
echo  [3/5] Installing shadcn/ui components...
echo  (This takes 1-2 minutes)
echo.

call npx shadcn@latest add button card dialog input label select tabs textarea badge separator avatar dropdown-menu popover command scroll-area sheet switch tooltip accordion alert alert-dialog calendar carousel chart checkbox collapsible context-menu form hover-card input-otp menubar navigation-menu pagination progress radio-group resizable slider table toggle toggle-group drawer sonner -y

if %ERRORLEVEL% NEQ 0 (
    echo  [WARN] Some shadcn components may not have installed. Continuing...
)

echo.

:: ============================================================
:: STEP 4: Set up Prisma database
:: ============================================================
echo.
echo  [4/5] Setting up database...
echo.

if not exist "db" mkdir db

call npx prisma db push

if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Database setup failed!
    echo  Check prisma/schema.prisma and try again.
    echo.
    pause
    exit /b 1
)

call npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Prisma client generation failed!
    echo.
    pause
    exit /b 1
)

if exist "prisma\dev.db" (
    copy /Y "prisma\dev.db" "db\custom.db" >nul 2>&1
    echo  [OK] Database copied to db\custom.db
)

echo.
echo  [OK] Database ready!
echo.

:: ============================================================
:: STEP 5: Set up .env file
:: ============================================================
echo.
echo  [5/5] Setting up environment...
echo.

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  [OK] Created .env from .env.example
        echo.
        echo  [IMPORTANT] Open .env and replace:
        echo    YOUR_RESEND_API_KEY_HERE
        echo  with your real Resend API key!
        echo.
    ) else (
        echo  [WARN] .env.example not found. Create .env manually.
    )
) else (
    echo  [OK] .env file already exists
)

:: ============================================================
:: DONE!
:: ============================================================
echo.
echo  ============================================================
echo.
echo   SETUP COMPLETE!
echo.
echo   To start the app, run:
echo.
echo     run.bat
echo.
echo   OR type:
echo.
echo     npm run dev
echo.
echo   Then open: http://localhost:3000
echo.
echo  ============================================================
echo.

pause
