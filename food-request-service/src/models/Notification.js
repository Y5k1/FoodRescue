const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipientUserId: {
            type: String,
            required: [true, "Recipient user ID is required"],
            index: true
        },
        recipientRole: {
            type: String,
            enum: ["supplier", "requester", "all"],
            default: "all"
        },
        type: {
            type: String,
            enum: [
                "REQUEST_SUBMITTED",
                "REQUEST_ACCEPTED",
                "REQUEST_REJECTED",
                "REQUEST_STATUS_UPDATED"
            ],
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        donationId: {
            type: String,
            default: null
        },
        requestId: {
            type: String,
            default: null
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        metadata: {
            foodName: String,
            supplierName: String,
            requesterName: String,
            organizationName: String,
            quantity: Number,
            unit: String,
            location: String,
            peopleCount: Number,
            neededBy: Date,
            pickupInstructions: String,
            decisionTimestamp: Date,
            contactPhone: String
        }
    },
    { timestamps: true }
);

notificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
