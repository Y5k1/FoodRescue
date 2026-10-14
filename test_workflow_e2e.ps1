# Comprehensive Test Suite for FoodRescue Workflow & UI Changes
# Validates Section 9 Acceptance Criteria

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

Write-Host "================================================================"
Write-Host "Running FoodRescue Workflow & Role-Based Access Test Suite"
Write-Host "================================================================"

# 1. Health Checks
try {
    $h1 = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method Get
    $h2 = Invoke-RestMethod -Uri "http://localhost:5002/health" -Method Get
    Report-Test "Microservices Independent Health" ($h1.status -eq "healthy" -and $h2.status -eq "healthy") "Port 5001 & 5002 DBs connected"
} catch {
    Report-Test "Microservices Independent Health" $false $_.Exception.Message
}

# 2. Register Supplier 1
$sup1Email = "supplier_" + (Get-Random) + "@bistro.com"
$sup1Token = ""
$sup1Id = ""
try {
    $regSup1 = @{
        name = "Chef Marco"
        email = $sup1Email
        password = "password123"
        confirmPassword = "password123"
        role = "supplier"
        organizationName = "Marco Bistro"
        location = "Harbor District"
        phone = "+1 555-0111"
        accountType = "Restaurant"
    } | ConvertTo-Json

    $supRes = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $regSup1 -ContentType "application/json"
    $sup1Token = $supRes.token
    $sup1Id = $supRes.user.id
    Report-Test "Supplier 1 Registration" ($supRes.success -and $sup1Token) "Supplier ID: $sup1Id"
} catch {
    Report-Test "Supplier 1 Registration" $false $_.Exception.Message
}

# 3. Register Supplier 2 (for authorization isolation tests)
$sup2Email = "supplier2_" + (Get-Random) + "@bakery.com"
$sup2Token = ""
$sup2Id = ""
try {
    $regSup2 = @{
        name = "Baker Sarah"
        email = $sup2Email
        password = "password123"
        confirmPassword = "password123"
        role = "supplier"
        organizationName = "Sarah Pastries"
        location = "Uptown"
        phone = "+1 555-0333"
        accountType = "Bakery"
    } | ConvertTo-Json

    $sup2Res = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $regSup2 -ContentType "application/json"
    $sup2Token = $sup2Res.token
    $sup2Id = $sup2Res.user.id
    Report-Test "Supplier 2 Registration" ($sup2Res.success -and $sup2Token) "Supplier 2 ID: $sup2Id"
} catch {
    Report-Test "Supplier 2 Registration" $false $_.Exception.Message
}

# 4. Register Requester 1
$req1Email = "requester1_" + (Get-Random) + "@shelter.org"
$req1Token = ""
$req1Id = ""
try {
    $regReq1 = @{
        name = "Elena Fisher"
        email = $req1Email
        password = "password123"
        confirmPassword = "password123"
        role = "requester"
        organizationName = "Downtown Community Shelter"
        location = "Harbor District"
        phone = "+1 555-0222"
        accountType = "Shelter"
    } | ConvertTo-Json

    $req1Res = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $regReq1 -ContentType "application/json"
    $req1Token = $req1Res.token
    $req1Id = $req1Res.user.id
    Report-Test "Requester 1 Registration" ($req1Res.success -and $req1Token) "Requester 1 ID: $req1Id"
} catch {
    Report-Test "Requester 1 Registration" $false $_.Exception.Message
}

# 5. Register Requester 2 (for private request isolation tests)
$req2Email = "requester2_" + (Get-Random) + "@pantry.org"
$req2Token = ""
$req2Id = ""
try {
    $regReq2 = @{
        name = "David Miller"
        email = $req2Email
        password = "password123"
        confirmPassword = "password123"
        role = "requester"
        organizationName = "Westside Food Pantry"
        location = "Westside"
        phone = "+1 555-0444"
        accountType = "Food Pantry"
    } | ConvertTo-Json

    $req2Res = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $regReq2 -ContentType "application/json"
    $req2Token = $req2Res.token
    $req2Id = $req2Res.user.id
    Report-Test "Requester 2 Registration" ($req2Res.success -and $req2Token) "Requester 2 ID: $req2Id"
} catch {
    Report-Test "Requester 2 Registration" $false $_.Exception.Message
}

