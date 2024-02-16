import express from "express";

import {
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  getAllDiscounts,
  newCoupon,
} from "../controllers/payment.js";
import { adminOnly } from "../middlewares/auth.js";

const paymentRoute = express.Router();

paymentRoute.post("/create", createPaymentIntent)

paymentRoute.post("/coupon/new", newCoupon);

paymentRoute.get("/discount", applyDiscount);
paymentRoute.get("/coupon/all", adminOnly, getAllDiscounts);
paymentRoute.delete("/coupon/:id", adminOnly, deleteCoupon)
export default paymentRoute;
