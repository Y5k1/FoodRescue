const axios = require("axios");
const FoodRequest = require("../models/FoodRequest");
const Notification = require("../models/Notification");
const { validateAndSanitizePhone } = require("../utils/phoneValidator");

// Clean and sanitize service URLs
const sanitizeUrl = (url) => {
    if (!url) return "";
    return url.trim().replace(/\/+$/, "").replace(/\/api$/, "");
};

// Known active production Food Donation Service on Render
const KNOWN_DONATION_SVC = "https://foodrescue-h3hs.onrender.com";

// Resolve candidate URLs to try for Food Donation Service
const getDonationServiceUrls = () => {
    const rawEnv = process.env.DONATION_SERVICE_URL;
    const candidates = [];

    if (rawEnv) {
        const cleaned = sanitizeUrl(rawEnv);
        // Exclude the placeholder if it's the dead example from docs
        if (cleaned && !cleaned.includes("foodrescue-donation-service.onrender.com")) {
            candidates.push(cleaned);
        }
    }

    // Always include known production Render service if not already present
    if (!candidates.includes(KNOWN_DONATION_SVC)) {
        candidates.push(KNOWN_DONATION_SVC);
    }

    // Include localhost fallback for local development
    if (process.env.NODE_ENV !== "production" && !candidates.includes("http://localhost:5001")) {
        candidates.push("http://localhost:5001");
    }

    return candidates;
};

// Resilient dispatcher for inter-service REST calls to Food Donation Service
const callDonationService = async ({ method = "get", path, data, timeout = 10000 }) => {
    const candidateUrls = getDonationServiceUrls();
    let lastError = null;

    for (const baseUrl of candidateUrls) {
        try {
            const url = `${baseUrl}${path}`;
            console.log(`[Food-Request-Svc] Dispatching ${method.toUpperCase()} ${url}`);
            const res = await axios({
                method,
                url,
                data,
                timeout
            });
            return {
                success: true,
                data: res.data?.data !== undefined ? res.data.data : res.data,
                baseUrl
            };
        } catch (err) {
            lastError = err;
            console.warn(`[Food-Request-Svc] Attempt ${method.toUpperCase()} ${baseUrl}${path} failed: ${err.message} (status: ${err.response?.status})`);

            // If the donation service explicitly responded with JSON "Donation not found",
            // don't try other URLs, because this service DID respond and confirmed it's missing in DB
            if (err.response?.status === 404 && err.response?.data?.message === "Donation not found") {
                return {
                    success: false,
                    notFound: true,
                    message: "The requested food donation was not found."
                };
            }
        }
    }

    return {
        success: false,
        unavailable: true,
        error: lastError,
        message: `Food Donation Service is unavailable or unreachable (attempted: ${candidateUrls.join(", ")}). Error: ${lastError?.message || "connection failed"}`
    };
};

// Live REST API Event Log buffer for UI live stream
const eventLogs = [
    {
        id: "evt-1",
        service: "Food-Donation-svc",
        time: "Just now",
        timestamp: new Date(),
        message: "GET /api/donations - 200 OK (MongoDB Atlas)",
        type: "success"
    },
    {
        id: "evt-2",
        service: "Matching-Engine-Svc",
        time: "2m ago",
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        message: "POST /api/match - Algorithmic Proximity Evaluator Active",
        type: "info"
    },
    {
        id: "evt-3",
        service: "Food-Request-Svc",
        time: "5m ago",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        message: "POST /api/requests - Request cluster indexed successfully",
        type: "success"
    }
];

const logEvent = (service, message, type = "info") => {
    eventLogs.unshift({
        id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        service,
        time: "Just now",
        timestamp: new Date(),
        message,
        type
    });
    if (eventLogs.length > 50) eventLogs.pop();
};

