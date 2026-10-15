const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validateAndSanitizePhone } = require("../utils/phoneValidator");

const JWT_SECRET = process.env.JWT_SECRET || "foodrescue_default_secure_secret_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationName: user.organizationName || "",
            location: user.location || "",
            phone: user.phone || "",
            accountType: user.accountType || ""
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Register user
exports.register = async (req, res, next) => {
    try {
        const {
            name,
            email,
            password,
            confirmPassword,
            role,
            organizationName,
            phone,
            location,
            accountType
        } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide full name, email, and password."
            });
        }

        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long."
            });
        }

        const validRoles = ["supplier", "requester"];
        const selectedRole = role && validRoles.includes(role.toLowerCase()) ? role.toLowerCase() : "supplier";

        // Phone number validation (required for user-to-user communication)
        const phoneValidation = validateAndSanitizePhone(phone);
        if (!phoneValidation.valid) {
            return res.status(400).json({
                success: false,
                message: phoneValidation.error || "Please provide a valid phone number for direct calling & coordination."
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email address already exists. Please log in."
            });
        }

        // Create new user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: selectedRole,
            organizationName: organizationName ? organizationName.trim() : "",
            phone: phoneValidation.phone,
            location: location ? location.trim() : "",
            accountType: accountType ? accountType.trim() : ""
        });

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationName: user.organizationName,
                phone: user.phone,
                location: user.location,
                accountType: user.accountType,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// Login user
exports.login = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide an email and password."
            });
        }

        // Find user with password included
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // If user specified role during login tab that differs from account, adapt seamlessly
        const roleNotice = (role && role !== user.role)
            ? `Signed in to your registered ${user.role === "supplier" ? "Food Supplier" : "Food Requester"} portal.`
            : "Login successful";

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: roleNotice,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationName: user.organizationName,
                phone: user.phone,
                location: user.location,
                accountType: user.accountType,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get current logged-in user profile
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationName: user.organizationName,
                phone: user.phone,
                location: user.location,
                accountType: user.accountType,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update profile details
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, organizationName, phone, location, accountType } = req.body;

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (organizationName !== undefined) updateData.organizationName = organizationName.trim();
        if (phone !== undefined) {
            const phoneCheck = validateAndSanitizePhone(phone);
            if (!phoneCheck.valid) {
                return res.status(400).json({
                    success: false,
                    message: phoneCheck.error || "Please provide a valid phone number for coordination."
                });
            }
            updateData.phone = phoneCheck.phone;
        }
        if (location !== undefined) updateData.location = location.trim();
        if (accountType !== undefined) updateData.accountType = accountType.trim();

        const user = await User.findByIdAndUpdate(req.user.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationName: user.organizationName,
                phone: user.phone,
                location: user.location,
                accountType: user.accountType
            }
        });
    } catch (error) {
        next(error);
    }
};
