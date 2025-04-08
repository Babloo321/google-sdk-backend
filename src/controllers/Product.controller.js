import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Product from '../models/Product.model.js';

export const addProduct = asyncHandler(async (req, res) => {
  const { productName, productPrice, discount, company, category } = req.body;

  const userId = req.user?._id;

  if (!productName || !productPrice || !company || !category) {
    throw new ApiError(400, "All fields are required");
  }

  // Find products by user and check for exact match on all three fields
  const products = await Product.find({ user: userId });

  const duplicate = products.find((product) =>
    product.productName === productName &&
    product.company === company &&
    product.category === category
  );

  if (duplicate) {
    throw new ApiError(409, "This product already exists. Please add a different product.");
  }

  const newProduct = await Product.create({
    productName,
    productPrice,
    discount,
    company,
    category,
    owner: userId,
  });

  return res.status(201).json(
    new ApiResponse(201, newProduct, "Product added successfully")
  );
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: User ID missing" });
  }

  // Get pagination params with defaults
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  // Count total products for the user
  const totalProducts = await Product.countDocuments({ owner: userId });

  // Get paginated products
  const products = await Product.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
    }, "User's products fetched successfully")
  );
});
