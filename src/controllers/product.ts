import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  NewProductReqBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { redis } from "../app.js";
import {
  deleteMultipleImages,
  findAverageRatings,
  invalidatesCache,
  uploadToCloudinary,
} from "../utils/features.js";
import { User } from "../models/user.js";
import { Review } from "../models/review.js";

// Revaildate on new, update or delete Product & New Order

export const getLatestProducts = TryCatch(
  async (
    req: Request<{}, {}, NewProductReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    let products;

    products = await redis.get("latest-products");

    if (products) {
      products = JSON.parse(products);
    } else {
      products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
      await redis.set("latest-products", JSON.stringify(products));
    }

    return res.status(201).json({
      success: true,
      products,
    });
  }
);

// Revaildate on new, update or delete Product & New Order

export const getAllCategory = TryCatch(
  async (
    req: Request<{}, {}, NewProductReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    let categories;
    categories = await redis.get("categories");

    if (categories) {
      categories = JSON.parse(categories);
      await redis.set("categories", JSON.stringify(categories));
    }

    categories = await Product.distinct("category");

    return res.status(201).json({
      success: true,
      categories,
    });
  }
);

export const getAdminProducts = TryCatch(
  async (
    req: Request<{}, {}, NewProductReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    let products;

    products = await redis.get("all-products");
    if (products) {
      products = JSON.parse(products);
    } else {
      products = await Product.find({});
      await redis.set("all-products", JSON.stringify(products));
    }

    return res.status(201).json({
      success: true,
      products,
    });
  }
);

export const getSingleProductDetails = TryCatch(
  async (
    req: Request<{}, {}, NewProductReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    const _id:
      | {
          _id: string;
        }
      | any = req.params;

    let product;

    product = await redis.get(`product-${_id._id}`);

    if (product) {
      product = JSON.parse(product);
    } else {
      product = await Product.findById(_id);

      if (!product)
        return next(new ErrorHandler("Product Does not Exist", 400));

      await redis.set(`product-${_id._id}`, JSON.stringify(product));
    }
    return res.status(201).json({
      success: true,
      product,
    });
  }
);
export const addNewProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, price, category, stock, description } = req.body;

    // return res.status(201).json({
    //   success: true,
    //   data: req,
    // });
    const photos = req.files as Express.Multer.File[] | undefined;
    if (!photos) return next(new ErrorHandler("Photo Not Avaliable", 400));

    if (photos.length < 1)
      return next(new ErrorHandler("Enter Alteast 1 photo", 400));
    if (photos.length > 5)
      return next(new ErrorHandler("Enter Atmost 5 photo", 400));

    if (!name || !price || !stock || !category || !description) {
      return next(new ErrorHandler("Enter All Fields", 400));
    }
    // upoload to cloduinary

    const newPhotosURL = await uploadToCloudinary(photos);

    // const result = await cloudinary.uploader.upload(req.file?.path!, {
    //   folder: "ecomm-ts",
    // });
    console.log(newPhotosURL, "new photo");
    await Product.create({
      name,
      price,
      stock,
      description,
      category: category.toLowerCase(),
      photos: newPhotosURL,
    });

    await invalidatesCache({ product: true, admin: true });

    return res.status(201).json({
      success: true,
      message: "Product Created Successfully",
    });
  }
);

export const updateProduct = TryCatch(async (req, res, next) => {
  const _id = req.params;

  const { name, stock, category, price, description } = req.body;

  const photos = req.files as Express.Multer.File[] | undefined;

  const product = await Product.findById(_id);

  console.log(product, "thisss");
  if (!product) return next(new ErrorHandler("Product Doesnt exists", 400));

  if (photos && photos?.length! > 0) {
    const photosURL = await uploadToCloudinary(photos);
    const publicIds = product.photos.map((photo) => photo.public_id);
    await deleteMultipleImages(publicIds);
    product.photos = photosURL;
  }
  if (name) product.name = name;
  if (price) product.price = price;
  if (category) product.category = category;
  if (stock) product.stock = stock;
  if (description) product.description = description;

  console.log(product);

  await product.save();

  await invalidatesCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "Product updated Successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const _id = req.params;

  const product = await Product.findById(_id);
  if (!product) return next(new ErrorHandler("Product Does not Exist", 400));
  // await cloudinary.uploader.destroy(product.photo);
  const publicIds = product.photos.map((photo) => photo.public_id);
  await deleteMultipleImages(publicIds);

  // have to create for delete all the images in the cloudinary
  await Product.findByIdAndDelete(_id);
  await invalidatesCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });
  return res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

