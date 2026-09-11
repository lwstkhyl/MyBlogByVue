@echo off
setlocal

set "FRONTEND_DIR=%~dp0"
for %%I in ("%FRONTEND_DIR%..\MyBlogBackend") do set "BACKEND_DIR=%%~fI"

if not exist "%BACKEND_DIR%\server.js" (
    echo [ERROR] Backend project not found: "%BACKEND_DIR%"
    pause
    exit /b 1
)

where mongod >nul 2>&1
if errorlevel 1 (
    echo [ERROR] mongod was not found in PATH.
    pause
    exit /b 1
)

where nodemon >nul 2>&1
if errorlevel 1 (
    echo [ERROR] nodemon was not found in PATH.
    pause
    exit /b 1
)

start "MyBlog MongoDB" "%ComSpec%" /d /k mongod
start "MyBlog Backend" /d "%BACKEND_DIR%" "%ComSpec%" /d /k nodemon server.js

title MyBlog Frontend
cd /d "%FRONTEND_DIR%"
call npm run serve

endlocal
