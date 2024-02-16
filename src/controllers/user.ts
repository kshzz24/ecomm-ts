import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { NewUserReqBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";
export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    // this called catch (next will catch app.useMiddleware)
    const { name, email, photo, gender, _id, dob } = req.body;
    let user = await User.findById(_id);

    if (user) {
      return res.status(200).json({
        success: true,
        message: `Welcome ${user.name}`,
      });
    }

    if (!_id || !name || !email || !photo || !gender || !dob)
      return next(new ErrorHandler("Please Enter All fields", 400));

    user = await User.create({
      name,
      email,
      photo,
      gender,
      _id,
      dob: new Date(dob),
    });

    return res.status(201).json({
      success: true,
      message: `Welcome, ${user.name}`,
    });
  }
);

export const getAllUsers = TryCatch(
  async (
    req: Request<{}, {}, NewUserReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    const users = await User.find({});
    return res.status(200).json({
      success: true,
      users,
    });
  }
);

export const getAUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    const _id = req.params;

    const user = await User.findById(_id);
    if (!user) return next(new ErrorHandler("Invalid ID", 400));
    return res.status(200).json({
      success: true,
      user,
    });
  }
);

export const deleteAUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    const _id = req.params;
    const user = await User.findById(_id);
    if (!user) {
      return next(new ErrorHandler("No Such User Exists", 400));
    }
    await User.findByIdAndDelete(_id);

    return res.status(200).json({
      success: true,
      message: `User ${user.name} deleted`,
    });
  }
);
