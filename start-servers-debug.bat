@echo off
title Focus Garden - Debug Mode Startup
color 0A

echo.
echo  ==========================================
echo   Creative Coding Installation - DEBUG MODE
echo  ==========================================
echo.
echo  Starting all servers + debug camera...
echo.

echo   Starting Python Eye-tracking Backend...
start "Python Backend - Eye Tracking" cmd /k "cd /d %~dp0 && echo 🐍 Activating Python environment... && venv\Scripts\activate && echo 👁️ Starting eye-tracking server... && python eye_tracking_server.py"

timeout /t 3 /nobreak > nul

echo   Starting Vite Frontend Server...
start "Vite Frontend - Focus Garden" cmd /k "cd /d %~dp0 && echo 🎨 Starting Vite development server... && npm run dev"

timeout /t 2 /nobreak > nul

echo   Starting Debug Camera Preview...
start "Debug Camera - MediaPipe Tracking" cmd /k "cd /d %~dp0 && echo 🎥 Activating Python environment for debug camera... && venv\Scripts\activate && echo 📹 Starting persistent debug camera preview... && python debug_camera_preview.py"

echo.
echo  All three components are starting in separate windows!
echo.
echo   Python Backend: http://localhost:5001
echo   Frontend: http://localhost:5174 (or 5173)
echo   Debug Camera: MediaPipe tracking visualization window
echo.
echo  Debug Mode Features:
echo     - Real-time iris tracking visualization
echo     - Gaze direction arrows and measurements
echo     - FPS monitoring and confidence display
echo     - Interactive controls ('i','h','g','f','q' keys)
echo.
echo  Tips:
echo     - Allow camera access when prompted
echo     - Use debug camera to verify eye tracking quality
echo     - Toggle different visualizations with keyboard
echo     - Look at center point to grow your garden
echo.
echo  Press any key to close this startup window...
pause >nul