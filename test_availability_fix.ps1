# Test script to verify Food Availability fix
$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Verifying Food Availability Rules and Acceptance Behavior" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

function Report-Step($name, $passed, $info) {
    if ($passed) {
        Write-Host "[PASS] $name - $info" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $name - $info" -ForegroundColor Red
        exit 1
    }
}

$timestamp = Get-Date -Format "yyyyMMddHHmmss"

# 1. Register Supplier
$supEmail = "supplier_avail_$timestamp@test.com"
$supReg = @{
    name = "Bistro Chef"
    email = $supEmail
    password = "password123"
    confirmPassword = "password123"
    role = "supplier"
    organizationName = "Bella Bistro"
    phone = "+1 555-0199"
    location = "Midtown"
    accountType = "Restaurant"
} | ConvertTo-Json

$supRes = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $supReg -ContentType "application/json"
$supToken = $supRes.token
$supId = $supRes.user.id
Report-Step "Supplier Registration" ($null -ne $supToken) "Supplier ID: $supId"

# 2. Register Requester
$reqEmail = "requester_avail_$timestamp@test.com"
$reqReg = @{
    name = "Marcus Shelter"
    email = $reqEmail
    password = "password123"
    confirmPassword = "password123"
    role = "requester"
    organizationName = "Midtown Shelter"
    phone = "+1 555-0288"
    location = "Midtown"
    accountType = "Shelter"
} | ConvertTo-Json

$reqRes = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $reqReg -ContentType "application/json"
$reqToken = $reqRes.token
$reqId = $reqRes.user.id
Report-Step "Requester Registration" ($null -ne $reqToken) "Requester ID: $reqId"

# 3. Supplier Posts Donation (40 Meals)
$donBody = @{
    foodName = "Fresh Lasagna Trays"
    category = "Cooked Food"
    dietaryTag = "Vegetarian"
    donorType = "Restaurant"
    quantity = 40
    unit = "Meals"
    donorName = "Bella Bistro"
    location = "Midtown"
    contactPhone = "+1 555-0199"
    shelfLifeHours = 10
    expiryTime = (Get-Date).AddHours(10).ToString("o")
    description = "Hot trays of vegetarian lasagna"
} | ConvertTo-Json

$donRes = Invoke-RestMethod -Uri "http://localhost:5001/api/donations" -Method Post -Headers @{ Authorization = "Bearer $supToken" } -Body $donBody -ContentType "application/json"
$donId = $donRes.data._id
Report-Step "Post Food Donation" ($donRes.success -and $donRes.data.availableQuantity -eq 40) "Donation ID: $donId"

# 4. Check Donation Appears on Available Food
$avail1 = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/available" -Method Get
$found1 = ($avail1.data | Where-Object { $_._id -eq $donId })
Report-Step "Available Food Initial Visibility" ($null -ne $found1) "Found on Available Food page with status: $($found1.status)"

# 5. Requester Submits Request (40 Meals)
$reqData = @{
    donationId = $donId
    quantity = 40
    unit = "Meals"
    organizationName = "Midtown Shelter"
    location = "Midtown"
    peopleCount = 40
    neededBy = (Get-Date).AddHours(4).ToString("o")
    description = "For evening dinner"
    contactPhone = "+1 555-0288"
} | ConvertTo-Json

$submitRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Post -Headers @{ Authorization = "Bearer $reqToken" } -Body $reqData -ContentType "application/json"
$requestId = $submitRes.data._id
Report-Step "Submit Request for Donation" ($submitRes.success -and $submitRes.data.status -eq "Pending") "Request ID: $requestId (Pending)"

# 6. Requirement 1: While Request is Pending, Donation REMAINS on Available Food
$avail2 = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/available" -Method Get
$found2 = ($avail2.data | Where-Object { $_._id -eq $donId })
Report-Step "Requirement 1: Donation Remains Visible While Request is Pending" ($null -ne $found2) "Status: $($found2.status)"

