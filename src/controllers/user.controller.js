import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  //find user by id
  //check if user exist
  //generate accesstoken and refreshtoken
  //save the refreshtoken in database
  //return both tokens
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(401, "user not exist!!");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      401,
      "Something went wrong while generating access and refresh token!!"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get data from request
  //validate data
  //check images, check avatar primarily
  //upload on cloudinary,check if uploaded successfully
  //check if user already exist
  //create database object
  //check if user is created on mongodb
  //remove password and refreshtoken field from response
  //send response

  const { fullName, username, email, password } = req.body;

  if (
    [fullName, username, email, password].some((field) => field?.trim() == "")
  ) {
    throw new ApiError(400, "All fields are required!!");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar image is required to register you!!!");
  }

  const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
  const coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarUrl) {
    throw new ApiError(
      400,
      "Something went wrong while uploading avatar image on coudinary!!"
    );
  }

  const checkIfUserExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (checkIfUserExist) {
    throw new ApiError(
      400,
      "User already exist with same username or already registered!!"
    );
  }

  const user = await User.create({
    username: username,
    email: email,
    fullName: fullName,
    avatar: avatarUrl.url,
    coverImage: coverImageUrl?.url || "",
    password: password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(400, "Something went wrong while creating user!!!");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Successfully created user.", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  //get data from req
  //validate data
  //find user in database, check if user exist
  //compare password
  //generate refreshtoken and accesstoken
  //send res, important to send cookies

  const { username, email, password } = req.body;
  console.log(req.body);

  if (!username && !email) {
    throw new ApiError(401, "username or email is required");
  }

  if (!password) {
    throw new ApiError(401, "Password is requires!!");
  }

  const user = await User.findOne({
    $or: [{ username, email }],
  });

  if (!user) {
    throw new ApiError(401, "User not exist!!");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid Credentials!!");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      user: loggedInUser,
      accessToken,
      refreshToken,
    });
});

const logoutUser = asyncHandler(async (req, res) => {
  //get id from req with help of middleware
  //find the user, check if exist
  //remove refreshtoken
  //clear cookies
  //send res

  try {
    const userId = req.user;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );

    if (!user) {
      throw new ApiError(400, "user not exist!!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, "Logged out successfully!!"));
  } catch (error) {
    throw new ApiError(400, "Something went wrong during logout!!");
  }
});

export { registerUser, loginUser, logoutUser };
