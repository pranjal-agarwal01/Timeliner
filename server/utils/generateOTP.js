const crypto = require("crypto");

/**
 * Generate a cryptographically secure 6-digit OTP
 * @returns {string} 6-digit OTP string
 */
function generateOTP() {
    // Generate a random number between 100000 and 999999
    const otp = crypto.randomInt(100000, 1000000);
    return otp.toString();
}

module.exports = generateOTP;