# 7. Supplier Accepts the Request
$acceptPayload = @{ pickupInstructions = "Pickup at side kitchen door by 6 PM" } | ConvertTo-Json
$acceptRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/$requestId/accept" -Method Post -Headers @{ Authorization = "Bearer $supToken" } -Body $acceptPayload -ContentType "application/json"
Report-Step "Supplier Accepts Request" ($acceptRes.success -and $acceptRes.data.status -eq "Accepted") "Request Status: $($acceptRes.data.status)"

# 8. Requirement 2 & 3: Accepted Donation IMMEDIATELY stops appearing on Available Food page
$avail3 = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/available" -Method Get
$found3 = ($avail3.data | Where-Object { $_._id -eq $donId })
Report-Step "Requirement 2 & 3: Donation DISAPPEARS from Available Food Page" ($null -eq $found3) "Donation correctly omitted from /api/donations/available"

# 9. Verify Backend Status is 'Reserved' and availableQuantity is 0
$donDirect = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/$donId" -Method Get
$isReserved = ($donDirect.data.status -eq "Reserved" -and $donDirect.data.availableQuantity -eq 0)
Report-Step "Backend Status Updated to Reserved" $isReserved "Status: $($donDirect.data.status), Available Quantity: $($donDirect.data.availableQuantity)"

# 10. Requirement 5: Accepted Donation CANNOT be requested again through API (Bypassing Frontend)
$attemptBlocked = $false
try {
    $bypassBody = @{
        donationId = $donId
        quantity = 10
        unit = "Meals"
        organizationName = "Sneaky Shelter"
        location = "Downtown"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Post -Headers @{ Authorization = "Bearer $reqToken" } -Body $bypassBody -ContentType "application/json"
} catch {
    $attemptBlocked = ($_.Exception.Response.StatusCode.value__ -eq 400)
}
Report-Step "Requirement 5: Accepted Donation CANNOT be Requested Again via API" $attemptBlocked "Backend correctly returned HTTP 400 Bad Request"

# 11. Requirement 4: Accepted Request remains visible in history
$historyRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Get -Headers @{ Authorization = "Bearer $reqToken" }
$foundInHistory = ($historyRes.data | Where-Object { $_._id -eq $requestId -and $_.status -eq "Accepted" })
Report-Step "Requirement 4: Request Remains Visible in History" ($null -ne $foundInHistory) "Request Status in DB: $($foundInHistory.status)"

# 12. Requirement 7: Rejection does NOT mark donation unavailable
$donBody2 = @{
    foodName = "Artisan Baguettes"
    category = "Bakery"
    dietaryTag = "Vegetarian"
    donorType = "Bakery"
    quantity = 25
    unit = "Items"
    donorName = "Bella Bistro"
    location = "Midtown"
    contactPhone = "+1 555-0199"
    shelfLifeHours = 12
    expiryTime = (Get-Date).AddHours(12).ToString("o")
} | ConvertTo-Json

$donRes2 = Invoke-RestMethod -Uri "http://localhost:5001/api/donations" -Method Post -Headers @{ Authorization = "Bearer $supToken" } -Body $donBody2 -ContentType "application/json"
$donId2 = $donRes2.data._id

# Requester requests it
$reqData2 = @{
    donationId = $donId2
    quantity = 25
    unit = "Items"
    organizationName = "Midtown Shelter"
    location = "Midtown"
} | ConvertTo-Json
$submitRes2 = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Post -Headers @{ Authorization = "Bearer $reqToken" } -Body $reqData2 -ContentType "application/json"
$requestId2 = $submitRes2.data._id

# Supplier REJECTS the request
$rejectBody = @{ rejectionReason = "Capacity constraint" } | ConvertTo-Json
$rejectRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/$requestId2/reject" -Method Post -Headers @{ Authorization = "Bearer $supToken" } -Body $rejectBody -ContentType "application/json"

# Verify donation 2 is STILL on Available Food page
$avail4 = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/available" -Method Get
$found4 = ($avail4.data | Where-Object { $_._id -eq $donId2 })
Report-Step "Requirement 7: Rejection Keeps Donation Available" ($null -ne $found4 -and $found4.status -eq "Available") "Donation 2 still available on Browse Food page"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "ALL AVAILABILITY & ACCEPTANCE TESTS PASSED (12 / 12)!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
