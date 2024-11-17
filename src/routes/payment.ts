import express from "express";

import {
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  getAllDiscounts,
  getCoupon,
  newCoupon,
  updateCoupon,
} from "../controllers/payment.js";
import { adminOnly } from "../middlewares/auth.js";

const paymentRoute = express.Router();

paymentRoute.post("/create", createPaymentIntent);

paymentRoute.post("/coupon/new", newCoupon);

paymentRoute.get("/discount", applyDiscount);
paymentRoute.get("/coupon/all", adminOnly, getAllDiscounts);


paymentRoute.route("/coupon/:id")  
.get(adminOnly, getCoupon)
.put(adminOnly, updateCoupon)
.delete(adminOnly, deleteCoupon)



export default paymentRoute;
