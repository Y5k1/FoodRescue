const Donation = require("../models/Donation");
const User = require("../models/User");
const { validateAndSanitizePhone } = require("../utils/phoneValidator");

// Helper to auto-mark expired donations
const checkAndExpireDonations = async () => {
    try {
        await Donation.updateMany(
            {
                status: { $in: ["Available", "Partially Reserved"] },
                expiryTime: { $lte: new Date() }
            },
            {
                $set: { status: "Expired" }
            }
        );
    } catch (err) {
        console.error("Error auto-expiring donations:", err.message);
    }
};

// CREATE donation
exports.createDonation = async (req, res, next) => {
    try {
        const donationData = { ...req.body };

        // Attach user info if authenticated
        if (req.user) {
            donationData.supplierId = req.user.id;
            donationData.donorId = req.user.id;
            if (!donationData.donorName) {
                donationData.donorName = req.user.organizationName || req.user.name;
            }
            if (!donationData.contactPhone && req.user.phone) {
                donationData.contactPhone = req.user.phone;
            }
        }

        // Validate and sanitize contactPhone (mandatory for user-to-user communication)
        const phoneValidation = validateAndSanitizePhone(donationData.contactPhone);
        if (!phoneValidation.valid) {
            return res.status(400).json({
                success: false,
                message: `Valid contact phone number is required for food donations: ${phoneValidation.error}`
            });
        }
        donationData.contactPhone = phoneValidation.phone;

        // Auto-sync phone back to User profile in DB if user document was missing a phone
        if (req.user && req.user.id && (!req.user.phone || !req.user.phone.trim())) {
            try {
                await User.findByIdAndUpdate(req.user.id, { phone: phoneValidation.phone });
            } catch (syncErr) {
                console.error("Failed to sync phone to user model:", syncErr.message);
            }
        }

        // Set availableQuantity equal to quantity if not set
        const qty = Number(donationData.quantity) || 1;
        donationData.quantity = qty;
        if (donationData.availableQuantity === undefined || donationData.availableQuantity === null) {
            donationData.availableQuantity = qty;
        }

        // Calculate expiryTime if shelfLifeHours is provided and expiryTime is missing
        if (!donationData.expiryTime && donationData.shelfLifeHours) {
            const hours = Number(donationData.shelfLifeHours) || 6;
            donationData.expiryTime = new Date(Date.now() + hours * 3600 * 1000);
        }

        const donation = await Donation.create(donationData);

        res.status(201).json({
            success: true,
            message: "Food donation created successfully",
            data: donation
        });
    } catch (error) {
        next(error);
    }
};

// READ all donations with optional filters
exports.getDonations = async (req, res, next) => {
    try {
        await checkAndExpireDonations();

        const filter = {};

        // Supplier filter: if supplierId or donorId passed, or if myDonations query requested
        const supplierFilterId = req.query.supplierId || req.query.donorId || (req.query.myDonations === "true" && req.user ? req.user.id : null);
        if (supplierFilterId) {
            filter.$or = [
                { supplierId: supplierFilterId },
                { donorId: supplierFilterId }
            ];
        }

        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.search) {
            const searchRegex = { $regex: req.query.search, $options: "i" };
            const searchClause = [
                { foodName: searchRegex },
                { donorName: searchRegex },
                { location: searchRegex }
            ];
            if (filter.$or) {
                filter.$and = [
                    { $or: filter.$or },
                    { $or: searchClause }
                ];
                delete filter.$or;
            } else {
                filter.$or = searchClause;
            }
        }

        const donations = await Donation.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: donations.length,
            data: donations
        });
    } catch (error) {
        next(error);
    }
};

// READ one donation
exports.getDonationById = async (req, res, next) => {
    try {
        await checkAndExpireDonations();
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        res.status(200).json({ success: true, data: donation });
    } catch (error) {
        next(error);
    }
};

