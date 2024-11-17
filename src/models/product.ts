import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Name"],
      default: "user",
    },
    photos: [
      {
        public_id: {
          type: String,
          required: [true, "Please Enter public id"],
        },
        url: {
          type: String,
          required: [true, "Please Enter public url"],
        },
      },
    ],
    price: {
      type: Number,
      required: [true, "Please Enter Price"],
      min: 10,
    },

    stock: {
      type: Number,
      required: [true, "Please Enter Stock"],
    },
    description: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Please Enter Category"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model("Product", schema);
