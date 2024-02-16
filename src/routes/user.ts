import express from "express";
import { deleteAUser, getAUser, getAllUsers, newUser } from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";
const userRoute = express.Router();


userRoute.post("/new", newUser);
userRoute.get("/all", adminOnly, getAllUsers);
userRoute.route("/:_id").get(getAUser).delete(adminOnly, deleteAUser);


export default userRoute;