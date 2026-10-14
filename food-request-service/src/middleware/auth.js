const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "foodrescue_secure_production_jwt_secret_token_2026";

// Protect middleware - verifies JWT token issued by FoodRescue
exports.protect = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please provide a valid token."
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token."
        });
    }
};

// Optional auth - populates req.user if token is present, but doesn't block
exports.optionalAuth = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (e) {
            // ignore invalid token in optional auth
        }
    }
    next();
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user ? req.user.role : "unauthenticated"}' is not authorized to access this resource.`
            });
        }
        next();
    };
};
