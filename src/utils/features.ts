import mongoose, { Document, connection } from "mongoose";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import { myCache, redis } from "../app.js";
import { Product } from "../models/product.js";
import { Order } from "../models/order.js";
import { es } from "@faker-js/faker";
import { v2 as Cloudinary, UploadApiResponse } from "cloudinary";
import { Review } from "../models/review.js";
import IORedis from "ioredis";

// LObaryrnZNaVoxV2
// kshitizb02

const getBase64 = (file: Express.Multer.File) => {
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

export const connectRedis = (redisURI: string) => {
  const redis = new IORedis(redisURI);

  redis.on("connect", () => {
    console.log("Redis Connected");
  });

  redis.on("error", (error: any) => {
    console.error("Redis Connection Error:", error);
  });
  return redis;
};

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Ecomm_24",
    })
    .then((c) => console.log(`DB Connect to ${c.connection.host}`))
    .catch((e) => console.log(e));
};

export const invalidatesCache = async ({
  product,
  admin,
  order,
  userId,
  orderId,
  productId,
  review,
}: InvalidateCacheProps) => {
  if (review) {
    await redis.del([`reviews-${productId}`]);
  }

  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object")
      productId.forEach((i) => productKeys.push(`product-${i}`));

    await redis.del(productKeys);
  }
  if (order) {
    const ordersKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    await redis.del(ordersKeys);
  }
  if (admin) {
    await redis.del([
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
  const data: number[] = new Array(length).fill(0);

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
export const uploadToCloudinary = async (files: Express.Multer.File[]) => {
  // for single
  // const result = await Cloudinary.uploader.upload(getBase64(files[0]));

  // for multiple upload we cannot use for loop as it will stop for each iteration
  // console.log(files, "filessss");
  const promises = files.map(async (file) => {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      Cloudinary.uploader.upload(getBase64(file), (error, result) => {
        if (error) return reject(error);
        resolve(result!);
      });
    });
  });

  const result = await Promise.all(promises);
  return result.map((i) => ({
    public_id: i.public_id,
    url: i.url,
  }));
};

export const deleteMultipleImages = async (publicIds: string[]) => {
  const promises = publicIds.map(async (publicId) => {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      Cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result!);
      });
    });
  });

  const result = await Promise.all(promises);
};

export const findAverageRatings = async (
  productId: mongoose.Types.ObjectId
) => {
  let totalRating = 0;

  const reviews = await Review.find({ product: productId });
  reviews.forEach((review) => {
    totalRating += review.rating;
  });

  const averateRating = Math.floor(totalRating / reviews.length) || 0;

  return {
    numOfReviews: reviews.length,
    ratings: averateRating,
  };
};