# 6. Supplier 1 Posts a Food Donation
$donId = ""
try {
    $donData = @{
        foodName = "Artisan Pasta & Roasted Vegetables"
        category = "Cooked Food"
        dietaryTag = "Vegetarian"
        donorType = "Restaurant"
        quantity = 50
        unit = "Meals"
        donorName = "Marco Bistro"
        location = "Harbor District"
        contactPhone = "+1 555-0111"
        shelfLifeHours = 8
        expiryTime = (Get-Date).AddHours(8).ToString("o")
        description = "Prepared fresh today, packaged in sanitized warm containers."
    } | ConvertTo-Json

    $donRes = Invoke-RestMethod -Uri "http://localhost:5001/api/donations" -Method Post -Headers @{ Authorization = "Bearer $sup1Token" } -Body $donData -ContentType "application/json"
    $donId = $donRes.data._id
    $hasSupplierId = ($donRes.data.supplierId -eq $sup1Id)
    Report-Test "Supplier 1 Posts Donation" ($donRes.success -and $hasSupplierId) "Donation ID: $donId, Available: $($donRes.data.availableQuantity)"
} catch {
    Report-Test "Supplier 1 Posts Donation" $false $_.Exception.Message
}

# 7. Requester 1 Browses and Sees the Donation
try {
    $availRes = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/available" -Method Get
    $matchDon = ($availRes.data | Where-Object { $_._id -eq $donId })
    Report-Test "Requester Sees Available Donation" ($null -ne $matchDon) "Donation visible with status: $($matchDon.status)"
} catch {
    Report-Test "Requester Sees Available Donation" $false $_.Exception.Message
}

# 8. Requester 1 Submits a Request for Specific Donation
$reqId = ""
try {
    $reqBody = @{
        donationId = $donId
        quantity = 30
        unit = "Meals"
        organizationName = "Downtown Community Shelter"
        location = "Harbor District"
        peopleCount = 30
        neededBy = (Get-Date).AddHours(4).ToString("o")
        description = "Will be served for evening dinner."
        contactPhone = "+1 555-0222"
    } | ConvertTo-Json

    $reqRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Post -Headers @{ Authorization = "Bearer $req1Token" } -Body $reqBody -ContentType "application/json"
    $reqId = $reqRes.data._id
    $correctRefs = ($reqRes.data.donationId -eq $donId -and $reqRes.data.supplierId -eq $sup1Id -and $reqRes.data.requesterId -eq $req1Id)
    Report-Test "Submit Request Linked to Donation" ($reqRes.success -and $correctRefs -and $reqRes.data.status -eq "Pending") "Request ID: $reqId, Status: $($reqRes.data.status)"
} catch {
    Report-Test "Submit Request Linked to Donation" $false $_.Exception.Message
}

# 9. Supplier 1 Receives Persisted Notification
try {
    $notifRes = Invoke-RestMethod -Uri "http://localhost:5002/api/notifications" -Method Get -Headers @{ Authorization = "Bearer $sup1Token" }
    $reqNotif = ($notifRes.data | Where-Object { $_.requestId -eq $reqId })
    $hasDetails = ($reqNotif -and $reqNotif.message -match "Elena Fisher")
    Report-Test "Supplier 1 Receives Persisted Notification" ($null -ne $hasDetails) "Notification: '$($reqNotif.title)' - $($reqNotif.message)"
} catch {
    Report-Test "Supplier 1 Receives Persisted Notification" $false $_.Exception.Message
}

