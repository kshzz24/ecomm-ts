import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { NewOrderReqBody } from "../types/types.js";
import { Request } from "express";
import { invalidatesCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../app.js";

export const getMyOrders = TryCatch(async (req, res, next) => {
  // user id
  const { id: user } = req.query;

  const key = `my-orders-${user}`;
  let orders = [];

  if (myCache.has(key)) {
    orders = JSON.parse(myCache.get(key) as string);
  } else {
    orders = await Order.find({ user });
    myCache.set(key, JSON.stringify(orders));
  }
  return res.status(200).json({
    sucess: true,
    orders,
  });
});

export const allOrders = TryCatch(async (req, res, next) => {
  // user id

  const key = `all-orders`;
  let orders = [];

  if (myCache.has(key)) {
    orders = JSON.parse(myCache.get(key) as string);
  } else {
    orders = await Order.find().populate("user", "name");
    myCache.set(key, JSON.stringify(orders));
  }
  return res.status(200).json({
    sucess: true,
    orders,
  });
});

export const getSingleOrderDetails = TryCatch(async (req, res, next) => {
  // user id
  const { id } = req.params;
  console.log(id);

  const key = `order-${id}`;

  let order;

  if (myCache.has(key)) {
    order = JSON.parse(myCache.get(key) as string);
  } else {
    order = await Order.findById(id).populate("user", "name");
    if (!order) return next(new ErrorHandler("Invalid Order", 404));
    myCache.set(key, JSON.stringify(order));
  }
  return res.status(200).json({
    sucess: true,
    order,
  });
});
export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderReqBody>, res, next) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      discount,
      total,
      shippingCharges,
    } = req.body;
    console.log(orderItems);
    
    let { pinCode } = shippingInfo;
    shippingInfo.pinCode = Number(pinCode);
  //   console.log(updatedShippingInfo);
  //  //  const updatedOrderItems = orderItems.filter((orderItem)=> orderItem. )

    if (
      !shippingInfo ||
      !user ||
      !subtotal ||
      !total ||
      !tax ||
      !orderItems
    ) {
      return next(new ErrorHandler("Please Fill all Details", 400));
    }

    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      discount,
      total,
      shippingCharges,
    });

    await reduceStock(orderItems);
    const temp = order.orderItems.map((i) => String(i.productId));
    invalidatesCache({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId: temp,
    });

    return res.status(201).json({
      sucess: true,
      message: "Order Placed Successfully",
    });
  }
);

export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  invalidatesCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: id,
  });

  return res.status(200).json({
    sucess: true,
    message: "Order Processed Successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  await order.deleteOne();
  invalidatesCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    // String(order._id)
    orderId: id,
  });

  return res.status(200).json({
    sucess: true,
    message: "Order Deleted Successfully",
  });
});
