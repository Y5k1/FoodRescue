/**
 * Phone Number Validation and Sanitization Utility
 * Adheres to ITU-T E.164 international standard (7 to 15 digits).
 */
function validateAndSanitizePhone(phone) {
    if (!phone || typeof phone !== "string") {
        return {
            valid: false,
            error: "Phone number is required."
        };
    }

    const trimmed = phone.trim();
    if (!trimmed) {
        return {
            valid: false,
            error: "Phone number cannot be empty."
        };
    }

    // Strip HTML/script characters for security
    const cleanPhone = trimmed.replace(/[<>'"`;]/g, "");

    // Extract raw digits
    const digitsOnly = cleanPhone.replace(/\D/g, "");

    // Verify digit count (7 to 15 digits)
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return {
            valid: false,
            error: "Phone number must contain between 7 and 15 digits (e.g., +1 (555) 012-3344 or 9876543210)."
        };
    }

    // Verify allowed phone formatting characters (+, digits, spaces, hyphens, parentheses, periods)
    if (!/^[+]?[\d\s\-().]{7,25}$/.test(cleanPhone)) {
        return {
            valid: false,
            error: "Phone number contains invalid formatting characters."
        };
    }

    return {
        valid: true,
        phone: cleanPhone
    };
}

module.exports = { validateAndSanitizePhone };
