import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/utility-class.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
    err.message ||= "Maa chuda mai nhi bta rha";
    err.statusCode ||= 500;

    if(err.name === "CastError") err.message="INVALID ID Format";

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};


export const TryCatch = (func:ControllerType) => {
   return (req:Request , res:Response, next:NextFunction) => {
     // next going to app.use(errorMiddleware)
      return Promise.resolve(func(req, res, next)).catch(next);
   }
}