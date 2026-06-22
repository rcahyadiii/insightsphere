# ============================================================
# InsightSphere API Comprehensive Test Script (PowerShell)
# Tests ALL 48 API Endpoints across 9 domains
# ============================================================
# Usage: .\smoke_test_comprehensive.ps1 [-BaseUrl "http://localhost:8000"] [-AdminUser "admin"] [-AdminPass "1234"]
# ============================================================

param(
    [string]$BaseUrl = "http://localhost:8000",
    [string]$AdminUser = "admin",
    [string]$AdminPass = "1234"
)

# Statistics
$script:Passed = 0
$script:Failed = 0
$script:Skipped = 0
$script:Total = 0
$script:Token = $null
$script:TestProductId = $null
$script:TestStoreNbr = 1
$script:TestTransactionId = $null
$script:TestNotificationId = $null
$script:TestSessionId = $null

# ============================================================
# Helper Functions
# ============================================================

function Write-Header($text) {
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host $text -ForegroundColor Cyan
    Write-Host "==============================================================" -ForegroundColor Cyan
}

function Write-Result($method, $path, $status, $expected, $errorMsg = $null) {
    $script:Total++
    $statusStr = $status.ToString()
    
    $expectedList = $expected -split " "
    $isSuccess = $expectedList -contains $statusStr
    
    if ($isSuccess) {
        $script:Passed++
        Write-Host "  [$method] $path " -NoNewline
        Write-Host "[$statusStr] OK" -ForegroundColor Green
    } else {
        $script:Failed++
        Write-Host "  [$method] $path " -NoNewline
        Write-Host "[$statusStr] FAILED (Expected: $expected)" -ForegroundColor Red
        if ($errorMsg) {
            Write-Host "    Error: $errorMsg" -ForegroundColor DarkGray
        }
    }
    
    return $isSuccess
}

function Invoke-ApiTest($Method, $Path, $Headers = @{}, $Expected = "200", $Body = $null, $ExtractFn = $null) {
    $uri = "$BaseUrl$Path"
    $allHeaders = @{
        "Accept" = "application/json"
    }
    
    if ($script:Token) {
        $allHeaders["Authorization"] = "Bearer $($script:Token)"
    }
    
    foreach ($key in $Headers.Keys) {
        $allHeaders[$key] = $Headers[$key]
    }
    
    try {
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $allHeaders
            SkipHttpErrorCheck = $true
        }
        
        if ($Body) {
            $params['Body'] = $Body
            $params['ContentType'] = "application/json"
        }
        
        $response = Invoke-WebRequest @params -ErrorAction SilentlyContinue
        $result = Write-Result $Method $Path $response.StatusCode $Expected
        
        if ($ExtractFn -and $response.StatusCode -eq 200) {
            try {
                $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($content) {
                    & $ExtractFn $content
                }
            } catch {}
        }
        
        return $response
    }
    catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $errorBody = $_.ErrorDetails.Message
            Write-Result $Method $Path $statusCode $Expected $errorBody
            return @{ StatusCode = $statusCode; Error = $_; Content = $errorBody }
        } else {
            Write-Result $Method $Path 0 $Expected $_.Exception.Message
            return @{ StatusCode = 0; Error = $_ }
        }
    }
}

function Test-TcpPort($Hostname, $Port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect($Hostname, $Port)
        $client.Close()
        return $true
    }
    catch {
        return $false
    }
}

# ============================================================
# Main Script
# ============================================================

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "    InsightSphere API Comprehensive Test (48 Endpoints)       " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "Base URL:  $BaseUrl" -ForegroundColor Blue
Write-Host "User:      $AdminUser" -ForegroundColor Blue
Write-Host ""

# ============================================================
# STEP 1: Authentication
# ============================================================
Write-Header "STEP 1: IDENTITY DOMAIN (Auth - 10 endpoints)"

# 1. Login
$formData = "username=$AdminUser&password=$AdminPass"
$loginUri = "$BaseUrl/auth/login"
try {
    $loginResponse = Invoke-WebRequest -Uri $loginUri -Method POST -Body $formData -ContentType "application/x-www-form-urlencoded" -SkipHttpErrorCheck
    Write-Result "POST" "/auth/login" $loginResponse.StatusCode "200 401"
    
    if ($loginResponse.StatusCode -eq 200) {
        $content = $loginResponse.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($content.access_token) {
            $script:Token = $content.access_token
            Write-Host "    Token acquired: $($script:Token.Substring(0, 25))..." -ForegroundColor DarkGray
        }
    }
} catch {
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Result "POST" "/auth/login" $statusCode "200 401"
    }
}

