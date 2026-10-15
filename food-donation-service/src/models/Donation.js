const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
    {
        foodName: {
            type: String,
            required: [true, "Food name is required"],
            trim: true
        },
        category: {
            type: String,
            required: [true, "Food category is required"],
            default: "Cooked Food",
            trim: true
        },
        dietaryTag: {
            type: String,
            default: "Vegetarian",
            trim: true
        },
        donorType: {
            type: String,
            enum: ["College Canteen", "Restaurant", "Bakery", "Supermarket", "Hotel", "Catering", "Individual Donor", "Other"],
            default: "Restaurant"
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be greater than zero"]
        },
        availableQuantity: {
            type: Number,
            min: [0, "Available quantity cannot be negative"],
            default: function () {
                return this.quantity;
            }
        },
        unit: {
            type: String,
            enum: ["Meals", "Kg", "Packets", "Items"],
            default: "Meals"
        },
        donorName: {
            type: String,
            required: [true, "Donor name is required"],
            trim: true
        },
        supplierId: {
            type: String,
            default: null
        },
        donorId: {
            type: String,
            default: null
        },
        location: {
            type: String,
            required: [true, "Pickup location is required"],
            trim: true
        },
        contactPhone: {
            type: String,
            required: [true, "Contact phone number is required for donation coordination"],
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
        shelfLifeHours: {
            type: Number,
            min: 1,
            default: 6
        },
        expiryTime: {
            type: Date,
            required: [true, "Expiry time is required"],
            validate: {
                validator: function (value) {
                    if (!this.isModified("expiryTime")) return true;
                    return value > new Date();
                },
                message: "Expiry time must be in the future"
            }
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ["Available", "Partially Reserved", "Reserved", "Collected", "Expired"],
            default: "Available"
        },
        reservedByRequestId: {
            type: String,
            default: null
        },
        reservedAt: {
            type: Date,
            default: null
        },
        collectedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Pre-save hook to ensure supplierId and donorId are synced, and availableQuantity initialized
donationSchema.pre("save", function () {
    if (this.supplierId && !this.donorId) {
        this.donorId = this.supplierId;
    } else if (this.donorId && !this.supplierId) {
        this.supplierId = this.donorId;
    }
    if (this.availableQuantity === undefined || this.availableQuantity === null) {
        this.availableQuantity = this.quantity;
    }
});

// Indexes for fast lookups
donationSchema.index({ status: 1, expiryTime: 1 });
donationSchema.index({ supplierId: 1 });
donationSchema.index({ donorId: 1 });

module.exports = mongoose.model("Donation", donationSchema);