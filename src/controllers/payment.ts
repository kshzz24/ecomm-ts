import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";

export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount, description, customer, shipping } = req.body;
  // console.log(amount, description, shipping, currency, confirm, customer);

  console.log(shipping);

  if (!amount) return next(new ErrorHandler("Please Enter amount", 400));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100,
    currency: "inr",
    description,
    customer,
    shipping,
    // shipping,
    // confirm,
    // customer
  });

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

export const newCoupon = TryCatch(async (req, res, next) => {
  const { code, amount } = req.body;

  if (!code || !amount)
    return next(new ErrorHandler("Please add both coupon and amount", 400));
  await Coupon.create({ code, amount });
  return res.status(201).json({
    success: true,
    message: `Coupon ${code} Created Successfully`,
  });
});

export const applyDiscount = TryCatch(async (req, res, next) => {
  const { coupon } = req.query;
  console.log(coupon);

  const discount = await Coupon.findOne({ code: coupon });
  if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));
  return res.status(201).json({
    success: true,
    discount: discount.amount,
  });
});
export const getAllDiscounts = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});
  return res.status(201).json({
    success: true,
    coupons,
  });
});
export const getCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);

  if (!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));

  return res.status(200).json({
    success: true,
    coupon,
  });
});


export const updateCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { code, amount } = req.body;

   console.log(id,  code,amount, 'sssssss')

  const coupon = await Coupon.findById(id);
  if (!coupon) return next(new ErrorHandler("Invalid coupon code", 400));
  if (code) coupon.code = code;
  if (amount) coupon.amount = amount;

  await coupon.save();

  return res.status(201).json({
     success: true,
     message: "Coupon updated succesfully"
  })


});

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) return next(new ErrorHandler("No Coupon Exists", 400));

  return res.status(200).json({
    success: true,
    message: "Coupon deleted Successfully",
  });
});