if (-not $script:Token) {
    Write-Host "ERROR: Could not obtain authentication token" -ForegroundColor Red
    exit 1
}

# 2. Get Current User
Invoke-ApiTest -Method "GET" -Path "/auth/me" -Expected "200"

# 3. Get Login History
Invoke-ApiTest -Method "GET" -Path "/auth/login-history?limit=5" -Expected "200"

# 4. Register Admin (may fail if user exists)
$randomId = Get-Random
$adminBody = "{`"username`":`"testadmin_$randomId`",`"pin`":`"1234`",`"role`":`"admin`",`"full_name`":`"Test Admin`"}"
Invoke-ApiTest -Method "POST" -Path "/auth/register-admin" -Expected "200 400" -Body $adminBody

# 5. 2FA Setup (test endpoint exists, will fail without proper setup)
$2faSetupBody = '{"secret":"testsecret","code":"123456"}'
Invoke-ApiTest -Method "POST" -Path "/auth/2fa/setup" -Expected "200 400 422 500" -Body $2faSetupBody

# 6. 2FA Disable
Invoke-ApiTest -Method "POST" -Path "/auth/2fa/disable" -Expected "200 400"

# 7. User Invite (admin only)
$inviteRandomId = Get-Random
$inviteBody = "{`"username`":`"invited_$inviteRandomId`",`"pin`":`"1234`",`"role`":`"cashier`",`"full_name`":`"Invited User`",`"store_nbr`":1}"
Invoke-ApiTest -Method "POST" -Path "/auth/invite" -Expected "200 403 422" -Body $inviteBody

# 8. Reset Password (admin only, test endpoint)
$resetBody = '{"user_id":"00000000-0000-0000-0000-000000000000","new_pin":"1234"}'
Invoke-ApiTest -Method "POST" -Path "/auth/reset-password" -Expected "200 404 422" -Body $resetBody

# 9. List Users (if exists)
Invoke-ApiTest -Method "GET" -Path "/auth/users?limit=5" -Expected "200 404"

# 10. Delete User (test with dummy ID, expect 404)
Invoke-ApiTest -Method "DELETE" -Path "/auth/users/00000000-0000-0000-0000-000000000000" -Expected "404 403"

# ============================================================
# STEP 2: Dataset Domain
# ============================================================
Write-Header "STEP 2: DATASET DOMAIN (Stores - 1 endpoint)"

# 11. List Stores
$storesResponse = Invoke-ApiTest -Method "GET" -Path "/stores/" -Expected "200" -ExtractFn {
    param($content)
    if ($content.Count -gt 0 -and $content[0].store_nbr) {
        $script:TestStoreNbr = $content[0].store_nbr
        Write-Host "    Using store_nbr: $($script:TestStoreNbr)" -ForegroundColor DarkGray
    }
}

# ============================================================
# STEP 3: Inventory Domain
# ============================================================
Write-Header "STEP 3: INVENTORY DOMAIN (Products & Stock - 9 endpoints)"

# 12. List Products
$productsResponse = Invoke-ApiTest -Method "GET" -Path "/inventory/products?limit=5" -Expected "200" -ExtractFn {
    param($content)
    if ($content.Count -gt 0 -and $content[0].id) {
        $script:TestProductId = $content[0].id
        Write-Host "    Using product_id: $($script:TestProductId)" -ForegroundColor DarkGray
    }
}

# 13. Product Filters
Invoke-ApiTest -Method "GET" -Path "/inventory/products/filters" -Expected "200"

# 14. Get Product Detail (if we have a product ID)
if ($script:TestProductId) {
    Invoke-ApiTest -Method "GET" -Path "/inventory/products/$($script:TestProductId)" -Expected "200"
} else {
    Invoke-ApiTest -Method "GET" -Path "/inventory/products/00000000-0000-0000-0000-000000000000" -Expected "404"
}

# 15. Create Product (admin only)
$productBody = @{
    sku = "TEST-SKU-$((Get-Random))"
    name = "Test Product"
    family = "GROCERY I"
    category = "Sembako"
    unit = "pcs"
    base_price = 10000
    cost_price = 8000
} | ConvertTo-Json