// Create a food request linked to a specific donation
exports.createRequest = async (req, res, next) => {
    try {
        const {
            donationId,
            quantity,
            unit,
            location,
            organizationName,
            peopleCount,
            neededBy,
            description,
            contactPhone,
            urgencyLevel,
            dietPreference
        } = req.body;

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required to submit a food request."
            });
        }

        if (req.user.role === "supplier") {
            return res.status(403).json({
                success: false,
                message: "Suppliers are not permitted to submit food requests. Only Requesters may request food."
            });
        }

        const requestedQty = Number(quantity);
        if (!requestedQty || requestedQty <= 0) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity must be greater than zero."
            });
        }

        if (!donationId) {
            return res.status(400).json({
                success: false,
                message: "A specific donation ID must be provided to request food."
            });
        }

        // 1. Fetch the exact donation from Food Donation Service
        const donCall = await callDonationService({
            method: "get",
            path: `/api/donations/${donationId}`,
            timeout: 10000
        });

        if (!donCall.success) {
            if (donCall.notFound) {
                return res.status(404).json({
                    success: false,
                    message: "The requested food donation was not found."
                });
            }
            return res.status(503).json({
                success: false,
                message: donCall.message
            });
        }

        const donation = donCall.data;

        // 2. Validate donation availability and expiry
        if (donation.status === "Reserved" || donation.status === "Collected" || donation.status === "Expired") {
            return res.status(400).json({
                success: false,
                message: `This donation has already been accepted/reserved and is no longer available (current status: ${donation.status}).`
            });
        }

        if (new Date(donation.expiryTime) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "This donation has already expired and cannot be requested."
            });
        }

        const availableQty = donation.availableQuantity !== undefined ? donation.availableQuantity : donation.quantity;
        if (availableQty <= 0) {
            return res.status(400).json({
                success: false,
                message: "This donation has already been fully claimed and has no surplus quantity remaining."
            });
        }

        if (requestedQty > availableQty) {
            return res.status(400).json({
                success: false,
                message: `Requested quantity (${requestedQty}) exceeds available surplus (${availableQty} ${donation.unit}).`
            });
        }

        // Validate and sanitize requester's contactPhone (required for donor-requester communication)
        const rawPhone = (contactPhone || (req.user && req.user.phone) || "").trim();
        const phoneValidation = validateAndSanitizePhone(rawPhone);
        if (!phoneValidation.valid) {
            return res.status(400).json({
                success: false,
                message: `Valid contact phone number is required for food requests: ${phoneValidation.error}`
            });
        }
        const validatedPhone = phoneValidation.phone;

        // 3. Construct and save the request
        const supplierId = donation.supplierId || donation.donorId;
        const supplierName = donation.donorName || "Food Donor";

        const foodRequest = await FoodRequest.create({
            donationId: donation._id,
            matchedDonationId: donation._id,
            supplierId: supplierId || null,
            supplierName: supplierName,
            foodName: donation.foodName || "Surplus Food",
            foodCategory: donation.category || "Cooked Food",
            quantity: requestedQty,
            unit: donation.unit || unit || "Meals",
            requesterId: req.user.id,
            requesterName: req.user.name,
            requesterEmail: req.user.email,
            organizationName: organizationName || req.user.organizationName || "",
            contactPhone: validatedPhone,
            location: location || req.user.location || "",
            peopleCount: Number(peopleCount) || 1,
            neededBy: neededBy ? new Date(neededBy) : new Date(Date.now() + 24 * 3600 * 1000),
            urgencyLevel: urgencyLevel || "Medium",
            dietPreference: (dietPreference || donation.dietaryTag || "Any / No Preference").toString().trim(),
            description: description || "",
            status: "Pending",
            submissionTimestamp: new Date(),
            matchedDonationDetails: {
                foodName: donation.foodName,
                donorName: supplierName,
                donorType: donation.donorType,
                location: donation.location,
                expiryTime: donation.expiryTime,
                category: donation.category,
                dietaryTag: donation.dietaryTag,
                contactPhone: donation.contactPhone || ""
            }
        });

        // 4. Create Notification for the Supplier
        if (supplierId) {
            try {
                await Notification.create({
                    recipientUserId: supplierId,
                    recipientRole: "supplier",
                    type: "REQUEST_SUBMITTED",
                    title: "New Incoming Food Request",
                    message: `${req.user.name}${organizationName ? ` (${organizationName})` : ""} requested ${requestedQty} ${foodRequest.unit} of ${donation.foodName}.`,
                    donationId: donation._id.toString(),
                    requestId: foodRequest._id.toString(),
                    metadata: {
                        foodName: donation.foodName,
                        supplierName,
                        requesterName: req.user.name,
                        organizationName: organizationName || req.user.organizationName,
                        quantity: requestedQty,
                        unit: foodRequest.unit,
                        location: foodRequest.location,
                        peopleCount: foodRequest.peopleCount,
                        neededBy: foodRequest.neededBy,
                        pickupInstructions: description,
                        contactPhone: foodRequest.contactPhone || ""
                    }
                });
            } catch (notifErr) {
                console.error("Failed to create supplier notification:", notifErr.message);
            }
        }

        // 5. Create confirmation Notification for the Requester
        try {
            await Notification.create({
                recipientUserId: req.user.id,
                recipientRole: "requester",
                type: "REQUEST_SUBMITTED",
                title: "Request Submitted Successfully",
                message: `Your request for ${requestedQty} ${foodRequest.unit} of ${donation.foodName} has been submitted to ${supplierName} and is awaiting review.`,
                donationId: donation._id.toString(),
                requestId: foodRequest._id.toString(),
                metadata: {
                    foodName: donation.foodName,
                    supplierName,
                    requesterName: req.user.name,
                    quantity: requestedQty,
                    unit: foodRequest.unit,
                    location: donation.location,
                    contactPhone: donation.contactPhone || ""
                }
            });
        } catch (notifErr) {
            console.error("Failed to create requester confirmation notification:", notifErr.message);
        }

        logEvent(
            "Food-Request-Svc",
            `POST /api/requests - REQ-${foodRequest._id.toString().slice(-4)} submitted for donation '${donation.foodName}'`,
            "success"
        );

        res.status(201).json({
            success: true,
            message: "Food request submitted successfully and is pending supplier review.",
            data: foodRequest
        });
    } catch (error) {
        next(error);
    }
};

