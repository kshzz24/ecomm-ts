import mongoose from "mongoose";
import validator from "validator";



interface IUser extends Document {
    _id: string;
    name: string,
    photo:string,
    email:string,
    role: "admin"|"user";
    gener : "male" | "female";
    dob: Date;
    createdAt: Date;
    updatedAt: Date;
    // virtual attribute
    age:number;

}


const schema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: [true, "Please Enter ID"],
    },
    photo: {
      type: String,
      required: [true, "Please Enter Photo"],
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    name: {
      type: String,
      required: [true, "Please Enter Name"],
      default: "user",
    },
    email: {
      type: String,
      required: [true, "Please Emter Email"],
      unique: [true, "Email Already Exists"],
      validate: validator.default.isEmail,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Please Select Gender"],
    },
    dob: {
      type: Date,
      required: [true, "Please Enter Date of Birth"],
    },
  },
  {
    timestamps: true,
  }
);

schema.virtual("age").get(function () {
  const today = new Date();
  const dob = this.dob;

  let age: number = today.getFullYear() - dob.getFullYear();
  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  ) {
    age = age - 1;
  }
  return age;
});

export const User = mongoose.model<IUser>("User", schema);
