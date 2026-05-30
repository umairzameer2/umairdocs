@echo off
chcp 65001 >nul 2>&1

:: ============================================================
::  UmairDocs - Start the App
:: ============================================================

echo.
echo  ============================================================
echo     UmairDocs - Starting Development Server
echo  ============================================================
echo.

:: --- Check if node_modules exists ---
if not exist "node_modules" (
    echo  [ERROR] node_modules not found!
    echo.
    echo  You need to run setup.bat first!
    echo.
    pause
    exit /b 1
)

:: --- Check if .env exists ---
if not exist ".env" (
    echo  [ERROR] .env file not found!
    echo.
    echo  Please rename .env.example to .env
    echo  Then add your Resend API key in .env
    echo.
    pause
    exit /b 1
)

echo  Starting UmairDocs...
echo.
echo  Open your browser: http://localhost:3000
echo.
echo  Press Ctrl+C to stop the server
echo.
echo  ============================================================
echo.

call npm run dev
