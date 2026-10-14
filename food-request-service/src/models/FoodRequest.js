const mongoose = require("mongoose");

const foodRequestSchema = new mongoose.Schema(
    {
        donationId: {
            type: String,
            default: null,
            index: true
        },
        matchedDonationId: {
            type: String,
            default: null
        },
        supplierId: {
            type: String,
            default: null,
            index: true
        },
        supplierName: {
            type: String,
            default: ""
        },
        foodName: {
            type: String,
            default: ""
        },
        foodCategory: {
            type: String,
            enum: [
                "Cooked Food",
                "Fruits",
                "Vegetables",
                "Bakery",
                "Packaged Food",
                "Other"
            ],
            required: [true, "Food category is required"],
            default: "Cooked Food"
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"]
        },
        unit: {
            type: String,
            enum: ["Meals", "Kg", "Packets", "Items"],
            required: [true, "Unit is required"],
            default: "Meals"
        },
        requesterId: {
            type: String,
            required: [true, "Requester ID is required"],
            index: true
        },
        requesterName: {
            type: String,
            required: [true, "Requester name is required"],
            trim: true
        },
        requesterEmail: {
            type: String,
            trim: true,
            default: ""
        },
        organizationName: {
            type: String,
            trim: true,
            default: ""
        },
        contactPhone: {
            type: String,
            required: [true, "Contact phone number is required for food request coordination"],
            trim: true,
            validate: {
                validator: function (v) {
                    if (!v) return false;
                    const digits = v.replace(/\D/g, "");
                    return digits.length >= 7 && digits.length <= 15 && /^[+]?[\d\s\-().]{7,25}$/.test(v);
                },
                message: "Please provide a valid contact phone number (7 to 15 digits)."
            }
        },
        location: {
            type: String,
            required: [true, "Delivery address or requester location is required"],
            trim: true
        },
        peopleCount: {
            type: Number,
            min: 1,
            default: 1
        },
        neededBy: {
            type: Date,
            required: [true, "Needed by date is required"],
            validate: {
                validator: function (value) {
                    if (!this.isModified("neededBy")) return true;
                    return value > new Date();
                },
                message: "Needed by time must be in the future"
            }
        },
        urgencyLevel: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Medium"
        },
        dietPreference: {
            type: String,
            enum: [
                "Any / No Preference",
                "Vegetarian",
                "Vegan",
                "Non-Veg",
                "Halal",
                "Bakery",
                "Other"
            ],
            default: "Any / No Preference"
        },
        maxDistanceKm: {
            type: Number,
            min: 1,
            default: 10
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected", "Fulfilled", "Cancelled"],
            default: "Pending",
            index: true
        },
        submissionTimestamp: {
            type: Date,
            default: Date.now
        },
        decisionTimestamp: {
            type: Date,
            default: null
        },
        decisionNote: {
            type: String,
            default: ""
        },
        pickupInstructions: {
            type: String,
            default: ""
        },
        rejectionReason: {
            type: String,
            default: ""
        },
        matchedDonationDetails: {
            type: Object,
            default: null
        }
    },
    { timestamps: true }
);

// Pre-save hook to keep donationId and matchedDonationId aligned
foodRequestSchema.pre("save", function () {
    if (this.donationId && !this.matchedDonationId) {
        this.matchedDonationId = this.donationId;
    } else if (this.matchedDonationId && !this.donationId) {
        this.donationId = this.matchedDonationId;
    }
});

module.exports = mongoose.model("FoodRequest", foodRequestSchema);
