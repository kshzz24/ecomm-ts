import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    comment: {
      type: String,
      maxLength: [200, "Comment must not be more than 200 characters"],
    },
    rating: {
      type: Number,
      required: [true, "Please give rating"],
    },
    user: {
      type: String,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", schema);
