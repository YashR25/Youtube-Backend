import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //get videoId from Params
  //check if owner/current_userId exist in db (likes collection)
  //if exist than check below else add entry
  //check if videoId already exist in current entry
  //if exist than update like entry else add entry
  //check if updated successfully
  //return res

  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "videoId not exist!!");
  }

  const like = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
  ]);

  if (!like) {
    throw new ApiError(
      500,
      "Something went wrong while fetching data from db!!"
    );
  }

  if (like.length <= 0) {
    await Like.create({
      likedBy: req.user?._id,
      video: videoId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Liked video successfully.", { isLiked: true })
      );
  } else {
    await Like.deleteOne({ _id: like[0]._id });
    return res
      .status(200)
      .json(
        new ApiResponse(200, "unLiked video successfully.", { isLiked: false })
      );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //get CommentId from params
  //check if owner/current_userId exist in db (likes collection)
  //if exist than check below else add entry
  //check if CommentId already exist in current entry
  //if exist than update like entry else add entry
  //check if updated successfully
  //return res

  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "commentId not exist!!");
  }

  const like = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $match: {
        comment: new mongoose.Types.ObjectId(commentId),
      },
    },
  ]);

  if (!like) {
    throw new ApiError(
      500,
      "Something went wrong while fetching data from db!!"
    );
  }

  if (like.length <= 0) {
    const updatedLike = await Like.create({
      likedBy: req.user?._id,
      comment: commentId,
    });
    return res.status(200).json(
      new ApiResponse(200, "Liked comment successfully.", {
        id: updatedLike.comment,
        isLiked: true,
      })
    );
  } else {
    await Like.deleteOne({ _id: like[0]._id });
    return res.status(200).json(
      new ApiResponse(200, "unLiked comment successfully.", {
        id: like[0].comment,
        isLiked: false,
      })
    );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //get tweetId from params
  //check if owner/current_userId exist in db (likes collection)
  //if exist than check below else add entry
  //check if tweetId already exist in current entry
  //if exist than update like entry else add entry
  //check if updated successfully
  //return res

  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "tweetId not exist!!");
  }

  const like = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $match: {
        tweet: new mongoose.Types.ObjectId(tweetId),
      },
    },
  ]);

  console.log(like);

  if (!like) {
    throw new ApiError(
      500,
      "Something went wrong while fetching data from db!!"
    );
  }

  if (like.length <= 0) {
    await Like.create({
      likedBy: req.user?._id,
      tweet: tweetId,
    });
    return res.status(200).json(
      new ApiResponse(200, "Liked tweet successfully.", {
        tweetId,
        isLiked: true,
      })
    );
  } else {
    await Like.deleteOne({ _id: like[0]._id });
    return res.status(200).json(
      new ApiResponse(200, "unLiked tweet successfully.", {
        tweetId,
        isLiked: false,
      })
    );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //get user from middleware
  //get videos from likes collection in db by matching userId
  //check if fetched successfully
  //return res

  const userId = req.user?._id;

  const { page, limit } = req.query;

  const pipeline = [
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
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
                    username: 1,
                    fullName: 1,
                    email: 1,
                    thumbnail: 1,
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
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: {
          $first: "$video",
        },
      },
    },
    {
      $project: {
        video: 1,
      },
    },
  ];

  const likedVideos = Like.aggregate(pipeline);

  const result = await Like.aggregatePaginate(likedVideos, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  if (!likedVideos) {
    throw new ApiError(
      500,
      "Something went wrong while fetching liked videos!!"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "All liked videos fetched succesfully.", result)
    );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