// Get requests with strict role-based access control
exports.getRequests = async (req, res, next) => {
    try {
        const filter = {};

        // Role-based filtering
        if (req.user) {
            if (req.user.role === "requester") {
                // Requesters can only see their own submitted requests
                filter.requesterId = req.user.id;
            } else if (req.user.role === "supplier") {
                // Suppliers can only see requests for donations they own
                filter.supplierId = req.user.id;
            }
        }

        // Optional query filters
        if (req.query.donationId) {
            filter.donationId = req.query.donationId;
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.search) {
            filter.$or = [
                { requesterName: { $regex: req.query.search, $options: "i" } },
                { organizationName: { $regex: req.query.search, $options: "i" } },
                { foodName: { $regex: req.query.search, $options: "i" } },
                { location: { $regex: req.query.search, $options: "i" } }
            ];
        }

        const requests = await FoodRequest.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// Get one food request by ID with permission check
exports.getRequestById = async (req, res, next) => {
    try {
        const request = await FoodRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });
        }

        // Authorization check: user must be the requester or the supplier owner
        if (req.user) {
            const isRequester = request.requesterId === req.user.id;
            const isSupplier = request.supplierId === req.user.id;
            if (!isRequester && !isSupplier && req.user.role !== "admin") {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view this request"
                });
            }
        }

        res.status(200).json({ success: true, data: request });
    } catch (error) {
        next(error);
    }
};