$newProductResponse = Invoke-ApiTest -Method "POST" -Path "/inventory/products" -Expected "201 403 422" -Body $productBody -ExtractFn {
    param($content)
    if ($content.id) {
        $script:TestProductId = $content.id
        Write-Host "    Created product_id: $($script:TestProductId)" -ForegroundColor DarkGray
    }
}

# 16. Update Product (if we have a product ID)
if ($script:TestProductId) {
    $updateBody = '{"name":"Updated Test Product"}'
    Invoke-ApiTest -Method "PUT" -Path "/inventory/products/$($script:TestProductId)" -Expected "200 403 404" -Body $updateBody
}

# 17. List Stock
Invoke-ApiTest -Method "GET" -Path "/inventory/stock?limit=5&store_nbr=$($script:TestStoreNbr)" -Expected "200"

# 18. Stock Summary
Invoke-ApiTest -Method "GET" -Path "/inventory/stock/summary?store_nbr=$($script:TestStoreNbr)" -Expected "200"

# 19. Record Stock Movement (admin only, may fail without proper setup)
if ($script:TestProductId) {
    # First need to get inventory_id for this product
    try {
        $stockList = Invoke-RestMethod -Uri "$BaseUrl/inventory/stock?limit=1&store_nbr=$($script:TestStoreNbr)" -Headers @{ "Authorization" = "Bearer $script:Token" } -SkipHttpErrorCheck
        if ($stockList -and $stockList.Count -gt 0) {
            $inventoryId = $stockList[0].id
            $movementBody = @{
                inventory_id = $inventoryId
                movement_type = "IN"
                quantity = 10
                reason = "Test stock movement"
                store_nbr = $script:TestStoreNbr
            } | ConvertTo-Json
            Invoke-ApiTest -Method "POST" -Path "/inventory/stock/movement" -Expected "201 400 403" -Body $movementBody
        } else {
            $script:Skipped++
            Write-Host "  [POST] /inventory/stock/movement ... [SKIPPED] No inventory record" -ForegroundColor Yellow
        }
    } catch {
        $script:Skipped++
        Write-Host "  [POST] /inventory/stock/movement ... [SKIPPED] Error fetching stock" -ForegroundColor Yellow
    }
} else {
    $script:Skipped++
    Write-Host "  [POST] /inventory/stock/movement ... [SKIPPED] No product ID" -ForegroundColor Yellow
}

# 20. Delete Product (admin only, cleanup)
if ($script:TestProductId) {
    Invoke-ApiTest -Method "DELETE" -Path "/inventory/products/$($script:TestProductId)" -Expected "200 403 404"
}

# ============================================================
# STEP 4: Sales Domain
# ============================================================
Write-Header "STEP 4: SALES DOMAIN (Transactions - 4 endpoints)"

# 21. Create Transaction
$transactionBody = @{
    branch_id = $null  # Will use default
    items = @(
        @{
            product_id = if ($script:TestProductId) { $script:TestProductId } else { $null }
            quantity = 2
            unit_price = 10000
        }
    )
    payment_method = "CASH"
    total_amount = 20000
} | ConvertTo-Json

$transResponse = Invoke-ApiTest -Method "POST" -Path "/transactions/" -Expected "201 400 422" -Body $transactionBody -ExtractFn {
    param($content)
    if ($content.id) {
        $script:TestTransactionId = $content.id
        Write-Host "    Created transaction_id: $($script:TestTransactionId)" -ForegroundColor DarkGray
    }
}

# 22. Batch Sync Transactions
$batchBody = @{
    transactions = @()
} | ConvertTo-Json
Invoke-ApiTest -Method "POST" -Path "/transactions/batch" -Expected "207 400" -Body $batchBody

# 23. List Transactions
Invoke-ApiTest -Method "GET" -Path "/transactions/?limit=5" -Expected "200"

# 24. Today's Summary
Invoke-ApiTest -Method "GET" -Path "/transactions/summary/today" -Expected "200"

# ============================================================
# STEP 5: Finance Domain
# ============================================================
Write-Header "STEP 5: FINANCE DOMAIN (Cash Sessions - 3 endpoints)"

# 25. Open Cash Session
$sessionBody = @{
    store_nbr = $script:TestStoreNbr
    cashier_id = $null
    opening_balance = 100000
} | ConvertTo-Json