# 10. Supplier 2 (Unauthorized) Cannot Accept Supplier 1's Request
try {
    $acceptBody = @{ pickupInstructions = "Pickup at side door" } | ConvertTo-Json
    $unauthRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/$reqId/accept" -Method Post -Headers @{ Authorization = "Bearer $sup2Token" } -Body $acceptBody -ContentType "application/json"
    Report-Test "Cross-Supplier Accept Authorization Check" $false "Should have rejected Supplier 2"
} catch {
    $is403 = $_.Exception.Response.StatusCode.value__ -eq 403
    Report-Test "Cross-Supplier Accept Authorization Check" $is403 "Correctly rejected Supplier 2 with HTTP 403 Forbidden"
}

# 11. Supplier 1 Accepts the Request
try {
    $acceptBody = @{ pickupInstructions = "Pickup at Marco Bistro rear kitchen dock between 3-4 PM." } | ConvertTo-Json
    $acceptRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/$reqId/accept" -Method Post -Headers @{ Authorization = "Bearer $sup1Token" } -Body $acceptBody -ContentType "application/json"
    $statusIsAccepted = ($acceptRes.data.status -eq "Accepted")

    # Check that Service 1 decreased availableQuantity from 50 to 20
    $donCheck = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/$donId" -Method Get
    $qtyDecremented = ($donCheck.data.availableQuantity -eq 20 -and $donCheck.data.status -eq "Partially Reserved")

    Report-Test "Supplier 1 Accepts Request & Quantity Decremented" ($statusIsAccepted -and $qtyDecremented) "Request: $($acceptRes.data.status), Remaining Available: $($donCheck.data.availableQuantity)"
} catch {
    Report-Test "Supplier 1 Accepts Request & Quantity Decremented" $false $_.Exception.Message
}

# 12. Requester 1 Receives Persisted Acceptance Notification & Sees Accepted Status
try {
    $req1Notifs = Invoke-RestMethod -Uri "http://localhost:5002/api/notifications" -Method Get -Headers @{ Authorization = "Bearer $req1Token" }
    $acceptNotif = ($req1Notifs.data | Where-Object { $_.type -eq "REQUEST_ACCEPTED" })
    $req1Requests = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Get -Headers @{ Authorization = "Bearer $req1Token" }
    $myReq = ($req1Requests.data | Where-Object { $_._id -eq $reqId })

    $pass = ($null -ne $acceptNotif -and $myReq.status -eq "Accepted")
    Report-Test "Requester 1 Sees Accepted Status & Acceptance Notification" $pass "Status: $($myReq.status), Notif: '$($acceptNotif.title)'"
} catch {
    Report-Test "Requester 1 Sees Accepted Status & Acceptance Notification" $false $_.Exception.Message
}

# 13. Concurrency / Over-allocation Prevention
# Attempt to request 25 Meals when only 20 Meals remain available
try {
    $overReq = @{
        donationId = $donId
        quantity = 25
        unit = "Meals"
        organizationName = "Westside Food Pantry"
        location = "Harbor District"
        peopleCount = 25
        contactPhone = "+1 555-0444"
        neededBy = (Get-Date).AddHours(4).ToString("o")
    } | ConvertTo-Json

    $overRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Post -Headers @{ Authorization = "Bearer $req2Token" } -Body $overReq -ContentType "application/json"
    Report-Test "Over-allocation Request Prevention" $false "Should have rejected request exceeding remaining available quantity"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Report-Test "Over-allocation Request Prevention" ($status -eq 400 -or $status -eq 409) "Correctly rejected over-allocation with HTTP $status"
}

