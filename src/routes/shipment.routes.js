
const express = require("express");
const prisma = require("../lib/prisma");
const requireAuth = require("../middlewares/auth.middleware");

const router = express.Router();

// GET /api/shipment
router.get("/", requireAuth, async (req, res) => {
    try {
        const shipments = await prisma.shipment.findMany({
            where: {
                order: {
                    uid: req.user.uid,
                },
            },
            select: {
                shipid: true,
                oid: true,
                status: true,
            },
            orderBy: {
                shipid: "desc",
            },
        });

        return res.status(200).json({
            message: "Shipments retrieved successfully",
            shipments,
        });
    } catch (error) {
        console.error("Get shipments error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

module.exports = router;
