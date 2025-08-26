@echo off
cls
echo =====================================
echo     Focus Tuin - Automatische Setup
echo =====================================
echo.

:: Check if running as administrator (recommended for clean install)
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Adminrechten gedetecteerd - optimale installatie mogelijk
) else (
    echo [WARNING] Geen adminrechten - sommige features mogelijk beperkt
)

echo [STAP 1/6] Python versie controleren...
echo.

:: Check Python version
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python niet gevonden!
    echo.
    echo Installeer Python 3.11.9 vanaf: https://www.python.org/downloads/release/python-3119/
    echo Zorg ervoor dat je "Add Python to PATH" aanvinkt tijdens installatie.
    echo.
    pause
    exit /b 1
)

:: Get Python version and check if it's 3.11.x
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo Python versie gevonden: %PYTHON_VERSION%

:: Check if version starts with 3.11
echo %PYTHON_VERSION% | findstr /c:"3.11" >nul
if errorlevel 1 (
    echo [WARNING] Python %PYTHON_VERSION% gedetecteerd
    echo Voor optimale MediaPipe compatibiliteit wordt Python 3.11.9 aanbevolen
    echo Wil je doorgaan? [Y/N]
    set /p continue=">"
    if /i not "%continue%"=="Y" exit /b 1
) else (
    echo [OK] Python 3.11.x gedetecteerd - uitstekend voor MediaPipe!
)

echo.
echo [STAP 2/6] Node.js controleren...

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js niet gevonden!
    echo.
    echo Installeer Node.js vanaf: https://nodejs.org/
    echo Download de LTS versie (aanbevolen).
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=1" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
    echo [OK] Node.js versie gevonden: %NODE_VERSION%
)

echo.
echo [STAP 3/6] Python virtual environment aanmaken...

:: Remove existing venv if it exists
if exist "venv" (
    echo [INFO] Bestaande virtual environment gevonden - opruimen...
    rmdir /s /q "venv"
)

:: Create new virtual environment
python -m venv venv
if errorlevel 1 (
    echo [ERROR] Kan virtual environment niet aanmaken!
    echo Controleer of Python correct is geïnstalleerd.
    pause
    exit /b 1
)
echo [OK] Virtual environment aangemaakt

:: Activate virtual environment
echo [INFO] Virtual environment activeren...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Kan virtual environment niet activeren!
    pause
    exit /b 1
)

echo.
echo [STAP 4/6] Python dependencies installeren...
echo [INFO] Dit kan enkele minuten duren...

:: Upgrade pip first
python -m pip install --upgrade pip

:: Install Python requirements
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Python packages installatie gefaald!
    echo.
    echo Mogelijke oplossingen:
    echo 1. Controleer internetverbinding
    echo 2. Probeer: pip install --upgrade pip
    echo 3. Handmatige installatie: pip install mediapipe opencv-python Flask-SocketIO
    echo.
    pause
    exit /b 1
)
echo [OK] Python dependencies geïnstalleerd

echo.
echo [STAP 5/6] JavaScript dependencies installeren...

:: Install npm packages
npm install
if errorlevel 1 (
    echo [ERROR] NPM packages installatie gefaald!
    echo.
    echo Mogelijke oplossingen:
    echo 1. Controleer internetverbinding
    echo 2. Probeer: npm cache clean --force
    echo 3. Verwijder node_modules en probeer opnieuw
    echo.
    pause
    exit /b 1
)
echo [OK] JavaScript dependencies geïnstalleerd

echo.
echo [STAP 6/6] Camera systeem testen...

:: Quick camera test
echo [INFO] Camera beschikbaarheid testen...
python -c "import cv2; cap=cv2.VideoCapture(0); print('[OK] Camera toegankelijk' if cap.isOpened() else '[WARNING] Camera niet toegankelijk'); cap.release()" 2>nul
if errorlevel 1 (
    echo [WARNING] Camera test kon niet uitgevoerd worden
    echo Dit is normaal als geen camera is aangesloten
)

echo.
echo =====================================
echo       INSTALLATIE VOLTOOID!
echo =====================================
echo.
echo Focus Tuin is klaar voor gebruik!
echo.
echo VOLGENDE STAPPEN:
echo 1. Sluit eventuele camera apps (Skype, Teams, etc.)
echo 2. Zorg dat je webcam is aangesloten
echo 3. Run: start-servers.bat
echo.
echo Voor troubleshooting: debug-camera.bat
echo Voor systeem info: debug-system.bat
echo.
echo Documentatie: README.md
echo.

:: Create desktop shortcut (optional)
echo Wil je een desktop snelkoppeling aanmaken? [Y/N]
set /p shortcut=">"
if /i "%shortcut%"=="Y" (
    echo [INFO] Desktop snelkoppeling aanmaken...
    echo @echo off > "%USERPROFILE%\Desktop\Focus Tuin.bat"
    echo cd /d "%CD%" >> "%USERPROFILE%\Desktop\Focus Tuin.bat"
    echo start-servers.bat >> "%USERPROFILE%\Desktop\Focus Tuin.bat"
    echo [OK] Snelkoppeling aangemaakt op desktop
)

echo.
echo [SUCCESS] Setup voltooid! 
echo Press any key to continue...
pause >nul