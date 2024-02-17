import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  NewProductReqBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { faker } from "@faker-js/faker";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";
import { v2 as cloudinary } from "cloudinary"

// Revaildate on new, update or delete Product & New Order

export const getLatestProducts = TryCatch(
  async (
    req: Request<{}, {}, NewProductReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    let products = [];

    if (myCache.has("latest-products")) {
      products = JSON.parse(myCache.get("latest-products") as string);
    } else {
      products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
      myCache.set("latest-products", JSON.stringify(products));
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
    let categories = [];

    if (myCache.has("categories")) {
      categories = JSON.parse(myCache.get("categories") as string);
      myCache.set("categories", JSON.stringify(categories));
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
    let products = [];
    if (myCache.has("all-products")) {
      products = JSON.parse(myCache.get("all-products") as string);
    } else {
      products = await Product.find({});
      myCache.set("all-products", JSON.stringify(products));
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
    if (myCache.has(`product-${_id._id}`)) {
      product = JSON.parse(myCache.get(`product-${_id._id}`) as string);
    } else {
      product = await Product.findById(_id);

      if (!product)
        return next(new ErrorHandler("Product Does not Exist", 400));

      myCache.set(`product-${_id._id}`, JSON.stringify(product));
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
    const { name, price, category, stock } = req.body;
    console.log(req.body);

    
    console.log(req.file);
    
    const photo = req.file;
  
    console.log(req.file);
    
    if (!photo) return next(new ErrorHandler("Photo Not Avaliable", 400));
    // if (!name || !price || !stock || !category) {
    // //   rm(photo.path, () => {
    // //     console.log("Invalid Product Image Deleted");
    // //   });
    // //   return next(new ErrorHandler("Please enter all details", 400));
    // }

    
    const result = await cloudinary.uploader.upload(req.file?.path!, {
      folder: "ecomm-ts"
    })
    
    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: result?.secure_url,
    });

    invalidatesCache({ product: true,    admin: true, });

    return res.status(201).json({
      success: true,
      message: "Product Created Successfully"
    });
  }
);

export const updateProduct = TryCatch(async (req, res, next) => {
  const _id = req.params;

  const { name, stock, category, price } = req.body;

  const photo = req.file;
  const product = await Product.findById(_id);
  if (!product) return next(new ErrorHandler("Product Doesnt exists", 400));
  
  if(photo){

  await cloudinary.uploader.destroy(product.photo);
  const result = await cloudinary.uploader.upload(req.file?.path!, {
    folder: "ecomm-ts"
  })

   product.photo = result.secure_url;
  
}
  if (name) product.name = name;
  if (price) product.price = price;
  if (category) product.category = category;
  if (stock) product.stock = stock;
  
  console.log(product);

  await product.save();

  invalidatesCache({ product: true, productId : String( product._id),     admin: true, });

  return res.status(200).json({
    success: true,
    message: "Product updated Successfully",
  });
});

export const deleteProduct = TryCatch(
  async (
    req,
    res,
    next
  ) => {
    const _id = req.params;
    
    const product = await Product.findById(_id);
    if (!product) return next(new ErrorHandler("Product Does not Exist", 400));
    await cloudinary.uploader.destroy(product.photo);
    await Product.findByIdAndDelete(_id);
    invalidatesCache({ product: true, productId : String( product._id),     admin: true, });
    return res.status(200).json({
      success: true,
      message: "Product Deleted Successfully",
    });
  }
);

export const getAllProducts = TryCatch(
  async (
    req: Request<{}, {}, {}, SearchRequestQuery>,
    res: Response,
    next: NextFunction
  ) => {
    const { search, price, sort, category } = req.query;

    const page = Number(req.query.page) || 1;
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

    const [products, filteredProducts] = await Promise.all([
      Product.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip),
      Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredProducts.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

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
