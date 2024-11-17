import express from "express";
import {
  addNewProduct,
  deleteProduct,
  deleteReview,
  getAdminProducts,
  getAllCategory,
  getAllProducts,
  getLatestProducts,
  getSingleProductDetails,
  reviewProduct,
  getAllReviews,
  updateProduct,
} from "../controllers/product.js";
import { mulitUpload } from "../middlewares/multer.js";
import { adminOnly } from "../middlewares/auth.js";

const productRouter = express.Router();

productRouter.post("/new", mulitUpload, addNewProduct);

productRouter.get("/all", getAllProducts);

productRouter.get("/latest", getLatestProducts);

productRouter.get("/category", getAllCategory);

productRouter.get("/admin-products", adminOnly, getAdminProducts);

productRouter
  .route("/:_id")
  .get(getSingleProductDetails)
  .put(adminOnly, mulitUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

   productRouter.get("/reviews/:id", getAllReviews)
  productRouter.post("/review/new/:id",reviewProduct)
  productRouter.delete("/review/:id",deleteReview)


export default productRouter;
