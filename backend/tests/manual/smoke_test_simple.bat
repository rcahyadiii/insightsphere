@echo off
setlocal EnableDelayedExpansion

:: InsightSphere API Smoke Test Script (Windows CMD)
:: Usage: smoke_test_simple.bat [BASE_URL] [ADMIN_USER] [ADMIN_PASS]

set "BASE_URL=%~1"
if "!BASE_URL!"=="" set "BASE_URL=http://localhost:8000"

set "ADMIN_USER=%~2"
if "!ADMIN_USER!"=="" set "ADMIN_USER=admin"

set "ADMIN_PASS=%~3"
if "!ADMIN_PASS!"=="" set "ADMIN_PASS=1234"

set "TOKEN="
set "PASSED=0"
set "FAILED=0"
set "TOTAL=0"

:: Colors via PowerShell (fallback)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "CYAN=[96m"
set "RESET=[0m"

echo.
echo ==============================================================
echo          InsightSphere API Smoke Test
echo ==============================================================
echo Base URL:  !BASE_URL!
echo User:      !ADMIN_USER!
echo.

:: ============================================================
:: STEP 1: AUTH - Login to get JWT Token
:: ============================================================
echo -------------------------------------------------------------
echo STEP 1: AUTHENTICATION
echo -------------------------------------------------------------

echo [POST] /auth/login ... 

curl -s -X POST "!BASE_URL!/auth/login" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "username=!ADMIN_USER!" ^
  -d "password=!ADMIN_PASS!" ^
  -w "\nHTTP_CODE:%%{http_code}\n" ^
  > "%TEMP%\smoke_login.tmp"

for /f "tokens=2" %%a in ('findstr "HTTP_CODE:" "%TEMP%\smoke_login.tmp"') do set "LOGIN_CODE=%%a"

if "!LOGIN_CODE!"=="200" (
    echo   [200] OK
    set /a PASSED+=1
    for /f "tokens=2 delims=:," %%a in ('findstr "access_token" "%TEMP%\smoke_login.tmp"') do (
        set "TOKEN=%%a"
        set "TOKEN=!TOKEN:"=!"
        set "TOKEN=!TOKEN: =!"
    )
) else (
    echo   [!LOGIN_CODE!] FAILED
    type "%TEMP%\smoke_login.tmp"
    set /a FAILED+=1
    goto :cleanup
)
set /a TOTAL+=1
echo.

:: ============================================================
:: STEP 2: Health Check
:: ============================================================
echo -------------------------------------------------------------
echo STEP 2: HEALTH CHECK
echo -------------------------------------------------------------
call :test_get "/health" "200"

:: ============================================================
:: STEP 3: Identity Domain
echo -------------------------------------------------------------
echo STEP 3: IDENTITY DOMAIN
echo -------------------------------------------------------------
call :test_get "/auth/me" "200"
call :test_get "/auth/login-history?limit=5" "200"

:: ============================================================
:: STEP 4: Dataset Domain
echo -------------------------------------------------------------
echo STEP 4: DATASET DOMAIN (Stores)
echo -------------------------------------------------------------
call :test_get "/stores/" "200"

:: ============================================================
:: STEP 5: Inventory Domain
echo -------------------------------------------------------------
echo STEP 5: INVENTORY DOMAIN
echo -------------------------------------------------------------
call :test_get "/inventory/products?limit=5" "200"
call :test_get "/inventory/stock?limit=5" "200"
call :test_get "/inventory/stock/summary" "200"

:: ============================================================
:: STEP 6: Sales Domain
echo -------------------------------------------------------------
echo STEP 6: SALES DOMAIN
echo -------------------------------------------------------------
call :test_get "/transactions/?limit=5" "200"
call :test_get "/transactions/summary/today" "200"

:: ============================================================
:: STEP 7: Intelligence Domain
echo -------------------------------------------------------------
echo STEP 7: INTELLIGENCE DOMAIN
echo -------------------------------------------------------------
call :test_get "/api/analytics/predictions?limit=5" "200"
call :test_get "/api/analytics/metrics?limit=5" "200"

:: ============================================================
:: STEP 8: Notification Domain
echo -------------------------------------------------------------
echo STEP 8: NOTIFICATION DOMAIN
echo -------------------------------------------------------------
call :test_get "/notifications?limit=5" "200"

:: ============================================================
:: STEP 9: Reporting Domain
echo -------------------------------------------------------------
echo STEP 9: REPORTING DOMAIN
echo -------------------------------------------------------------
call :test_get "/reporting/templates" "200"
call :test_get "/reporting/history?limit=5" "200"

:: ============================================================
:: STEP 10: MLOps
echo -------------------------------------------------------------
echo STEP 10: MLOPS ENDPOINT
echo -------------------------------------------------------------
call :test_post "/api/ml/run-daily-batch" "200"

:: ============================================================
:: STEP 11: WebSocket TCP Test
echo -------------------------------------------------------------
echo STEP 11: WEBSOCKET CONNECTIVITY
echo -------------------------------------------------------------
echo [WS] Testing TCP port 8000 ...
powershell -Command "$c = New-Object System.Net.Sockets.TcpClient; try { $c.Connect('localhost', 8000); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>nul
if !ERRORLEVEL! == 0 (
    echo   [OK] Port 8000 is open
    set /a PASSED+=1
) else (
    echo   [FAIL] Cannot connect to port 8000
    set /a FAILED+=1
)
set /a TOTAL+=1

:: ============================================================
:: SUMMARY
:: ============================================================
echo.
echo ==============================================================
echo                    SMOKE TEST SUMMARY
echo ==============================================================
echo.
echo   PASSED:  !PASSED!
echo   FAILED:  !FAILED!
echo   TOTAL:   !TOTAL!
echo.

if !FAILED! == 0 (
    echo [OK] All smoke tests passed! Backend is healthy.
    exit /b 0
) else (
    echo [FAIL] Some tests failed. Please check the backend status.
    exit /b 1
)

:: ============================================================
:: Helper Functions
:: ============================================================
:test_get
echo [GET] %~1 ...
curl -s "!BASE_URL!%~1" -H "Authorization: Bearer !TOKEN!" -w "\nHTTP_CODE:%%{http_code}\n" > "%TEMP%\smoke_test.tmp"
for /f "tokens=2" %%a in ('findstr "HTTP_CODE:" "%TEMP%\smoke_test.tmp"') do set "CODE=%%a"
echo !CODE! | findstr "%~2" >nul
if !ERRORLEVEL! == 0 (
    echo   [!CODE!] OK
    set /a PASSED+=1
) else (
    echo   [!CODE!] FAIL (Expected: %~2)
    set /a FAILED+=1
)
set /a TOTAL+=1
exit /b 0

:test_post
echo [POST] %~1 ...
curl -s -X POST "!BASE_URL!%~1" -H "Authorization: Bearer !TOKEN!" -w "\nHTTP_CODE:%%{http_code}\n" > "%TEMP%\smoke_test.tmp"
for /f "tokens=2" %%a in ('findstr "HTTP_CODE:" "%TEMP%\smoke_test.tmp"') do set "CODE=%%a"
echo !CODE! | findstr "%~2" >nul
if !ERRORLEVEL! == 0 (
    echo   [!CODE!] OK
    set /a PASSED+=1
) else (
    echo   [!CODE!] FAIL (Expected: %~2)
    set /a FAILED+=1
)
set /a TOTAL+=1
exit /b 0

:cleanup
del "%TEMP%\smoke_test*.tmp" 2>nul
exit /b