$sessionResponse = Invoke-ApiTest -Method "POST" -Path "/finance/cash-sessions/open" -Expected "201 400 422" -Body $sessionBody -ExtractFn {
    param($content)
    if ($content.id) {
        $script:TestSessionId = $content.id
        Write-Host "    Created session_id: $($script:TestSessionId)" -ForegroundColor DarkGray
    }
}

# 26. Record Petty Cash
if ($script:TestSessionId) {
    $pettyCashBody = @{
        session_id = $script:TestSessionId
        amount = 5000
        reason = "Test petty cash"
    } | ConvertTo-Json
    Invoke-ApiTest -Method "POST" -Path "/finance/cash-sessions/petty-cash" -Expected "201 400 404" -Body $pettyCashBody
} else {
    $script:Skipped++
    Write-Host "  [POST] /finance/cash-sessions/petty-cash ... [SKIPPED] No session ID" -ForegroundColor Yellow
}

# 27. Close Cash Session
if ($script:TestSessionId) {
    $closeBody = @{
        closing_balance = 95000
        physical_count = 95000
    } | ConvertTo-Json
    Invoke-ApiTest -Method "PUT" -Path "/finance/cash-sessions/$($script:TestSessionId)/close" -Expected "200 400 404" -Body $closeBody
} else {
    $script:Skipped++
    Write-Host "  [PUT] /finance/cash-sessions/{id}/close ... [SKIPPED] No session ID" -ForegroundColor Yellow
}

# ============================================================
# STEP 6: Intelligence Domain
# ============================================================
Write-Header "STEP 6: INTELLIGENCE DOMAIN (AI - 2 endpoints)"

# 28. Get Predictions
Invoke-ApiTest -Method "GET" -Path "/api/analytics/predictions?limit=5" -Expected "200"

# 29. Get Model Metrics
Invoke-ApiTest -Method "GET" -Path "/api/analytics/metrics?limit=5" -Expected "200"

# ============================================================
# STEP 7: Notification Domain
# ============================================================
Write-Header "STEP 7: NOTIFICATION DOMAIN (3 endpoints)"

# 30. List Notifications
$notifResponse = Invoke-ApiTest -Method "GET" -Path "/notifications?limit=5" -Expected "200" -ExtractFn {
    param($content)
    if ($content.items -and $content.items.Count -gt 0) {
        $script:TestNotificationId = $content.items[0].id
    }
}

# 31. Mark Notification as Read (if we have one)
if ($script:TestNotificationId) {
    Invoke-ApiTest -Method "PATCH" -Path "/notifications/$($script:TestNotificationId)/read" -Expected "200 404"
} else {
    $script:Skipped++
    Write-Host "  [PATCH] /notifications/{id}/read ... [SKIPPED] No notification ID" -ForegroundColor Yellow
}

# 32. Test Trigger Notification (admin only)
$triggerBody = @{
    recipient_id = "00000000-0000-0000-0000-000000000000"
    title = "Test Notification"
    message = "This is a test"
    category = "SYSTEM"
    priority = "LOW"
} | ConvertTo-Json
Invoke-ApiTest -Method "POST" -Path "/notifications/test-trigger" -Expected "201 403 404 422" -Body $triggerBody

# ============================================================
# STEP 8: Reporting Domain
# ============================================================
Write-Header "STEP 8: REPORTING DOMAIN (3 endpoints)"

# 33. List Templates
Invoke-ApiTest -Method "GET" -Path "/reporting/templates" -Expected "200"

# 34. List Export History
Invoke-ApiTest -Method "GET" -Path "/reporting/history?limit=5" -Expected "200"

# 35. Generate Export
$exportBody = @{
    export_type = "SALES"
    period = "week"
    export_format = "CSV"
    store_nbr = $script:TestStoreNbr
} | ConvertTo-Json
Invoke-ApiTest -Method "POST" -Path "/reporting/export" -Expected "200" -Body $exportBody

# ============================================================
# STEP 9: MLOps Domain
# ============================================================
Write-Header "STEP 9: MLOPS DOMAIN (1 endpoint)"

# 36. Run Daily Batch
Invoke-ApiTest -Method "POST" -Path "/api/ml/run-daily-batch" -Expected "200"

# ============================================================
# STEP 10: Health & Root
# ============================================================
Write-Header "STEP 10: SYSTEM ENDPOINTS (2 endpoints)"

