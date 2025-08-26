@echo off
cls
echo ========================================
echo      Focus Tuin - Servers Starten
echo ========================================
echo.

:: Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment niet gevonden!
    echo.
    echo Run eerst: install.bat
    echo.
    pause
    exit /b 1
)

:: Check if dependencies are installed
echo [INFO] Dependencies controleren...
call venv\Scripts\activate.bat

python -c "import flask, cv2, mediapipe" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python dependencies niet compleet!
    echo.
    echo Run: install.bat om dependencies te installeren
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [ERROR] JavaScript dependencies niet gevonden!
    echo.
    echo Run: npm install
    echo.
    pause
    exit /b 1
)

:: Check for existing processes and kill them
echo [INFO] Bestaande processes opruimen...
taskkill /f /im "python.exe" /fi "WINDOWTITLE eq Focus Tuin Python Backend*" >nul 2>&1
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq Focus Tuin Frontend*" >nul 2>&1

:: Wait a moment for processes to close
timeout /t 2 /nobreak >nul

echo.
echo [STAP 1/3] Python Backend starten...
echo [INFO] Oogtracking server opstarten op http://localhost:5001

:: Start Python backend in new window
start /min cmd /k "title Focus Tuin Python Backend && cd /d "%CD%" && call venv\Scripts\activate.bat && echo [BACKEND] Starting Python eye-tracking server... && python main_server.py"

:: Wait for backend to start
echo [INFO] Wachten op Python backend (5 seconden)...
timeout /t 5 /nobreak >nul

:: Check if backend is running
curl -s http://localhost:5001 >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Python backend mogelijk nog niet gereed
    echo [INFO] Extra tijd geven...
    timeout /t 3 /nobreak >nul
)

echo.
echo [STAP 2/3] Frontend starten...
echo [INFO] Vite development server opstarten op http://localhost:5173

:: Start frontend in new window  
start /min cmd /k "title Focus Tuin Frontend && cd /d "%CD%" && echo [FRONTEND] Starting Vite development server... && npm run dev"

:: Wait for frontend to start
echo [INFO] Wachten op frontend (8 seconden)...
timeout /t 8 /nobreak >nul

echo.

echo.
echo ========================================
echo        FOCUS TUIN GESTART!
echo ========================================
echo.
echo [BACKEND]  Python Server:  http://localhost:5001
echo [FRONTEND] Vite Server:    http://localhost:5173
echo.
echo INSTRUCTIES:
echo 1. Ga naar http://localhost:5173 in je browser
echo 2. Volg de on-screen instructies voor camera setup
echo 3. Kalibreer je oogtracking
echo 4. Geniet van de Focus Tuin ervaring!
echo.
echo SLUITEN:
echo - Sluit dit venster om beide servers te stoppen
echo - Of gebruik Ctrl+C in elk server venster
echo.
echo TROUBLESHOOTING:
echo - Camera problemen: debug-camera.bat  
echo - Systeem check: debug-system.bat
echo - Herstart servers: stop-servers.bat dan start-servers.bat
echo.

echo [SUCCESS] Alle systemen operationeel!
echo.
echo Druk op een toets om de server logs te bekijken...
pause >nul

:: Show server status
echo.
echo [INFO] Server status controleren...
curl -s http://localhost:5001 >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Python backend reageert niet op http://localhost:5001
) else (
    echo [OK] Python backend operationeel
)

curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Frontend reageert niet op http://localhost:5173
) else (
    echo [OK] Frontend operationeel
)

echo.
echo Browser zou automatisch geopend moeten zijn.
echo Als dit niet het geval is, ga handmatig naar: http://localhost:5173
echo.
echo Dit venster open houden voor server management...
echo.

:: Keep window open and show helpful commands
:menu
echo ========================================
echo           SERVER MANAGEMENT
echo ========================================
echo.
echo [1] Open browser naar applicatie
echo [2] Check server status  
echo [3] Restart servers
echo [4] Stop servers
echo [5] Debug camera
echo [6] Afsluiten
echo.
set /p choice="Kies een optie (1-6): "

if "%choice%"=="1" (
    start "" "http://localhost:5173"
    goto menu
)
if "%choice%"=="2" (
    echo [INFO] Server status...
    curl -s http://localhost:5001 && echo [OK] Backend bereikbaar || echo [ERROR] Backend niet bereikbaar
    curl -s http://localhost:5173 && echo [OK] Frontend bereikbaar || echo [ERROR] Frontend niet bereikbaar
    echo.
    goto menu
)
if "%choice%"=="3" (
    echo [INFO] Servers herstarten...
    call stop-servers.bat
    timeout /t 2 /nobreak >nul
    call start-servers.bat
    exit /b
)
if "%choice%"=="4" (
    call stop-servers.bat
    exit /b
)
if "%choice%"=="5" (
    start "" debug-camera.bat
    goto menu
)
if "%choice%"=="6" (
    echo [INFO] Servers stoppen en afsluiten...
    call stop-servers.bat
    exit /b
)

goto menu