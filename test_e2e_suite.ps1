# FoodRescue Comprehensive End-to-End Test Suite
# Tests Service 1 (Donations :5001) and Service 2 (Requests :5002)

$ErrorActionPreference = "Stop"
$testResults = @()

function Report-Test {
    param($Name, $Passed, $Details)
    $obj = [PSCustomObject]@{
        Test = $Name
        Status = if ($Passed) { "PASS" } else { "FAIL" }
        Details = $Details
    }
    $global:testResults += $obj
    Write-Host ("[{0}] {1} - {2}" -f $obj.Status, $obj.Test, $obj.Details)
}

Write-Host "=================================================="
Write-Host "Starting FoodRescue Microservices Test Suite"
Write-Host "=================================================="

# 1. Health Checks
try {
    $h1 = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method Get
    $p1 = ($h1.status -eq "healthy" -and $h1.database -eq "connected")
    Report-Test "Service 1 Health Check" $p1 "Port 5001 DB: $($h1.database)"
} catch {
    Report-Test "Service 1 Health Check" $false $_.Exception.Message
}

try {
    $h2 = Invoke-RestMethod -Uri "http://localhost:5002/health" -Method Get
    $p2 = ($h2.status -eq "healthy" -and $h2.database -eq "connected")
    Report-Test "Service 2 Health Check" $p2 "Port 5002 DB: $($h2.database)"
} catch {
    Report-Test "Service 2 Health Check" $false $_.Exception.Message
}

# 2. Authentication: Supplier Registration
$supplierEmail = "test_supplier_" + (Get-Random) + "@bakery.com"
$supplierToken = ""
try {
    $regBody = @{
        name = "Artisan Baker"
        email = $supplierEmail
        password = "securePassword123"
        confirmPassword = "securePassword123"
        role = "supplier"
        organizationName = "Artisan Sourdough Co"
        phone = "+1 555-0144"
        location = "Baker Street District"
        accountType = "Bakery"
    } | ConvertTo-Json

    $regRes = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $regBody -ContentType "application/json"
    $supplierToken = $regRes.token
    Report-Test "Supplier Registration" ($regRes.success -and $regRes.token) "Registered User ID: $($regRes.user.id)"
} catch {
    Report-Test "Supplier Registration" $false $_.Exception.Message
}

# 3. Authentication: Duplicate Email Detection
try {
    $dupRes = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $regBody -ContentType "application/json"
    Report-Test "Duplicate Email Detection" $false "Should have rejected duplicate email"
} catch {
    $is409 = $_.Exception.Response.StatusCode.value__ -eq 409
    Report-Test "Duplicate Email Detection" $is409 "Correctly rejected duplicate with HTTP 409"
}

# 4. Authentication: Login Success & Failure
try {
    $loginBody = @{ email = $supplierEmail; password = "securePassword123" } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Report-Test "Login Success" ($loginRes.success -and $loginRes.token) "Authenticated token issued"
} catch {
    Report-Test "Login Success" $false $_.Exception.Message
}

try {
    $failBody = @{ email = $supplierEmail; password = "wrong_password" } | ConvertTo-Json
    $failRes = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method Post -Body $failBody -ContentType "application/json"
    Report-Test "Invalid Credentials Rejection" $false "Should have failed"
} catch {
    $is401 = $_.Exception.Response.StatusCode.value__ -eq 401
    Report-Test "Invalid Credentials Rejection" $is401 "Correctly rejected bad password with HTTP 401"
}

# 5. Create Donation
$donId = ""
try {
    $donBody = @{
        foodName = "Freshly Baked Sourdough Loaves"
        category = "Bakery"
        dietaryTag = "Vegetarian"
        donorType = "Bakery"
        quantity = 45
        unit = "Items"
        donorName = "Artisan Sourdough Co"
        location = "Baker Street District"
        contactPhone = "+1 555-0144"
        shelfLifeHours = 8
        expiryTime = (Get-Date).AddHours(8).ToString("o")
    } | ConvertTo-Json

    $donRes = Invoke-RestMethod -Uri "http://localhost:5001/api/donations" -Method Post -Headers @{ Authorization = "Bearer $supplierToken" } -Body $donBody -ContentType "application/json"
    $donId = $donRes.data._id
    Report-Test "Create Donation (Service 1)" ($donRes.success -and $donId) "Created donation ID: $donId"
} catch {
    Report-Test "Create Donation (Service 1)" $false $_.Exception.Message
}

