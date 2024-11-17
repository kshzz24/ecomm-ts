import { redis } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import {
  calculatePercentage,
  getChartData,
  getInventories,
} from "../utils/features.js";

export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats;

  const key = "admin-stats";
  stats = await redis.get(key);
  if (stats) {
    stats = JSON.parse(stats);
  } else {
    const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };
    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const lastSixMonthOrderPromise = Order.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    });

    const latestTransactionPromise = Order.find({})
      .select(["orderItems", "discount", "total", "status"])
      .limit(4);

    const [
      thisMonthOrders,
      thisMonthProducts,
      thisMonthUsers,
      lastMonthOrders,
      lastMonthProducts,
      lastMonthUsers,
      allOrders,
      ProductCount,
      UserCount,
      lastSixMonthOrders,
      categories,
      femaleUsers,
      latestTransaction,
    ] = await Promise.all([
      thisMonthOrdersPromise,
      thisMonthProductsPromise,
      thisMonthUsersPromise,
      lastMonthOrdersPromise,
      lastMonthProductsPromise,
      lastMonthUsersPromise,
      Order.find({}).select("total"),
      Product.countDocuments(),
      User.countDocuments(),
      lastSixMonthOrderPromise,
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestTransactionPromise,
    ]);
    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const changePercentage = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
      order: calculatePercentage(
        thisMonthOrders.length,
        lastMonthOrders.length
      ),
      product: calculatePercentage(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),
      user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
    };

    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const count = {
      revenue,
      user: UserCount,
      product: ProductCount,
      order: allOrders.length,
    };

    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthlyRevenue = new Array(6).fill(0);

    lastSixMonthOrders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDifference =
        (today.getMonth() - creationDate.getMonth() + 12) % 12;
      if (monthDifference < 6) {
        orderMonthCounts[6 - monthDifference - 1] += 1;
        orderMonthlyRevenue[6 - monthDifference - 1] += order.total;
      }
    });

    const categoryCount: Record<string, number>[] = await getInventories({
      categories,
      ProductCount,
    });

    const userRatio = {
      male: UserCount - femaleUsers,
      female: femaleUsers,
    };

    const modifiedLatestTransaction = latestTransaction.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status,
    }));

    stats = {
      latestTransaction: modifiedLatestTransaction,
      userRatio,
      categoryCount,
      changePercentage,
      count,
      chart: { order: orderMonthCounts, revenue: orderMonthlyRevenue },
    };

    await redis.set(key, JSON.stringify(stats));
  }
  return res.status(200).json({
    success: true,
    stats,
  });
});

export const getPieChartStats = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-pie-charts";
  charts = await redis.get(key);
  if (charts) {
    charts = JSON.parse(charts);
  } else {
    const allOrderPromise = Order.find({}).select([
      "total",
      "discount",
      "subtotal",
      "tax",
      "shippingCharges",
    ]);
    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      ProductCount,
      outOfStock,
      allOrders,
      allUsersDOB,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrderPromise,
      User.find({}).select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const orderFullfillment = {
      processing: processingOrder,
      shipping: shippedOrder,
      delivered: deliveredOrder,
    };
    const productCategories: Record<string, number>[] = await getInventories({
      categories,
      ProductCount,
    });

    const stockAvailability = {
      instock: ProductCount - outOfStock,
      outOfStock,
    };

    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );
    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );
    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );
    const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);

    const marketingCost = Math.round(grossIncome * (30 / 100));
    const netMargin =
      grossIncome - discount - marketingCost - productionCost - burnt;

    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost,
    };

    const usersAgeGroup = {
      teen: allUsersDOB.filter((i) => i.age < 20).length,
      adult: allUsersDOB.filter((i) => i.age >= 20 && i.age < 40).length,
      old: allUsersDOB.filter((i) => i.age >= 40).length,
    };

    const adminCustomers = {
      admin: adminUsers,
      customer: customerUsers,
    };

    charts = {
      orderFullfillment,
      productCategories,
      stockAvailability,
      revenueDistribution,
      usersAgeGroup,
      adminCustomers,
    };

    await redis.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getBarChartStats = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-bar-charts";
  charts = await redis.get(key);
  if (charts) {
    charts = JSON.parse(charts);
  } else {
    const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const tweleveMonthsAgo = new Date();
    tweleveMonthsAgo.setMonth(tweleveMonthsAgo.getMonth() - 12);

    const sixMonthProductPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const sixMonthUserPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const tweleveMonthOrderPromise = Order.find({
      createdAt: {
        $gte: tweleveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const [products, users, orders] = await Promise.all([
      sixMonthProductPromise,
      sixMonthUserPromise,
      tweleveMonthOrderPromise,
    ]);

    const productCounts = getChartData({ length: 6, today, docArr: products });

    const userCounts = getChartData({ length: 6, today, docArr: users });

    const orderCounts = getChartData({ length: 12, today, docArr: orders });

    charts = {
      users: userCounts,
      products: productCounts,
      orders: orderCounts,
    };

    await redis.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getLineChartStats = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-line-charts";
  charts = await redis.get(key);

  if (charts) {
    charts = JSON.parse(charts);
  } else {
    const today = new Date();

    const tweleveMonthsAgo = new Date();
    tweleveMonthsAgo.setMonth(tweleveMonthsAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: tweleveMonthsAgo,
        $lte: today,
      },
    };

    const tweleveMonthUserPromise = User.find(baseQuery).select("createdAt");

    const tweleveMonthProductPromise =
      Product.find(baseQuery).select("createdAt");

    const tweleveMonthOrderPromise = Order.find(baseQuery).select([
      "createdAt",
      "discount",
      "total",
    ]);

    const [products, users, orders] = await Promise.all([
      tweleveMonthProductPromise,
      tweleveMonthUserPromise,
      tweleveMonthOrderPromise,
    ]);

    const productCounts = getChartData({ length: 12, today, docArr: products });

    const userCounts = getChartData({ length: 12, today, docArr: users });

    const discount = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "discount",
    });
    const revenue = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "total",
    });

    charts = {
      users: userCounts,
      products: productCounts,
      discount,
      revenue,
    };

    await redis.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});
