import express from "express";
import Stripe from "stripe";
import { errorMiddleware } from "./middlewares/error.js";
import userRoute from "./routes/user.js";
import NodeCache from "node-cache";
import { connectDB } from "./utils/features.js";
import productRouter from "./routes/product.js";
import orderRoute from "./routes/order.js";
import { config } from "dotenv";
import morgan from "morgan";
import cors from "cors";
import paymentRoute from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";
config({
  path: "./.env",
});

const port = process.env.PORT || 4000;
let uri = process.env.DB_URL || "";
const stripeKey = process.env.STRIPE_KEY || "";
connectDB(uri);

export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send(" API Working with /api/v1");
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);

app.use("/uploads", express.static("uploads"));
// Error handling
app.use(errorMiddleware);
app.listen(port, () => {
  console.log("Server is working on Port", port);
});
