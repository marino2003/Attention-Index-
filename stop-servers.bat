@echo off
cls
echo ========================================
echo     Focus Tuin - Servers Stoppen
echo ========================================
echo.

echo [INFO] Focus Tuin servers stoppen...

:: Kill Python backend processes
echo [STAP 1/4] Python backend stoppen...
taskkill /f /im "python.exe" /fi "WINDOWTITLE eq Focus Tuin Python Backend*" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Geen Python backend processen gevonden
) else (
    echo [OK] Python backend gestopt
)

:: Kill any remaining Python processes on port 5001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5001" ^| findstr "LISTENING"') do (
    echo [INFO] Process op poort 5001 stoppen: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo [STAP 2/4] Frontend stoppen...
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq Focus Tuin Frontend*" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Geen frontend processen gevonden
) else (
    echo [OK] Frontend gestopt
)

:: Kill any remaining Node.js processes on port 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo [INFO] Process op poort 5173 stoppen: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo [STAP 3/4] Browser tabs sluiten...
:: Close browser tabs with localhost
taskkill /f /im "chrome.exe" /fi "WINDOWTITLE eq *localhost*" >nul 2>&1
taskkill /f /im "msedge.exe" /fi "WINDOWTITLE eq *localhost*" >nul 2>&1
taskkill /f /im "firefox.exe" /fi "WINDOWTITLE eq *localhost*" >nul 2>&1

echo [INFO] Browser tabs met localhost gesloten

echo.
echo [STAP 4/4] Port beschikbaarheid controleren...

:: Check if ports are free
netstat -an | findstr ":5001" >nul 2>&1
if errorlevel 1 (
    echo [OK] Poort 5001 (Python backend) is vrij
) else (
    echo [WARNING] Poort 5001 nog in gebruik
)

netstat -an | findstr ":5173" >nul 2>&1
if errorlevel 1 (
    echo [OK] Poort 5173 (Frontend) is vrij  
) else (
    echo [WARNING] Poort 5173 nog in gebruik
)

echo.
echo ========================================
echo        SERVERS GESTOPT
echo ========================================
echo.
echo Alle Focus Tuin processen zijn gestopt.
echo Poorten 5001 en 5173 zouden nu vrij moeten zijn.
echo.
echo Om opnieuw te starten: start-servers.bat
echo.

:: Optional: Show remaining processes that might be related
echo Wil je controleren op overgebleven processen? [Y/N]
set /p check=">"
if /i "%check%"=="Y" (
    echo.
    echo [INFO] Controleren op gerelateerde processen...
    echo.
    echo Python processen:
    tasklist | findstr "python.exe" 2>nul || echo Geen Python processen gevonden
    echo.
    echo Node.js processen:  
    tasklist | findstr "node.exe" 2>nul || echo Geen Node.js processen gevonden
    echo.
    echo Poort usage:
    netstat -an | findstr ":500" 2>nul || echo Geen processen op 50xx poorten
    netstat -an | findstr ":517" 2>nul || echo Geen processen op 517x poorten
)

echo.
echo [SUCCESS] Cleanup voltooid!
echo.
pause