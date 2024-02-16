import express from "express";
import {
  addNewProduct,
  deleteProduct,
  getAdminProducts,
  getAllCategory,
  getAllProducts,
  getLatestProducts,
  getSingleProductDetails,
  updateProduct,
} from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";
import { adminOnly } from "../middlewares/auth.js";

const productRouter = express.Router();

productRouter.post("/new", singleUpload, addNewProduct);

productRouter.get("/all", getAllProducts);

productRouter.get("/latest", getLatestProducts);

productRouter.get("/category", getAllCategory);

productRouter.get("/admin-products", adminOnly, getAdminProducts);

productRouter
  .route("/:_id")
  .get(getSingleProductDetails)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default productRouter;
