import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
  // console.log(req.body);
  // console.log(req.files);

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
    username: username.toLowerCase().trim(),
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
  // console.log(req.body);

  if (!username && !email) {
    throw new ApiError(401, "username or email is required");
  }

  if (!password) {
    throw new ApiError(401, "Password is required!!");
  }

  // console.log(req.body);

  const user = await User.findOne({
    $or: [{ username }, { email }],
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

const refreshAccessToken = asyncHandler(async (req, res) => {
  //get refreshtoken from cookies
  //check if refreshtoken exist
  //verify refreshtoken
  //compare with database refreshtoken
  //generate new access and refresh token
  //return response

  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    throw new ApiError(401, "Refresh token not exist!!");
  }

  const decodedToken = await jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET
  );

  if (!decodedToken) {
    throw new ApiError(404, "refresh token expired!!");
  }

  const user = await User.findById(decodedToken._id);

  if (!user) {
    throw new ApiError(401, "Invalid Refresh Token!!");
  }

  if (token !== user.refreshToken) {
    throw new ApiError(401, "Refresh Token expired or used!!");
  }

  const { accessToken, refreshToken } = generateAccessTokenAndRefreshToken(
    user._id
  );

  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        refreshToken: refreshToken,
      },
    },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, "Successfully refreshed token.", {
      refreshToken,
      accessToken,
    })
  );
});

const changePassword = asyncHandler(async (req, res) => {
  //get data from req
  //validate data
  //get current user from middleware
  //check existing password is valid or not
  //update password in database
  //return res

  const { password, newPassword } = req.body;

  if (!password || !newPassword) {
    throw new ApiError(401, "All fields are required!!");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(401, "user not exist!!");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is incorrect!!");
  }

  user.password = newPassword;
  //password will be hashed because of pre hook used in user.models.js file
  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password Updated Successfully."));
});

const updateUserData = asyncHandler(async (req, res) => {
  //get data from req
  //validate data
  //get current user from middleware
  //update data in database
  //return updated data in res

  const { fullName, email } = req.body;
  // console.log(req.body);

  if (!fullName || !email) {
    throw new ApiError(401, "All fields are required!!");
  }

  const user = req.user;

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Information updated successfully.", updatedUser)
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
  //get avatar from middleware
  //validate avatar
  //upload on cloudinary and check if uploaded
  //update in database
  //return res

  // console.log(req.file);
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(
      401,
      "Something went wrong while getting avatar image!!"
    );
  }

  const avatarUrl = await uploadOnCloudinary(avatarLocalPath);

  if (!avatarUrl) {
    throw new ApiError(
      401,
      "Something went wrong while uploading avatar on cloudinary!!"
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarUrl.url,
      },
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new ApiError(401, "Something went wrong while updating in database");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  //get avatar from middleware
  //validate avatar
  //upload on cloudinary and check if uploaded
  //update in database
  //return res

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(401, "Something went wrong while getting cover image!!");
  }

  const coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImageUrl) {
    throw new ApiError(
      401,
      "Something went wrong while uploading cover Image on cloudinary!!"
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImageUrl.url,
      },
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new ApiError(401, "Something went wrong while updating in database");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "coverImage updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  //get current user from middleware
  //return res

  const user = req.user;

  return res.status(200).json(
    new ApiResponse(200, "current user successfully fetched.", {
      currentUser: user,
    })
  );
});

const getChannelInfo = asyncHandler(async (req, res) => {
  //get channelId from params
  //validate channelId
  //write aggregation pipeline and get subscriberCount
  //return res with data returned by aggregation pipeline

  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "username does not exist!!");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriptions",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        subscriptionCount: {
          $size: "$subscriptions",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        subscriptionCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel) {
    throw new ApiError(404, "Channel does not exist!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Channel Fetched Successfully.", channel[0]));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  //get user from middlerware
  //use userId and write aggregate pipelines to obtain watchHistory
  //return res

  const user = req.user;

  if (!user) {
    throw new ApiError(400, "user not exist!!");
  }

  // const currentUser = await User.findById(req.user._id);

  const watchHistory = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    refreshToken: 0,
                    password: 0,
                    watchHistory: 0,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        watchHistory: "$watchHistory",
      },
    },
    {
      $project: {
        refreshToken: 0,
        password: 0,
      },
    },
  ]);

  if (!watchHistory) {
    throw new ApiError(
      400,
      "Soemthing went wrong during fetching watchHistory"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      "Successfully fetched watch history",
      // watchHistory[0]
      watchHistory[0]
    )
  );
});

const addVideoToWatchHistory = asyncHandler(async (req, res) => {
  //get videoId from params
  //check if exist
  //get current user from db
  //add current videoId to user watchhistory
  //return res

  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(404, "VideoId is required!!");
  }

  const currentUser = await User.findById(req.user._id);

  const isIncluded = currentUser.watchHistory.includes(videoId);

  if (!isIncluded) {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          watchHistory: videoId,
        },
      },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      throw new ApiError("500", "something went wrong while updating user");
    }
  }

  const payload = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
      },
    },
    {
      $addFields: {
        watchHistory: "$watchHistory",
      },
    },
    {
      $project: {
        refreshToken: 0,
        password: 0,
      },
    },
  ]);

  if (!payload || payload.length <= 0) {
    throw new ApiError(500, "Something went wrong!!");
  }

  const user = payload[0];

  return res.json(
    new ApiResponse(200, "Successfully added video to watchHistory", user)
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  updateAvatar,
  updateUserData,
  updateCoverImage,
  getWatchHistory,
  getChannelInfo,
  getCurrentUser,
  addVideoToWatchHistory,
};
