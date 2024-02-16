import { User } from "../models/user.js";
import { NewUserReqBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";
import { NextFunction, Request, Response } from "express";

// middle ware to make sure only admin is allowed
export const adminOnly = TryCatch(async( req: Request<{}, {}, NewUserReqBody>,
    res: Response,
    next: NextFunction)=>{
    const { _id } = req.query;
     if(!_id) return next(new ErrorHandler("Please Login First", 401));
     const user = await User.findById(_id);
     if(!user) return next(new ErrorHandler("Invalid ID", 401));
     if(user.role!=="admin") return next(new ErrorHandler("Only Accessible to Admin", 400));

     next();
})