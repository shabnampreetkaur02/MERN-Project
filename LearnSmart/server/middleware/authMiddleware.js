const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        // Get token from request header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. No token provided."
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store user information in request
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };
        // Continue to next middleware or controller
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

// Like protect, but lets guests through (req.user stays undefined)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
            const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
            req.user = { userId: decoded.userId, role: decoded.role };
        } catch (error) {
            // invalid or expired token: treat the request as a guest
        }
    }

    next();
};

module.exports = { protect, optionalAuth };
