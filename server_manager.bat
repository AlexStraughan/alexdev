@echo off
title Server Manager
color 0A

:menu
cls
echo.
echo ===============================================
echo           SERVER MANAGER
echo ===============================================
echo.
echo 1. Restart Both Servers (Kill + Start)
echo 2. Start WebSocket Server Only
echo 3. Start Main App Server Only
echo 4. Kill All Ruby Processes
echo 5. Check Server Status
echo 6. Exit
echo.
echo ===============================================
echo.

set /p choice=Enter your choice (1-6): 

if "%choice%"=="1" goto restart_all
if "%choice%"=="2" goto start_websocket
if "%choice%"=="3" goto start_app
if "%choice%"=="4" goto kill_all
if "%choice%"=="5" goto check_status
if "%choice%"=="6" goto exit

echo Invalid choice. Please try again.
timeout /t 2 /nobreak >nul
goto menu

:restart_all
echo.
echo Restarting all servers...
echo Killing existing Ruby processes...
taskkill /F /IM ruby.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting WebSocket server...
start "WebSocket Server" cmd /k "cd /d %~dp0 && ruby websocket_server.rb"
timeout /t 3 /nobreak >nul

echo Starting main app server...
start "Main App Server" cmd /k "cd /d %~dp0 && ruby app.rb"

echo Both servers started!
echo WebSocket Server: ws://127.0.0.1:9292
echo Main App Server: http://127.0.0.1:4567
goto menu_pause

:start_websocket
echo.
echo Starting WebSocket server...
start "WebSocket Server" cmd /k "cd /d %~dp0 && ruby websocket_server.rb"
echo WebSocket server started at ws://127.0.0.1:9292
goto menu_pause

:start_app
echo.
echo Starting main app server...
start "Main App Server" cmd /k "cd /d %~dp0 && ruby app.rb"
echo Main app server started at http://127.0.0.1:4567
goto menu_pause

:kill_all
echo.
echo Killing all Ruby processes...
taskkill /F /IM ruby.exe >nul 2>&1
echo All Ruby processes terminated
goto menu_pause

:check_status
echo.
echo Checking server status...
echo.
echo Ruby processes:
tasklist /FI "IMAGENAME eq ruby.exe" /FO TABLE
echo.
echo Network connections:
netstat -an | findstr ":4567\|:9292"
echo.
goto menu_pause

:menu_pause
echo.
echo Press any key to return to menu...
pause >nul
goto menu

:exit
echo.
echo Goodbye!
timeout /t 1 /nobreak >nul
exit
