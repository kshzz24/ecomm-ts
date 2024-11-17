import { NextFunction, Request, Response } from "express";
export interface NewUserReqBody {
  name: string;
  email: string;
  photo: string;
  gender: string;
  _id: string;
  dob: Date;
}

export interface NewProductReqBody {
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
}

export type ControllerType = (
  req: Request<any>,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export type SearchRequestQuery = {
  search?: string;
  price?: string;
  category?: string;
  sort?: string;
  page?: string;
};

export interface BaseQuery {
  name?: {
    $regex: string;
    $options: string;
  };
  category?: string;
  price?: {
    $lte: number;
  };
}

export type InvalidateCacheProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  review?: boolean;
  userId?: string;
  orderId?: string;
  productId?: string | string[];
};

export type OrderItemType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
};

export type shippingInfoType = {
  address: string;
  state: string;
  city: string;
  country: string;
  pinCode: number;
};

export interface NewOrderReqBody {
  shippingInfo: shippingInfoType;
  user: string;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  orderItems: OrderItemType[];
}
