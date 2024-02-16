import express from "express";

import { adminOnly } from "../middlewares/auth.js";
import { allOrders, deleteOrder, getMyOrders, getSingleOrderDetails, newOrder, processOrder } from "../controllers/order.js";
const orderRoute = express.Router();

orderRoute.post("/new", newOrder);

orderRoute.get("/my", getMyOrders);
orderRoute.get("/all", adminOnly, allOrders);
orderRoute.route("/:id").get(getSingleOrderDetails).put(adminOnly, processOrder).delete(adminOnly, deleteOrder);

export default orderRoute;