// ACCEPT a request (Supplier only)
exports.acceptRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { pickupInstructions, decisionNote } = req.body;

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const request = await FoodRequest.findById(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });
        }

        // 1. Verify that logged-in user is the supplier who owns the donation
        if (request.supplierId && request.supplierId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You may only accept or reject requests for donations you own."
            });
        }

        // 2. Validate request is still Pending
        if (request.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Cannot accept this request. Current status is already '${request.status}'.`
            });
        }

        // 3. Perform concurrency-safe quantity reservation via REST call to Service 1
        const reserveCall = await callDonationService({
            method: "patch",
            path: `/api/donations/${request.donationId}/reserve-quantity`,
            data: {
                quantity: request.quantity,
                requestId: request._id.toString(),
                supplierId: req.user.id
            },
            timeout: 10000
        });

        if (!reserveCall.success) {
            logEvent(
                "Donation-Svc",
                `PATCH /api/donations/${request.donationId}/reserve-quantity failed`
            );
            if (reserveCall.error?.response?.data?.message) {
                return res.status(reserveCall.error.response.status || 400).json({
                    success: false,
                    message: reserveCall.error.response.data.message
                });
            }
            return res.status(503).json({
                success: false,
                message: reserveCall.message || "Failed to reserve surplus quantity. Donation service unreachable."
            });
        }

        const updatedDonation = reserveCall.data;

        // 4. Update request status to Accepted
        try {
            request.status = "Accepted";
            request.decisionTimestamp = new Date();
            request.decisionNote = decisionNote || "Request accepted by supplier";
            request.pickupInstructions = pickupInstructions || updatedDonation?.location || "Ready for pickup at supplier location.";
            if (updatedDonation) {
                request.matchedDonationDetails = {
                    ...request.matchedDonationDetails,
                    location: updatedDonation.location,
                    contactPhone: updatedDonation.contactPhone,
                    status: updatedDonation.status
                };
            }
            await request.save();

            // 5. Create notification for the Requester
            await Notification.create({
                recipientUserId: request.requesterId,
                recipientRole: "requester",
                type: "REQUEST_ACCEPTED",
                title: "Your Food Request Was Accepted!",
                message: `Your request for ${request.foodName} has been accepted by ${request.supplierName || req.user.name}.`,
                donationId: request.donationId,
                requestId: request._id.toString(),
                metadata: {
                    foodName: request.foodName,
                    supplierName: request.supplierName || req.user.name,
                    quantity: request.quantity,
                    unit: request.unit,
                    location: updatedDonation?.location || request.location,
                    pickupInstructions: request.pickupInstructions,
                    decisionTimestamp: request.decisionTimestamp,
                    contactPhone: updatedDonation?.contactPhone || request.matchedDonationDetails?.contactPhone || ""
                }
            });

            // 6. Create confirmation notification for the Supplier
            await Notification.create({
                recipientUserId: req.user.id,
                recipientRole: "supplier",
                type: "REQUEST_ACCEPTED",
                title: "Request Acceptance Confirmed",
                message: `You accepted ${request.requesterName}'s request for ${request.quantity} ${request.unit} of ${request.foodName}.`,
                donationId: request.donationId,
                requestId: request._id.toString(),
                metadata: {
                    foodName: request.foodName,
                    requesterName: request.requesterName,
                    quantity: request.quantity,
                    unit: request.unit,
                    decisionTimestamp: request.decisionTimestamp,
                    contactPhone: request.contactPhone || ""
                }
            });

            logEvent(
                "Matching-Engine-Svc",
                `REQ-${request._id.toString().slice(-4)} ACCEPTED by ${request.supplierName || req.user.name} (${request.quantity} ${request.unit})`,
                "success"
            );

            res.status(200).json({
                success: true,
                message: "Food request accepted successfully! The requested quantity has been safely reserved.",
                data: request
            });
        } catch (saveError) {
            // ROLLBACK: Release the reserved quantity back in Service 1
            try {
                await callDonationService({
                    method: "patch",
                    path: `/api/donations/${request.donationId}/release-quantity`,
                    data: { quantity: request.quantity },
                    timeout: 8000
                });
                logEvent(
                    "Matching-Engine-Svc",
                    `ROLLBACK: Released ${request.quantity} ${request.unit} on donation ${request.donationId} after failure`
                );
            } catch (rbErr) {
                console.error("Rollback failed:", rbErr.message);
            }
            throw saveError;
        }
    } catch (error) {
        next(error);
    }
};