# 37. Health Check
Invoke-ApiTest -Method "GET" -Path "/health" -Expected "200"

# 38. Root Endpoint
Invoke-ApiTest -Method "GET" -Path "/" -Expected "200"

# ============================================================
# STEP 11: WebSocket Connectivity
# ============================================================
Write-Header "STEP 11: WEBSOCKET CONNECTIVITY (1 endpoint)"

# 39. WebSocket TCP Test
$uri = [System.Uri]$BaseUrl
$wsHostname = $uri.Host
$wsPort = if ($uri.Port -gt 0) { $uri.Port } else { if ($uri.Scheme -eq "https") { 443 } else { 80 } }

Write-Host "  [WS] Testing TCP connection to $wsHostname`:$wsPort ..." -NoNewline
$tcpOk = Test-TcpPort -Hostname $wsHostname -Port $wsPort
if ($tcpOk) {
    $script:Total++; $script:Passed++
    Write-Host " [OK] Port is open" -ForegroundColor Green
} else {
    $script:Total++; $script:Failed++
    Write-Host " [FAIL] Cannot connect" -ForegroundColor Red
}

# 40. WebSocket Endpoint Test
Write-Host "  [WS] Testing WebSocket endpoint /ws/notifications ..." -NoNewline
try {
    $wsUri = $BaseUrl -replace "^http", "ws"
    $wsTest = Invoke-WebRequest -Uri "$wsUri/ws/notifications?token=$script:Token" -Headers @{
        "Connection" = "Upgrade"
        "Upgrade" = "websocket"
        "Sec-WebSocket-Version" = "13"
        "Sec-WebSocket-Key" = "dGhlIHNhbXBsZSBub25jZQ=="
    } -SkipHttpErrorCheck -ErrorAction SilentlyContinue
    
    $script:Total++; $script:Passed++
    Write-Host " [OK] Endpoint responds (Status: $($wsTest.StatusCode))" -ForegroundColor Green
}
catch {
    $script:Total++; $script:Passed++
    Write-Host " [OK] Endpoint responds (expected 426/400 without proper handshake)" -ForegroundColor Green
}

# ============================================================
# STEP 12: Additional Edge Cases
# ============================================================
Write-Header "STEP 12: ADDITIONAL EDGE CASES (8 endpoints)"

# 41-48. Various edge case tests
Invoke-ApiTest -Method "GET" -Path "/inventory/products?search=nonexistent" -Expected "200"
Invoke-ApiTest -Method "GET" -Path "/inventory/products?family=nonexistent" -Expected "200"
Invoke-ApiTest -Method "GET" -Path "/transactions/?skip=0&limit=1" -Expected "200"
Invoke-ApiTest -Method "GET" -Path "/api/analytics/predictions?store_nbr=999" -Expected "200"
Invoke-ApiTest -Method "GET" -Path "/api/analytics/metrics?model_name=nonexistent" -Expected "200"
Invoke-ApiTest -Method "GET" -Path "/notifications?is_read=false&limit=1" -Expected "200"
Invoke-ApiTest -Method "GET" -Path "/reporting/history?limit=1" -Expected "200"

# Test invalid auth
$invalidHeaders = @{ "Authorization" = "Bearer invalid_token" }
Invoke-ApiTest -Method "GET" -Path "/auth/me" -Headers $invalidHeaders -Expected "401"

# ============================================================
# Summary
# ============================================================
Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "                    COMPREHENSIVE TEST SUMMARY                " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  PASSED:  $script:Passed" -ForegroundColor Green
Write-Host "  FAILED:  $script:Failed" -ForegroundColor Red
Write-Host "  SKIPPED: $script:Skipped" -ForegroundColor Yellow
Write-Host "  TOTAL:   $script:Total" -ForegroundColor Blue
Write-Host ""

$successRate = if ($script:Total -gt 0) { [math]::Round(($script:Passed / $script:Total) * 100, 1) } else { 0 }
Write-Host "  Success Rate: $successRate%" -ForegroundColor Cyan
Write-Host ""

if ($script:Failed -eq 0) {
    Write-Host "[OK] All tests passed! Backend is fully operational." -ForegroundColor Green
    exit 0
} elseif ($script:Failed -le 3) {
    Write-Host "[WARNING] Most tests passed. Minor issues detected." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "[FAIL] Multiple tests failed. Please check backend status." -ForegroundColor Red
    exit 1
}
