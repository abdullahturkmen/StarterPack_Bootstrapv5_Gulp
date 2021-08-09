@echo off

:: Update npm on Windows.

:: Instructions: download this .bat file (location shouldn't matter, but make sure
:: it saves with the .bat extension) and run as administrator.

:: This is essentially solution #3 of https://github.com/npm/npm/wiki/Troubleshooting#upgrading-on-windows,
:: just simplified by complicating things with a batch file :)
:: This approach requires re-running this script for each npm upgrade, but it keeps the
:: PATH variables as intended, whereas solution #1 requires either moving the nodejs entry
:: from the system PATH to the user PATH or adding a user-specific AppData file path
:: to the system PATH, neither of which seem ideal.


:: Ensure running as administrator for editing Program Files
:: http://stackoverflow.com/a/11995662/634956
net session >nul 2>&1
if not %errorLevel% == 0 (
    echo Administrative permissions required to modify files in nodejs install directory.
    :: Caret is escape character - http://www.robvanderwoude.com/escapechars.php
    echo Re-run file as Administrator ^(right-click, 'Run as administrator'^).
    goto Exit
)

setlocal
:: get location of npm being used (should be same as nodejs install location, likely C:\Program Files\nodejs or similar);
:: break with goto so we get the first line
for /f "delims=" %%i in ('where npm.cmd') do set NpmPath=%%i && goto Found
:Found

if "%NpmPath%" == "" (
    echo npm.cmd not found.
    goto Exit
)

:: Substring of file path to get just the directory (includes trailing space)
set NpmDir=%NpmPath:~0,-8%

:: Navigate to the npm install directory (should be same as nodejs)
cd %NpmDir%

:: Rename "npm" shell script so npm doesn't use it as the package source
if exist "npm" (
    ren npm npm.bak
)

:: Install npm as a local module
echo Upgrading npm in %NpmDir%...
call npm i npm
IF ERRORLEVEL 1 (
    echo npm upgrade was unsuccessful.
) else (
    echo npm upgrade successful.
)

:: Fix renamed shell script
if exist "npm.bak" (
    ren npm.bak npm
)

:Exit
endlocal
echo.
pause