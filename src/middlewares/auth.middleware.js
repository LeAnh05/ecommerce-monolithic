const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
    // 1. Lấy Authorization Header
    const authHeader = req.headers.authorization;

    // 2. Kiểm tra định dạng Bearer Token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access denied. No token provided",
        });
    }

    // 3. Lấy token
    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access denied. No token provided",
        });
    }

    // 4. Kiểm tra JWT Secret
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured");

        return res.status(500).json({
            message: "Internal server error",
        });
    }

    try {
        // 5. Xác minh JWT Token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        // 6. Lưu thông tin người dùng
        req.user = decoded;

        // 7. Cho phép request tiếp tục
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}

module.exports = requireAuth;