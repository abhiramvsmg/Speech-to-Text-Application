@echo off
title AURA Git Auto-Sync
color 0b

echo ==============================================
echo       🎙️ AURA.transcript - QUICK SYNC
echo ==============================================
echo.

echo [1/3] Staging all new changes...
git add -A
echo.

echo [2/3] Writing automated commit...
git commit -m "Auto-Sync: %date% %time%"
echo.

echo [3/3] Pushing changes to GitHub...
git push origin main
echo.

echo ==============================================
echo    🚀 SUCCESS! YOUR CHANGES ARE ON GITHUB!
echo ==============================================
echo.
pause
