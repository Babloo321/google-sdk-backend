import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
const generateAccessAndRefereshTokens = async userId => {
  try {
    let user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshTokenToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

export const registerUser = asyncHandler (async (req,res) => {
  const { userName, password, email } = req.body;
  if ([userName, password].some(field => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    if (existedUser.isGoogleAuth) {
      throw new ApiError(409, "Email already exists with Google Sign-In. Please use Google login.");
    }
    throw new ApiError(409, "User with this username or email already exists");
  }

  const pictureLocalFile = req.file?.path;

console.log("picture LocalFile: ",pictureLocalFile)
  if (!pictureLocalFile) {
    throw new ApiError(400, "Picture image is required");
  }
  const picture = await uploadOnCloudinary(pictureLocalFile,)
  if(!picture){
    throw new ApiError(500, "Error on Cloudinary plateform");
  }
  const picturePublicId = picture.public_id;
  const user = await User.create({
    userName,
    email,
    password,
    picture:picture.url,
    pictureId:picturePublicId,
    isGoogleAuth: false,
  });

  const createdUser = await User.findById(user._id).select("-password -__v");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  console.log("User Created successfully");

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;
  if (!userName || !password) {
    throw new ApiError(400, "Username and password are required");
  }

  const user = await User.findOne({ userName });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isGoogleAuth) {
    throw new ApiError(403, "This account is registered with Google Sign-In. Please login using Google.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 days
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    maxAge: 28 * 24 * 60 * 60 * 1000,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { user, accessToken, refreshToken }, "User logged in successfully"));
});

export const googleAuthHandler = asyncHandler(async (req, res) => {
  const { email, name, password, picture } = req.body;

  if (!email || !name) {
    throw new ApiError(400, "Email and name are required from Google");
  }

  let user = await User.findOne({ email }).select('-password');;

  if (!user) {
    // User is signing up with Google for the first time
    user = await User.create({
      email,
      userName: email.split("@")[0], // fallback
      name,
      picture,
      password, // store hashed anyway
      isGoogleAuth: true,
    });
  }

  // Token generation
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshTokenToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Set cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    maxAge: 10 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(new ApiResponse(200, {
    user,
    accessToken,
    refreshToken
  }, "Google Auth Success"));
});


export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },    // this can remove refreshToken from user Database
    },
    { new: true }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken",cookieOptions);
  console.log("User logOut successfully");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const refreshAccessTokenGenerator = asyncHandler(async (req, res) => {
  const incomingRefereshToken =
    req.cookies?.refreshToken
  if (!incomingRefereshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefereshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid RefreshToken");
    }

    if (incomingRefereshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token in Expired or Used");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(
      user._id
    );
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    const cookieOptions = {
      httpOnly: true,
      secure: false,
    };

    res.cookie("accessToken", accessToken, {
      cookieOptions,
      maxAge: 1 * 60 * 60 * 1000, // 1 day
    });
  
    res.cookie("refreshToken", refreshToken, {
      cookieOptions,
      maxAge: 28 * 24 * 60 * 60 * 1000, // 10 days
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user, refreshToken, accessToken },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Unauthorized Request || Invalid Refresh Token"
    );
  }
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized: No user found");
  }

  const user = await User.findById(userId).select("-password"); // exclude password

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});