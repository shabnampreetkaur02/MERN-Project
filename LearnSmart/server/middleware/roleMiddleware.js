
const authorizeRoles = (...allowedRoles) => {

    return (req, res, next) => {

        // Check whether user information exists
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        // Check user's role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied. You do not have permission."
            });
        }

        // User has permission
        next();
    };
};

module.exports = authorizeRoles;