# 14. Second Request and Rejection Workflow
$req2ObjId = ""
try {
    $validReq2 = @{
        donationId = $donId
        quantity = 15
        unit = "Meals"
        organizationName = "Westside Food Pantry"
        location = "Harbor District"
        peopleCount = 15
        contactPhone = "+1 555-0444"
        neededBy = (Get-Date).AddHours(4).ToString("o")
    } | ConvertTo-Json
    $r2Res = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Post -Headers @{ Authorization = "Bearer $req2Token" } -Body $validReq2 -ContentType "application/json"
    $req2ObjId = $r2Res.data._id

    # Supplier 1 Rejects this request
    $rejectBody = @{ rejectionReason = "Delivery logistics conflict with pickup window" } | ConvertTo-Json
    $rejRes = Invoke-RestMethod -Uri "http://localhost:5002/api/requests/$req2ObjId/reject" -Method Post -Headers @{ Authorization = "Bearer $sup1Token" } -Body $rejectBody -ContentType "application/json"
    $isRejected = ($rejRes.data.status -eq "Rejected")

    # Verify that rejecting did NOT decrement donation quantity
    $donAfterReject = Invoke-RestMethod -Uri "http://localhost:5001/api/donations/$donId" -Method Get
    $qtyUnchanged = ($donAfterReject.data.availableQuantity -eq 20)

    # Verify Requester 2 received rejection notification
    $req2Notifs = Invoke-RestMethod -Uri "http://localhost:5002/api/notifications" -Method Get -Headers @{ Authorization = "Bearer $req2Token" }
    $rejNotif = ($req2Notifs.data | Where-Object { $_.type -eq "REQUEST_REJECTED" })

    Report-Test "Rejection Workflow & No-Reservation Invariant" ($isRejected -and $qtyUnchanged -and $null -ne $rejNotif) "Status: $($rejRes.data.status), Quantity still 20, Rejection Notif: '$($rejNotif.title)'"
} catch {
    Report-Test "Rejection Workflow & No-Reservation Invariant" $false $_.Exception.Message
}

# 15. Notification Read/Unread Filters and Mark-as-Read Actions
try {
    # Check unread count
    $unreadCountRes = Invoke-RestMethod -Uri "http://localhost:5002/api/notifications/unread-count" -Method Get -Headers @{ Authorization = "Bearer $req1Token" }
    $hasUnread = ($unreadCountRes.count -gt 0)

    # Mark single notification as read
    $firstNotifId = $req1Notifs.data[0]._id
    $readRes = Invoke-RestMethod -Uri "http://localhost:5002/api/notifications/$firstNotifId/read" -Method Patch -Headers @{ Authorization = "Bearer $req1Token" }
    $isNowRead = ($readRes.data.isRead -eq $true)

    # Mark all read
    $markAllRes = Invoke-RestMethod -Uri "http://localhost:5002/api/notifications/read-all" -Method Patch -Headers @{ Authorization = "Bearer $req1Token" }
    $finalCount = (Invoke-RestMethod -Uri "http://localhost:5002/api/notifications/unread-count" -Method Get -Headers @{ Authorization = "Bearer $req1Token" }).count

    Report-Test "Notifications Center Mark-As-Read Operations" ($hasUnread -and $isNowRead -and $finalCount -eq 0) "Mark read & mark all read successful (final unread: $finalCount)"
} catch {
    Report-Test "Notifications Center Mark-As-Read Operations" $false $_.Exception.Message
}

# 16. Private Request & Notification Data Isolation
try {
    # Requester 2 querying requests should NOT see Requester 1's request
    $req2List = Invoke-RestMethod -Uri "http://localhost:5002/api/requests" -Method Get -Headers @{ Authorization = "Bearer $req2Token" }
    $leak = ($req2List.data | Where-Object { $_._id -eq $reqId })
    Report-Test "Requester Data Privacy Isolation" ($null -eq $leak) "Requester 2 cannot view Requester 1's private request"
} catch {
    Report-Test "Requester Data Privacy Isolation" $false $_.Exception.Message
}

Write-Host "================================================================"
$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$totalCount = $testResults.Count
Write-Host "Test Suite Finished: $passCount / $totalCount Passed"
Write-Host "================================================================"
