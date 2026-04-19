@echo off
REM ============================================================
REM Coverity Static Analysis - Inventory Management Module
REM E-Commerce Platform - Software Testing Demo
REM ============================================================

SET PROJECT_ROOT=%~dp0..
SET BE_DIR=%PROJECT_ROOT%\BE
SET COV_DIR=%PROJECT_ROOT%\coverity
SET COV_INT=%COV_DIR%\cov-int
SET COV_OUTPUT=%COV_DIR%\cov-output

echo ======================================================
echo  Coverity Analysis - Inventory Management Module
echo ======================================================
echo.

REM ----- STEP 1: Configure Coverity for JavaScript/TypeScript -----
echo [STEP 1] Configuring Coverity for JavaScript/TypeScript...
cov-configure --javascript
IF %ERRORLEVEL% NEQ 0 ( echo ERROR in Step 1 & exit /b 1 )
echo   Done.
echo.

REM ----- STEP 2: Build capture -----
echo [STEP 2] Capturing source files...
IF EXIST "%COV_INT%" rmdir /s /q "%COV_INT%"

cov-build --dir "%COV_INT%" --no-command ^
  --fs-capture-search "%BE_DIR%\src\services\inventory" ^
  --fs-capture-search "%BE_DIR%\src\controllers\inventory" ^
  --fs-capture-search "%BE_DIR%\src\routes\inventory" ^
  --fs-capture-search "%BE_DIR%\src\models\products" ^
  --fs-capture-search "%BE_DIR%\src\utils" ^
  --fs-capture-search "%COV_DIR%"
IF %ERRORLEVEL% NEQ 0 ( echo ERROR in Step 2 & exit /b 1 )
echo   Done.
echo.

REM ----- STEP 3: Run analysis -----
echo [STEP 3] Running static analysis...
cov-analyze --dir "%COV_INT%" --all ^
  --enable TAINTED_DATA ^
  --enable NULL_RETURNS ^
  --enable FORWARD_NULL ^
  --enable SWALLOWED_EXCEPTION ^
  --enable CHECKED_RETURN ^
  --enable RESOURCE_LEAK ^
  --enable TOCTOU ^
  --enable MISSING_CHECK ^
  --enable UNREACHABLE ^
  --enable DEAD_CODE ^
  --strip-path "%BE_DIR%\src"
IF %ERRORLEVEL% NEQ 0 ( echo ERROR in Step 3 & exit /b 1 )
echo   Done.
echo.

REM ----- STEP 4: Generate HTML report -----
echo [STEP 4] Generating HTML report...
IF EXIST "%COV_OUTPUT%" rmdir /s /q "%COV_OUTPUT%"
mkdir "%COV_OUTPUT%"
cov-format-errors --dir "%COV_INT%" ^
  --html-output "%COV_OUTPUT%\inventory-defects-report"
IF %ERRORLEVEL% NEQ 0 ( echo ERROR in Step 4 & exit /b 1 )
echo   Done.
echo.

echo ======================================================
echo  Analysis complete!
echo  HTML Report: %COV_OUTPUT%\inventory-defects-report\index.html
echo ======================================================
pause
