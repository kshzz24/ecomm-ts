import express from "express";
import Stripe from "stripe";
import { errorMiddleware } from "./middlewares/error.js";
import userRoute from "./routes/user.js";
import NodeCache from "node-cache";
import { connectDB, connectRedis } from "./utils/features.js";
import productRouter from "./routes/product.js";
import orderRoute from "./routes/order.js";
import { config } from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import paymentRoute from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";
config({
  path: "./.env",
});

const port = process.env.PORT || 4000;
let uri = process.env.DB_URL || "";
const stripeKey = process.env.STRIPE_KEY || "";
const redisURI = process.env.REDIS_URI || ""
connectDB(uri);
export const redis = connectRedis(redisURI);
export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET_API,
});

console.log(process.env.CLOUDINARY_NAME);

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send(" API Working with /api/v1ssss");
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);

// app.use("/uploads", express.static("uploads"));
// Error handling
app.use(errorMiddleware);
app.listen(port, () => {
  console.log("Server is working on Port", port);
});
