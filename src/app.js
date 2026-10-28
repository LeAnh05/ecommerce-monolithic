
const express = require("express");
const authRoutes = require("./routes/auth.routes");
const ordersRoutes = require("./routes/orders.routes");
const shipmentRoutes = require("./routes/shipment.routes");
const requireAuth = require("./middlewares/auth.middleware");

const app = express();

app.use(express.json());

// API kiểm tra server
app.get("/", (req, res) => {
    res.status(200).json({
        message: "E-commerce Monolithic API is running",
    });
});

// API đăng ký và đăng nhập
app.use("/api/auth", authRoutes);

// API kiểm tra JWT
app.get("/api/test-auth", requireAuth, (req, res) => {
    res.status(200).json({
        message: "JWT authentication successful",
        user: req.user,
    });
});

// API đặt hàng và xem đơn hàng
app.use("/api/orders", ordersRoutes);

// API xem thông tin giao hàng
app.use("/api/shipment", shipmentRoutes);

module.exports = app;
