import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
