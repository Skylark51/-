@echo off
setlocal
cd /d "%~dp0"

echo Starting KongJuiYa Chem at http://127.0.0.1:4173/index.html
start "KongJuiYa Chem server" /b py -3.12 -m http.server 4173 --bind 127.0.0.1
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:4173/index.html"

echo.
echo Keep this window open while playing. Press Ctrl+C to stop the local server.
pause >nul
