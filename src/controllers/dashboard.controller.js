import { asyncHandler } from "../utils/AsyncHandler.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";
import { body } from "express-validator";

const getChannelVideos = asyncHandler(async (req, res) => {
  //get All videos uploaded by channel
  //get videos from db using video model
  //check if fetched successfully
  //return res

  const userId = req.user?._id;

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  // const videos = await Video.find({ owner: userId });

  if (!videos) {
    throw new ApiError(400, "Something went wrong while fetching videos!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Videos fetched successfully.", videos));
});

const getChannelStats = asyncHandler(async (req, res) => {
  //get the channel stats like total video views, total subscribers, total videos, total likes etc.
  //get total videos from db using video model
  //get total video views from video model
  //get total subscriber from db using subscription model
  //get total likes from db using like model
  //return res

  const respose = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
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
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likes",
            },
          },
          {
            $addFields: {
              likesCount: {
                $size: "$likes",
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        totalLikes: {
          $reduce: {
            input: "$videos",
            initialValue: { sum: 0 },
            in: { $sum: ["$$value.sum", "$$this.likesCount"] },
          },
        },
        totalViews: {
          $reduce: {
            input: "$videos",
            initialValue: { sum: 0 },
            in: { $sum: ["$$value.sum", "$$this.views"] },
          },
        },
        totalVideos: {
          $size: "$videos",
        },
      },
    },
    {
      $project: {
        subscribersCount: 1,
        totalLikes: 1,
        totalViews: 1,
        totalVideos: 1,
      },
    },
  ]);

  if (!respose) {
    throw new ApiError(
      500,
      "Something went wrong while fetching channel stats!!"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Channel stats fetched successfully.", respose[0])
    );
});

const getChannelStatsById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(404, "userId required!!");
  }

  const respose = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
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
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likes",
            },
          },
          {
            $addFields: {
              likesCount: {
                $size: "$likes",
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        totalLikes: {
          $reduce: {
            input: "$videos",
            initialValue: { sum: 0 },
            in: { $sum: ["$$value.sum", "$$this.likesCount"] },
          },
        },
        totalViews: {
          $reduce: {
            input: "$videos",
            initialValue: { sum: 0 },
            in: { $sum: ["$$value.sum", "$$this.views"] },
          },
        },
        totalVideos: {
          $size: "$videos",
        },
      },
    },
    {
      $project: {
        subscribersCount: 1,
        totalLikes: 1,
        totalViews: 1,
        totalVideos: 1,
        _id: 1,
        fullName: 1,
        username: 1,
        coverImage: 1,
        avatar: 1,
      },
    },
  ]);

  if (!respose) {
    throw new ApiError(
      500,
      "Something went wrong while fetching channel stats!!"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Channel stats fetched successfully.", respose[0])
    );
});

export { getChannelVideos, getChannelStats, getChannelStatsById };