# 6. Read Donations & Filter by Status
try {
    $listRes = Invoke-RestMethod -Uri "http://localhost:5001/api/donations?status=Available" -Method Get
    $found = ($listRes.data | Where-Object { $_._id -eq $donId })
    Report-Test "List Available Donations" ($null -ne $found) "Found created donation in Available list"
} catch {
    Report-Test "List Available Donations" $false $_.Exception.Message
}

# 7. Create Food Request (Service 2)
$reqId = ""
try {
    $reqBody = @{
        requesterName = "Community Pantry Volunteer"
        organizationName = "Baker District Soup Kitchen"
        foodCategory = "Bakery"
        quantity = 40
        unit = "Items"
        location = "Baker Street District"
        peopleCount = 40
        urgencyLevel = "Medium"
        dietPreference = "Vegetarian"
        neededBy = (Get-Date).AddHours(6).ToString("o")
        contactPhone = "+1 555-0199"
    } | ConvertTo-Json

    $reqRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Post -Body $reqBody -ContentType "application/json"
    $reqId = $reqRes.data._id
    Report-Test "Create Food Request (Service 2)" ($reqRes.success -and $reqId) "Created request ID: $reqId"
} catch {
    Report-Test "Create Food Request (Service 2)" $false $_.Exception.Message
}

# 8. Algorithmic Match Evaluation (Service 2 -> Service 1 via Axios)
try {
    $matchRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/$reqId/matches" -Method Get
    $topMatch = $matchRes.matches | Where-Object { $_._id -eq $donId }
    $score = if ($topMatch) { $topMatch.compatibilityScore } else { 0 }
    Report-Test "Algorithmic Proximity Matching" ($null -ne $topMatch) "Found donation with Compatibility: $score%"
} catch {
    Report-Test "Algorithmic Proximity Matching" $false $_.Exception.Message
}

# 9. Atomic Reservation Workflow (Service 2 -> Service 1 REST call)
try {
    $acceptBody = @{ donationId = $donId } | ConvertTo-Json
    $acceptRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/$reqId/accept-match" -Method Post -Body $acceptBody -ContentType "application/json"
    $isMatched = ($acceptRes.data.status -eq "Matched")

    # Verify status in Service 1
    $donVerify = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/$donId" -Method Get
    $isReserved = ($donVerify.data.status -eq "Reserved")

    Report-Test "Atomic Reservation & Cross-Service Lock" ($isMatched -and $isReserved) "Request: $($acceptRes.data.status), Donation: $($donVerify.data.status)"
} catch {
    Report-Test "Atomic Reservation & Cross-Service Lock" $false $_.Exception.Message
}

# 10. Prevention of Race Condition / Double Reservation
try {
    $dupReqBody = @{
        requesterName = "Another Shelter"
        organizationName = "Downtown Rescue Mission"
        foodCategory = "Bakery"
        quantity = 20
        unit = "Items"
        location = "Baker Street District"
        peopleCount = 20
        neededBy = (Get-Date).AddHours(6).ToString("o")
    } | ConvertTo-Json
    $dupReq = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Post -Body $dupReqBody -ContentType "application/json"
    $dupReqId = $dupReq.data._id

    $conflictRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/$dupReqId/accept-match" -Method Post -Body (@{ donationId = $donId } | ConvertTo-Json) -ContentType "application/json"
    Report-Test "Double Reservation Prevention" $false "Should have rejected reservation of already-reserved donation"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Report-Test "Double Reservation Prevention" ($status -eq 409 -or $status -eq 400) "Successfully prevented conflict with HTTP $status"
}

# 11. Fulfill Workflow
try {
    $fulfillRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/$reqId/fulfill" -Method Post
    $donFinal = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/$donId" -Method Get
    $pass = ($fulfillRes.data.status -eq "Fulfilled" -and $donFinal.data.status -eq "Collected")
    Report-Test "Fulfillment & Donation Collection Sync" $pass "Request: $($fulfillRes.data.status), Donation: $($donFinal.data.status)"
} catch {
    Report-Test "Fulfillment & Donation Collection Sync" $false $_.Exception.Message
}

# 12. Trigger Auto-Match
try {
    $autoRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/auto-match" -Method Post
    Report-Test "Trigger Auto-Match Execution" ($autoRes.success) "Result message: $($autoRes.message)"
} catch {
    Report-Test "Trigger Auto-Match Execution" $false $_.Exception.Message
}

Write-Host "=================================================="
$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$totalCount = $testResults.Count
Write-Host "Test Suite Finished: $passCount / $totalCount Passed"
Write-Host "=================================================="
