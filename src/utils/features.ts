import mongoose, { Document, connection } from "mongoose";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
import { Order } from "../models/order.js";
import { es } from "@faker-js/faker";
// LObaryrnZNaVoxV2
// kshitizb02
export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Ecomm_24",
    })
    .then((c) => console.log(`DB Connect to ${c.connection.host}`))
    .catch((e) => console.log(e));
};

export const invalidatesCache =  ({
  product,
  admin,
  order,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];
    if (typeof productId === "string") {
      productKeys.push(`product-${productId}`);
    }
    if (typeof productId === "object") {
      productId.forEach((i) => {
        productKeys.push(`product-${i}`);
      });
    }
    myCache.del(productKeys);
  }
  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    // const orders = await Order.find({}).select("_id");
    // orders.forEach((i) => {
    //   orderKeys.push(`order-${i._id}`);
    // });

    myCache.del(orderKeys);
  }
  if (admin) {
    myCache.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if (!product) throw new Error("Product Not Found");
    product.stock -= order.quantity;
    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percentage = (thisMonth / lastMonth) * 100;
  return Number(percentage.toFixed(0));
};

export const getInventories = async ({
  categories,
  ProductCount,
}: {
  categories: string[];
  ProductCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / ProductCount) * 100),
    });
  });

  return categoryCount;
};

interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
}) => {
  const data:number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDifference =
      (today.getMonth() - creationDate.getMonth() + 12) % 12;
    if (monthDifference < length) {
      if (property) {
        data[length - monthDifference - 1] += i[property]!;
      } else {
        data[length - monthDifference - 1] += 1;
      }
    }
  });
  return data;
};
