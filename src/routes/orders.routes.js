
const express = require("express");
const prisma = require("../lib/prisma");
const requireAuth = require("../middlewares/auth.middleware");

const router = express.Router();

// POST /api/orders
router.post("/", requireAuth, async (req, res) => {
    try {
        const { items } = req.body;

        // Kiểm tra danh sách sản phẩm
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Items are required",
            });
        }

        // Kiểm tra dữ liệu từng sản phẩm
        for (const item of items) {
            if (
                !item ||
                !Number.isInteger(item.pid) ||
                !Number.isInteger(item.qty) ||
                item.pid <= 0 ||
                item.qty <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid product ID or quantity",
                });
            }
        }

        // Không cho phép trùng sản phẩm trong một đơn hàng
        const productIds = items.map((item) => item.pid);

        if (new Set(productIds).size !== productIds.length) {
            return res.status(400).json({
                message: "Duplicate products are not allowed",
            });
        }

        // Thực hiện tạo đơn hàng trong transaction
        const order = await prisma.$transaction(async (tx) => {
            const orderDetails = [];

            for (const item of items) {
                // Kiểm tra và trừ kho nếu đủ số lượng
                const updated = await tx.product.updateMany({
                    where: {
                        pid: item.pid,
                        quantity: { gte: item.qty },
                    },
                    data: {
                        quantity: { decrement: item.qty },
                    },
                });

                if (updated.count !== 1) {
                    throw new Error("PRODUCT_UNAVAILABLE");
                }

                const product = await tx.product.findUnique({
                    where: { pid: item.pid },
                });

                orderDetails.push({
                    pid: item.pid,
                    qty: item.qty,
                    unit_price: product.price,
                });
            }

            // Tạo đơn hàng và chi tiết
            return await tx.order.create({
                data: {
                    uid: req.user.uid,
                    orderDetails: {
                        create: orderDetails,
                    },
                    shipments: {
                        create: {
                            status: "PENDING",
                        },
                    },
                },
                include: {
                    orderDetails: true,
                    shipments: true,
                },
            });
        });

        return res.status(201).json({
            message: "Order created successfully",
            order,
        });
    } catch (error) {
        console.error("Create order error:", error);

        if (error.message === "PRODUCT_UNAVAILABLE") {
            return res.status(400).json({
                message: "Product not found or insufficient stock",
            });
        }

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// GET /api/orders
router.get("/", requireAuth, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                uid: req.user.uid,
            },
            include: {
                orderDetails: {
                    include: {
                        product: {
                            select: {
                                pid: true,
                                pname: true,
                                price: true,
                            },
                        },
                    },
                },
                shipments: true,
            },
            orderBy: {
                createat: "desc",
            },
        });

        return res.status(200).json({
            message: "Orders retrieved successfully",
            orders,
        });
    } catch (error) {
        console.error("Get orders error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

module.exports = router;
