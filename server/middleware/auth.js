const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
    // Try cookie first, then Authorization header
    let token = req.cookies?.token;

    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