export const getAllProducts = TryCatch(
  async (
    req: Request<{}, {}, {}, SearchRequestQuery>,
    res: Response,
    next: NextFunction
  ) => {
    const { search, price, sort, category } = req.query;

    const page = Number(req.query.page) || 1;

    const key = `products-${search}-${price}-${sort}-${category}-${page}`;
    let totalPage;
    let products;

    const data = await redis.get(key);
    if (data) {
      products = JSON.parse(data);
      totalPage = products.totalPage;
      products = products.products;
    } else {
      const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
      const skip = limit * (page - 1);

      const baseQuery: BaseQuery = {};

      if (search)
        baseQuery.name = {
          $regex: search,
          $options: "i",
        };

      if (price)
        baseQuery.price = {
          $lte: Number(price),
        };
      if (category) baseQuery.category = category;

      const [productsFetched, filteredProducts] = await Promise.all([
        Product.find(baseQuery)
          .sort(sort && { price: sort === "asc" ? 1 : -1 })
          .limit(limit)
          .skip(skip),
        Product.find(baseQuery),
      ]);
      products = productsFetched;
      totalPage = Math.ceil(filteredProducts.length / limit);

      await redis.setex(key, 30, JSON.stringify({ products, totalPage }));
    }

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

export const reviewProduct = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.query.id);
  if (!user) return next(new ErrorHandler("Please Login First", 400));

  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Does not Exist", 400));

  // console.log(product)
  const { comment, rating } = req.body;

  const alreadyReviewed = await Review.findOne({
    user: user._id,
    product: product._id,
  });
  if (alreadyReviewed) {
    alreadyReviewed.comment = comment;
    alreadyReviewed.rating = rating;
    await alreadyReviewed.save();
  } else {
    await Review.create({
      comment,
      rating,
      user: user._id,
      product: product._id,
    });
  }
  const { ratings, numOfReviews } = await findAverageRatings(product._id);
  product.rating = ratings;
  product.numOfReviews = numOfReviews;

  await product.save();

  await invalidatesCache({
    product: true,
    productId: String(product._id),
    admin: true,
    review: true,
  });
  return res.status(200).json({
    success: true,
    message: "Product Reviewed Successfully",
  });
});

export const deleteReview = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.query.id);
  if (!user) return next(new ErrorHandler("Please Login First", 400));

  const review = await Review.findById(req.params.id);
  if (!review) return next(new ErrorHandler("Review Not Found", 400));

  const isAuthenticatedUser = review.user.toString() === user._id.toString();
  if (!isAuthenticatedUser)
    return next(new ErrorHandler("Not Authorized", 400));

  await review.deleteOne();

  const product = await Product.findById(review.product);
  if (!product) return next(new ErrorHandler("Product not found", 400));

  const { ratings, numOfReviews } = await findAverageRatings(product._id);

  product.rating = ratings;
  product.numOfReviews = numOfReviews;

  await product.save();

  await invalidatesCache({
    product: true,
    productId: String(product._id),
    admin: true,
    review: true,
  });
  return res.status(200).json({
    success: true,
    message: "Reviewd Deleted Successfully",
  });
});

export const getAllReviews = TryCatch(async (req, res, next) => {
  let reviews;
  const key = `reviews-${req.params.id}`;
  reviews = await redis.get(key);

  if (reviews) {
    reviews = JSON.parse(reviews);
  } else {
    reviews = await Review.find({
      product: req.params.id,
    })
      .populate("user", "name photo")
      .sort({ updatedAt: -1 });

    await redis.setex(key, 60 * 60, JSON.stringify(reviews));
  }

  return res.status(200).json({
    success: true,
    reviews,
  });
});

// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\5ba9bd91-b89c-40c2-bb8a-66703408f986.png",
//       price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };

//     products.push(product);
//   }

//   await Product.create(products);

//   console.log({ succecss: true });
// };

// const deleteRandomsProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(3);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log({ succecss: true });
// };

// deleteRandomsProducts(40);
