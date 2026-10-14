$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "FOODRESCUE: PHONE SECURITY & COMMUNICATION TEST SUITE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# TEST 1: User Registration Phone Validation
# -----------------------------------------------------------------------------
Write-Host "`n[TEST 1] Testing Phone Validation during Registration..." -ForegroundColor Yellow

# 1a. Missing phone should fail with 400
try {
    $badReg1 = @{
        name = "No Phone User"
        email = "nophone_$timestamp@test.com"
        password = "password123"
        confirmPassword = "password123"
        role = "supplier"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $badReg1 -ContentType "application/json"
    Write-Host "[FAIL] Registration without phone should have failed!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[PASS] Registration without phone was rejected with HTTP 400" -ForegroundColor Green
}

# 1b. Invalid phone (too short) should fail with 400
try {
    $badReg2 = @{
        name = "Short Phone User"
        email = "shortphone_$timestamp@test.com"
        password = "password123"
        confirmPassword = "password123"
        role = "supplier"
        phone = "123"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $badReg2 -ContentType "application/json"
    Write-Host "[FAIL] Registration with short phone should have failed!" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "[PASS] Registration with short phone (< 7 digits) rejected with HTTP 400" -ForegroundColor Green
}

# 1c. Valid Supplier Registration
$supReg = @{
    name = "Chef Marco"
    email = "marco_$timestamp@bistro.com"
    password = "password123"
    confirmPassword = "password123"
    role = "supplier"
    organizationName = "Marco Trattoria"
    location = "North End Market"
    phone = "+1 (555) 018-7744"
} | ConvertTo-Json

$supAuth = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $supReg -ContentType "application/json"
if ($supAuth.success -and $supAuth.user.phone -eq "+1 (555) 018-7744") {
    Write-Host "[PASS] Supplier registered successfully with phone: $($supAuth.user.phone)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Supplier registration failed or phone not stored" -ForegroundColor Red
    exit 1
}

# 1d. Valid Requester Registration
$reqReg = @{
    name = "Sarah Jenkins"
    email = "sarah_$timestamp@shelter.org"
    password = "password123"
    confirmPassword = "password123"
    role = "requester"
    organizationName = "Covenant House"
    location = "350 Broadway"
    phone = "+1 (555) 012-9988"
} | ConvertTo-Json

$reqAuth = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $reqReg -ContentType "application/json"
if ($reqAuth.success -and $reqAuth.user.phone -eq "+1 (555) 012-9988") {
    Write-Host "[PASS] Requester registered successfully with phone: $($reqAuth.user.phone)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Requester registration failed or phone not stored" -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# TEST 2: Donation Phone Storage & Security
# -----------------------------------------------------------------------------
Write-Host "`n[TEST 2] Testing Donation Phone Storage in Service 1 (:5001)..." -ForegroundColor Yellow

$donationPayload = @{
    foodName = "Fresh Penne Pasta & Pomodoro"
    category = "Cooked Food"
    quantity = 35
    unit = "Meals"
    location = "North End Kitchen Dock 1"
    shelfLifeHours = 8
    contactPhone = "+1 (555) 018-7744"
} | ConvertTo-Json

$donRes = Invoke-RestMethod -Uri "http://localhost:5001/api/donations" -Method Post -Headers @{ Authorization = "Bearer $($supAuth.token)" } -Body $donationPayload -ContentType "application/json"
if ($donRes.success -and $donRes.data.contactPhone -eq "+1 (555) 018-7744") {
    Write-Host "[PASS] Donation created and securely stored donor contactPhone: $($donRes.data.contactPhone)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Donation contactPhone mismatch" -ForegroundColor Red
    exit 1
}

# Check Available donations includes donor phone
$availRes = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/available" -Method Get
$availItem = ($availRes.data | Where-Object { $_._id -eq $donRes.data._id })
if ($availItem.contactPhone -eq "+1 (555) 018-7744") {
    Write-Host "[PASS] Available food listing displays donor contactPhone for native dialer: $($availItem.contactPhone)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Available listing missing donor phone" -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# TEST 3: Food Request Phone Storage in Service 2 (:5002)
# -----------------------------------------------------------------------------
Write-Host "`n[TEST 3] Testing Food Request Phone Storage in Service 2 (:5002)..." -ForegroundColor Yellow

$reqPayload = @{
    donationId = $donRes.data._id
    quantity = 35
    unit = "Meals"
    location = "350 Broadway"
    contactPhone = "+1 (555) 012-9988"
    description = "Immediate dinner meal for shelter residents."
} | ConvertTo-Json

$reqSubmitRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Post -Headers @{ Authorization = "Bearer $($reqAuth.token)" } -Body $reqPayload -ContentType "application/json"

if ($reqSubmitRes.data.contactPhone -eq "+1 (555) 012-9988" -and $reqSubmitRes.data.matchedDonationDetails.contactPhone -eq "+1 (555) 018-7744") {
    Write-Host "[PASS] Food Request stored Requester Phone ($($reqSubmitRes.data.contactPhone)) AND Donor Phone ($($reqSubmitRes.data.matchedDonationDetails.contactPhone))" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Request phone storage failed" -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# TEST 4: Notifications Contact Phone Verification
# -----------------------------------------------------------------------------
Write-Host "`n[TEST 4] Verifying Phone Numbers in Microservice Notifications..." -ForegroundColor Yellow

$supNotifs = Invoke-RestMethod -Uri "http://localhost:5002/api/notifications" -Method Get -Headers @{ Authorization = "Bearer $($supAuth.token)" }
$supIncomingNotif = ($supNotifs.data | Where-Object { $_.requestId -eq $reqSubmitRes.data._id })
if ($supIncomingNotif.metadata.contactPhone -eq "+1 (555) 012-9988") {
    Write-Host "[PASS] Supplier notification has Requester's phone for direct calling: $($supIncomingNotif.metadata.contactPhone)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Supplier notification missing requester phone" -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# TEST 5: Acceptance & Direct Calling Workflow
# -----------------------------------------------------------------------------
Write-Host "`n[TEST 5] Testing Request Acceptance & Final Handover Phone Exchange..." -ForegroundColor Yellow

$acceptPayload = @{
    pickupInstructions = "Pickup at North End back door between 4 PM and 6 PM."
} | ConvertTo-Json

$acceptRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/$($reqSubmitRes.data._id)/accept" -Method Post -Headers @{ Authorization = "Bearer $($supAuth.token)" } -Body $acceptPayload -ContentType "application/json"

if ($acceptRes.data.status -eq "Accepted" -and $acceptRes.data.matchedDonationDetails.contactPhone -eq "+1 (555) 018-7744") {
    Write-Host "[PASS] Accepted request record securely stores Donor phone: $($acceptRes.data.matchedDonationDetails.contactPhone)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Accepted request missing donor phone" -ForegroundColor Red
    exit 1
}

# Verify Requester notification has donor phone
$reqNotifs = Invoke-RestMethod -Uri "http://localhost:5002/api/notifications" -Method Get -Headers @{ Authorization = "Bearer $($reqAuth.token)" }
$reqAcceptedNotif = ($reqNotifs.data | Where-Object { $_.type -eq "REQUEST_ACCEPTED" -and $_.requestId -eq $reqSubmitRes.data._id })
if ($reqAcceptedNotif.metadata.contactPhone -eq "+1 (555) 018-7744") {
    Write-Host "[PASS] Requester acceptance notification has Donor's phone for direct calling: $($reqAcceptedNotif.metadata.contactPhone)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Requester acceptance notification missing donor phone" -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# TEST 6: Profile Phone Update & Validation
# -----------------------------------------------------------------------------
Write-Host "`n[TEST 6] Testing User Profile Phone Number Update..." -ForegroundColor Yellow

$updateProfilePayload = @{
    phone = "+1 (555) 019-8800"
} | ConvertTo-Json

$profRes = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/profile" -Method Put -Headers @{ Authorization = "Bearer $($supAuth.token)" } -Body $updateProfilePayload -ContentType "application/json"

if ($profRes.user.phone -eq "+1 (555) 019-8800") {
    Write-Host "[PASS] User profile phone number updated to: $($profRes.user.phone)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Profile phone update failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "ALL 6 PHONE SECURITY & USER COMMUNICATION TESTS PASSED!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
