const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Full name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please provide a valid email address"
            ]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
            select: false
        },
        role: {
            type: String,
            enum: ["supplier", "requester", "admin"],
            required: [true, "Role must be supplier or requester"],
            default: "supplier"
        },
        organizationName: {
            type: String,
            trim: true,
            default: ""
        },
        phone: {
            type: String,
            trim: true,
            default: "",
            validate: {
                validator: function (v) {
                    if (!v) return true; // allow empty for legacy records if unedited
                    const digits = v.replace(/\D/g, "");
                    return digits.length >= 7 && digits.length <= 15 && /^[+]?[\d\s\-().]{7,25}$/.test(v);
                },
                message: "Please provide a valid phone number (7 to 15 digits)."
            }
        },
        location: {
            type: String,
            trim: true,
            default: ""
        },
        accountType: {
            type: String,
            trim: true,
            default: ""
        }
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
