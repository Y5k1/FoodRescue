$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'

# 1. Register Supplier with phone
$supReg = @{
    name = "Chef Tony"
    email = "sup_dial_$timestamp@test.com"
    password = "password123"
    confirmPassword = "password123"
    role = "supplier"
    organizationName = "Tony Bistro"
    phone = "+1 (555) 019-9922"
} | ConvertTo-Json

$sup = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $supReg -ContentType "application/json"

# 2. Register Requester with phone
$reqReg = @{
    name = "Sister Sarah"
    email = "req_dial_$timestamp@test.com"
    password = "password123"
    confirmPassword = "password123"
    role = "requester"
    organizationName = "Hope Shelter"
    phone = "+1 (555) 012-3344"
} | ConvertTo-Json

$req = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $reqReg -ContentType "application/json"

# 3. Post Donation with contactPhone
$don = @{
    foodName = "Gourmet Vegetable Soup"
    category = "Cooked Food"
    quantity = 20
    unit = "Meals"
    donorName = "Tony Bistro"
    location = "Downtown"
    contactPhone = "+1 (555) 019-9922"
    shelfLifeHours = 6
} | ConvertTo-Json

$dRes = Invoke-RestMethod -Uri "http://localhost:5001/api/donations" -Method Post -Headers @{ Authorization = "Bearer $($sup.token)" } -Body $don -ContentType "application/json"

# 4. Check Available Donations includes contactPhone
$avail = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/available" -Method Get
$availItem = ($avail.data | Where-Object { $_._id -eq $dRes.data._id })
if ($availItem.contactPhone -eq "+1 (555) 019-9922") {
    Write-Host "[PASS] Available Donation includes contactPhone for Native Dialing: $($availItem.contactPhone)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Missing contactPhone in donation" -ForegroundColor Red
    exit 1
}

# 5. Submit Request with contactPhone
$requestBody = @{
    donationId = $dRes.data._id
    quantity = 20
    unit = "Meals"
    location = "Downtown"
    contactPhone = "+1 (555) 012-3344"
} | ConvertTo-Json

$rRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Post -Headers @{ Authorization = "Bearer $($req.token)" } -Body $requestBody -ContentType "application/json"
if ($rRes.data.contactPhone -eq "+1 (555) 012-3344" -and $rRes.data.matchedDonationDetails.contactPhone -eq "+1 (555) 019-9922") {
    Write-Host "[PASS] FoodRequest has Requester Phone ($($rRes.data.contactPhone)) & Donor Phone ($($rRes.data.matchedDonationDetails.contactPhone))" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Phone fields not set properly in request" -ForegroundColor Red
    exit 1
}

# 6. Supplier Accepts Request
$acceptRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/$($rRes.data._id)/accept" -Method Post -Headers @{ Authorization = "Bearer $($sup.token)" } -Body (@{ pickupInstructions = "Ready at counter" } | ConvertTo-Json) -ContentType "application/json"
if ($acceptRes.data.status -eq "Accepted" -and $acceptRes.data.matchedDonationDetails.contactPhone -eq "+1 (555) 019-9922") {
    Write-Host "[PASS] Accepted request preserves donor phone ($($acceptRes.data.matchedDonationDetails.contactPhone)) for Requester calling" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Accepted request missing donor phone" -ForegroundColor Red
    exit 1
}

Write-Host "`nALL NATIVE DIALING DATA & API TESTS PASSED!" -ForegroundColor Cyan