// REJECT a request (Supplier only)
exports.rejectRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const request = await FoodRequest.findById(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });
        }

        // Verify supplier ownership
        if (request.supplierId && request.supplierId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You may only accept or reject requests for donations you own."
            });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Cannot reject this request. Current status is already '${request.status}'.`
            });
        }

        request.status = "Rejected";
        request.decisionTimestamp = new Date();
        request.rejectionReason = rejectionReason || "Unavailable or operational constraints.";
        await request.save();

        // Create rejection notification for Requester
        await Notification.create({
            recipientUserId: request.requesterId,
            recipientRole: "requester",
            type: "REQUEST_REJECTED",
            title: "Request Not Accepted",
            message: `Your request for ${request.foodName} was not accepted.`,
            donationId: request.donationId,
            requestId: request._id.toString(),
            metadata: {
                foodName: request.foodName,
                supplierName: request.supplierName,
                decisionTimestamp: request.decisionTimestamp,
                rejectionReason: request.rejectionReason
            }
        });

        // Create confirmation notification for Supplier
        await Notification.create({
            recipientUserId: req.user.id,
            recipientRole: "supplier",
            type: "REQUEST_REJECTED",
            title: "Request Rejection Recorded",
            message: `You declined ${request.requesterName}'s request for ${request.foodName}.`,
            donationId: request.donationId,
            requestId: request._id.toString(),
            metadata: {
                foodName: request.foodName,
                requesterName: request.requesterName,
                decisionTimestamp: request.decisionTimestamp
            }
        });

        logEvent(
            "Food-Request-Svc",
            `REQ-${request._id.toString().slice(-4)} REJECTED by ${request.supplierName || req.user.name}`
        );

        res.status(200).json({
            success: true,
            message: "Request marked as Rejected. No surplus quantity was allocated.",
            data: request
        });
    } catch (error) {
        next(error);
    }
};

// FULFILL request (handoff confirmed)
exports.fulfillRequest = async (req, res, next) => {
    try {
        const { id } = req.params;

        const request = await FoodRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Food request not found" });
        }

        request.status = "Fulfilled";
        await request.save();

        res.status(200).json({
            success: true,
            message: "Request marked as Fulfilled",
            data: request
        });
    } catch (error) {
        next(error);
    }
};

// CANCEL request (Requester only)
exports.cancelRequest = async (req, res, next) => {
    try {
        const { id } = req.params;

        const request = await FoodRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Food request not found" });
        }

        if (req.user && request.requesterId !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to cancel this request"
            });
        }

        // If it was already accepted, release the quantity back to Service 1
        if (request.status === "Accepted" && request.donationId) {
            try {
                await callDonationService({
                    method: "patch",
                    path: `/api/donations/${request.donationId}/release-quantity`,
                    data: { quantity: request.quantity },
                    timeout: 8000
                });
            } catch (err) {
                console.error("Failed to release quantity on cancellation:", err.message);
            }
        }

        request.status = "Cancelled";
        await request.save();

        res.status(200).json({
            success: true,
            message: "Request cancelled successfully",
            data: request
        });
    } catch (error) {
        next(error);
    }
};

// GET REQUEST STATS
exports.getRequestStats = async (req, res, next) => {
    try {
        const filter = {};
        if (req.user) {
            if (req.user.role === "supplier") {
                filter.supplierId = req.user.id;
            } else if (req.user.role === "requester") {
                filter.requesterId = req.user.id;
            }
        }

        const totalCount = await FoodRequest.countDocuments(filter);
        const pendingCount = await FoodRequest.countDocuments({ ...filter, status: "Pending" });
        const acceptedCount = await FoodRequest.countDocuments({ ...filter, status: "Accepted" });
        const fulfilledCount = await FoodRequest.countDocuments({ ...filter, status: "Fulfilled" });

        const peopleAgg = await FoodRequest.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalPeople: { $sum: "$peopleCount" }
                }
            }
        ]);

        const totalBeneficiaries = peopleAgg[0] ? peopleAgg[0].totalPeople : 0;

        res.status(200).json({
            success: true,
            data: {
                totalRequests: totalCount,
                pendingRequests: pendingCount,
                acceptedRequests: acceptedCount,
                matchedRequests: acceptedCount,
                fulfilledRequests: fulfilledCount,
                totalBeneficiaries
            }
        });
    } catch (error) {
        next(error);
    }
};

// GET LIVE EVENT STREAM LOGS
exports.getEventLogs = (req, res) => {
    res.json({
        success: true,
        data: eventLogs
    });
};

exports.getDonationServiceUrls = getDonationServiceUrls;