// UPDATE donation with ownership verification
exports.updateDonation = async (req, res, next) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        // Ownership check
        const ownerId = donation.supplierId || donation.donorId;
        if (req.user && ownerId && req.user.role === "supplier") {
            if (ownerId.toString() !== req.user.id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to update another supplier's donation"
                });
            }
        }

        if (donation.status === "Collected") {
            return res.status(400).json({
                success: false,
                message: "Cannot modify a donation that has already been collected"
            });
        }

        const updatedDonation = await Donation.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: "Donation updated successfully",
            data: updatedDonation
        });
    } catch (error) {
        next(error);
    }
};

// DELETE donation with ownership verification
exports.deleteDonation = async (req, res, next) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        const ownerId = donation.supplierId || donation.donorId;
        if (req.user && ownerId && req.user.role === "supplier") {
            if (ownerId.toString() !== req.user.id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to delete another supplier's donation"
                });
            }
        }

        await Donation.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Donation deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// READ available donations for requesters and matching service
exports.getAvailableDonations = async (req, res, next) => {
    try {
        await checkAndExpireDonations();

        // Donations are available only if they are not Reserved/Collected/Expired and have availableQuantity > 0
        const donations = await Donation.find({
            status: { $nin: ["Reserved", "Collected", "Expired"] },
            availableQuantity: { $gt: 0 },
            expiryTime: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        // Ensure browser and proxy caches do not return stale availability
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        res.status(200).json({
            success: true,
            count: donations.length,
            data: donations
        });
    } catch (error) {
        next(error);
    }
};

// CONCURRENCY-SAFE QUANTITY RESERVATION (invoked when request is accepted)
exports.reserveQuantity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quantity, requestId, supplierId } = req.body;

        const qtyToReserve = Number(quantity);
        if (!qtyToReserve || qtyToReserve <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid positive quantity is required for reservation."
            });
        }

        await checkAndExpireDonations();

        // 1. Check existing record
        const existing = await Donation.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Donation record not found"
            });
        }

        // 2. Verify supplier ownership if supplierId provided
        if (supplierId) {
            const ownerId = existing.supplierId || existing.donorId;
            if (ownerId && ownerId.toString() !== supplierId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Supplier does not own this donation"
                });
            }
        }

        // 3. Check expiration
        if (new Date(existing.expiryTime) <= new Date()) {
            return res.status(409).json({
                success: false,
                message: "Donation has expired and cannot be accepted."
            });
        }

        // 4. Check available quantity
        const currentAvail = existing.availableQuantity !== undefined ? existing.availableQuantity : existing.quantity;
        if (currentAvail < qtyToReserve) {
            return res.status(409).json({
                success: false,
                message: `Insufficient quantity available. Requested: ${qtyToReserve}, Available: ${currentAvail}`
            });
        }

        const remaining = currentAvail - qtyToReserve;
        // When remaining quantity reaches 0, the donation is Reserved and no longer available
        const newStatus = remaining <= 0 ? "Reserved" : "Partially Reserved";

        // 5. Concurrency-safe atomic conditional update using $inc and atomic status update
        const updated = await Donation.findOneAndUpdate(
            {
                _id: id,
                status: { $in: ["Available", "Partially Reserved"] },
                availableQuantity: { $gte: qtyToReserve },
                expiryTime: { $gt: new Date() }
            },
            {
                $inc: { availableQuantity: -qtyToReserve },
                $set: {
                    status: newStatus,
                    reservedByRequestId: requestId || existing.reservedByRequestId,
                    reservedAt: new Date()
                }
            },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(409).json({
                success: false,
                message: "Failed to reserve quantity. Another request may have just reserved the available surplus."
            });
        }

        res.status(200).json({
            success: true,
            message: `Reserved ${qtyToReserve} ${updated.unit} successfully. Status: ${updated.status}. Remaining available: ${updated.availableQuantity}`,
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// RELEASE QUANTITY (rollback / cancellation)
exports.releaseQuantity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const qtyToRelease = Number(quantity) || 0;

        const donation = await Donation.findById(id);
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        const newAvail = Math.min(donation.quantity, (donation.availableQuantity || 0) + qtyToRelease);
        const newStatus = newAvail >= donation.quantity ? "Available" : "Partially Reserved";

        donation.availableQuantity = newAvail;
        donation.status = newStatus;
        if (newStatus === "Available") {
            donation.reservedByRequestId = null;
        }
        await donation.save();

        res.status(200).json({
            success: true,
            message: `Released ${qtyToRelease} items back to donation. New available quantity: ${newAvail}`,
            data: donation
        });
    } catch (error) {
        next(error);
    }
};

