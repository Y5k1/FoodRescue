const express = require("express");
const router = express.Router();

const {
    createDonation,
    getDonations,
    getDonationById,
    updateDonation,
    deleteDonation,
    getAvailableDonations,
    reserveDonation,
    releaseDonation,
    reserveQuantity,
    releaseQuantity,
    collectDonation,
    getDonationStats
} = require("../controllers/donationController");

const { optionalAuth, protect, authorize } = require("../middleware/auth");

router.get("/stats", getDonationStats);
router.get("/available", getAvailableDonations);
router.get("/", optionalAuth, getDonations);
router.get("/:id", getDonationById);

router.post("/", optionalAuth, createDonation);
router.put("/:id", optionalAuth, updateDonation);
router.delete("/:id", optionalAuth, deleteDonation);

// Reservation and lifecycle endpoints
router.patch("/:id/reserve", reserveDonation);
router.patch("/:id/release", releaseDonation);
router.patch("/:id/reserve-quantity", reserveQuantity);
router.patch("/:id/release-quantity", releaseQuantity);
router.patch("/:id/collect", optionalAuth, collectDonation);

module.exports = router;