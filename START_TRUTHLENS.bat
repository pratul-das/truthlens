@echo off
title TruthLens

echo ========================================
echo          Starting TruthLens
echo ========================================
echo.

REM Close old server using port 5500
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5500 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Start Backend
start "TruthLens Backend" cmd /k "cd /d C:\Users\ASUS\OneDrive\Desktop\truthlens\backend && ..\venv\Scripts\python.exe -m uvicorn app.main:app --reload"

REM Start Frontend DIRECTLY from frontend folder
start "TruthLens Frontend" cmd /k "C:\Users\ASUS\OneDrive\Desktop\truthlens\venv\Scripts\python.exe -m http.server 5500 --directory C:\Users\ASUS\OneDrive\Desktop\truthlens\frontend"

REM Wait for frontend
timeout /t 5 /nobreak >nul

REM Open Home page
start "" "http://localhost:5500/index.html"

exit