// ATOMIC FULL RESERVATION (backwards compatibility)
exports.reserveDonation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { requestId } = req.body;

        await checkAndExpireDonations();

        const donation = await Donation.findOneAndUpdate(
            {
                _id: id,
                status: { $in: ["Available", "Partially Reserved"] },
                expiryTime: { $gt: new Date() }
            },
            {
                $set: {
                    status: "Reserved",
                    availableQuantity: 0,
                    reservedByRequestId: requestId || null,
                    reservedAt: new Date()
                }
            },
            { new: true }
        );

        if (!donation) {
            return res.status(409).json({
                success: false,
                message: "Donation is no longer available or has expired"
            });
        }

        res.status(200).json({
            success: true,
            message: "Donation reserved successfully",
            data: donation
        });
    } catch (error) {
        next(error);
    }
};

// RELEASE reservation (backwards compatibility)
exports.releaseDonation = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existing = await Donation.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        existing.status = "Available";
        existing.availableQuantity = existing.quantity;
        existing.reservedByRequestId = null;
        existing.reservedAt = null;
        await existing.save();

        res.status(200).json({
            success: true,
            message: "Donation released back to Available status",
            data: existing
        });
    } catch (error) {
        next(error);
    }
};

// COLLECT donation (handoff confirmed)
exports.collectDonation = async (req, res, next) => {
    try {
        const { id } = req.params;

        const donation = await Donation.findById(id);
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        const ownerId = donation.supplierId || donation.donorId;
        if (req.user && ownerId && req.user.role === "supplier") {
            if (ownerId.toString() !== req.user.id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to mark another supplier's donation as collected"
                });
            }
        }

        donation.status = "Collected";
        donation.collectedAt = new Date();
        await donation.save();

        res.status(200).json({
            success: true,
            message: "Donation marked as Collected",
            data: donation
        });
    } catch (error) {
        next(error);
    }
};

// STATS / METRICS endpoint for dashboard
exports.getDonationStats = async (req, res, next) => {
    try {
        await checkAndExpireDonations();

        const filter = {};
        if (req.query.supplierId) {
            filter.$or = [
                { supplierId: req.query.supplierId },
                { donorId: req.query.supplierId }
            ];
        }

        const totalCount = await Donation.countDocuments(filter);
        const availableCount = await Donation.countDocuments({
            ...filter,
            status: { $in: ["Available", "Partially Reserved"] },
            availableQuantity: { $gt: 0 },
            expiryTime: { $gt: new Date() }
        });
        const reservedCount = await Donation.countDocuments({ ...filter, status: "Reserved" });
        const collectedCount = await Donation.countDocuments({ ...filter, status: "Collected" });

        const quantityAgg = await Donation.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$quantity" }
                }
            }
        ]);

        const totalMeals = quantityAgg[0] ? quantityAgg[0].totalQuantity : 0;
        const co2PreventedKg = Math.round(totalMeals * 2.5);

        res.status(200).json({
            success: true,
            data: {
                totalDonations: totalCount,
                availableDonations: availableCount,
                reservedDonations: reservedCount,
                collectedDonations: collectedCount,
                totalMealsRescued: totalMeals,
                co2WastePreventedKg: co2PreventedKg
            }
        });
    } catch (error) {
        next(error);
    }
};