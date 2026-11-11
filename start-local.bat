@echo off
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:4173"
  py -m http.server 4173
) else (
  where python >nul 2>&1
  if %errorlevel%==0 (
    start "" "http://localhost:4173"
    python -m http.server 4173
  ) else (
    echo Python not found. You can simply double-click index.html to preview the website.
    pause
  )
)
