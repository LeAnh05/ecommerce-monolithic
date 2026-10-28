const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");
const jwt = require("jsonwebtoken");
const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { username, fullname, password } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (
            typeof username !== "string" ||
            typeof fullname !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !fullname.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Username, fullname and password are required",
            });
        }

        // Kiểm tra tài khoản đã tồn tại
        const existingUser = await prisma.user.findUnique({
            where: { username: username.trim() },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists",
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo tài khoản với vai trò và hạng thành viên mặc định
        const user = await prisma.user.create({
            data: {
                username: username.trim(),
                fullname: fullname.trim(),
                password: hashedPassword,
                role: {
                    connect: { roleid: 1 },
                },
                membership: {
                    connect: { mid: 1 },
                },
            },
            select: {
                uid: true,
                username: true,
                fullname: true,
                role: {
                    select: {
                        rolename: true,
                    },
                },
                membership: {
                    select: {
                        mname: true,
                        score: true,
                    },
                },
            },
        });

        return res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        console.error("Register error:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                message: "Username already exists",
            });
        }

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Kiểm tra dữ liệu đầu vào
        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Username and password are required",
            });
        }

        // 2. Tìm người dùng trong database
        const user = await prisma.user.findUnique({
            where: {
                username: username.trim(),
            },
            include: {
                role: true,
                membership: true,
            },
        });

        // 3. Kiểm tra tài khoản có tồn tại không
        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password",
            });
        }

        // 4. So sánh mật khẩu với bcrypt
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid username or password",
            });
        }

        // 5. Kiểm tra JWT Secret
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured");

            return res.status(500).json({
                message: "Internal server error",
            });
        }

        // 6. Tạo JWT Token
        const token = jwt.sign(
            {
                uid: user.uid,
                username: user.username,
                role: user.role.rolename,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d",
            }
        );

        // 7. Trả kết quả đăng nhập
        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                uid: user.uid,
                username: user.username,
                fullname: user.fullname,
                role: user.role.rolename,
                membership: {
                    mname: user.membership.mname,
                    score: user.membership.score,
                },
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});
module.exports = router;