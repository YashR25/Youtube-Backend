import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.models.js";
import mongoose from "mongoose";

const getChannelTweets = asyncHandler(async (req, res) => {
  //get channelId from params
  //check if channel Id exist
  //get tweets from databse using channelId
  //if fetched successfully than return res
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "ChannelId not exist!!");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
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
        isLiked: {
          $cond: {
            if: { $in: [req.user?.id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (!tweets) {
    throw new ApiError(
      500,
      "Something went wrong while fetching tweets from db!!"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Channel tweets fetched successfully.", tweets));
});

const addTweet = asyncHandler(async (req, res) => {
  //get content from body
  //check if data exist
  //add data in db
  //check if added successfully
  //return res

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "content field is required!!");
  }

  const addedTweet = await Tweet.create({
    content: content,
    owner: req.user?._id,
  });

  if (!addedTweet) {
    throw new ApiError(500, "Something went wrong while adding tweet in db.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "tweet added successfully.", addTweet));
});

const removeTweet = asyncHandler(async (req, res) => {
  //get tweetId from params
  //check if tweetId exist
  //fetch tweet and see if tweet exist
  //if exist remove it from db
  //also remove the referense (if has) from likes collection in db
  //check if removed successfully
  //return res

  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "TweetId not exist!!");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(
      400,
      "Tweet you are trying to delete is not available in db."
    );
  }

  const response = await Tweet.deleteOne({ _id: tweet._id });

  if (!response || (response && response.deletedCount < 1)) {
    throw new ApiError(500, "Something went wrong while deleting tweet");
  }

  const likeResponse = await Like.find({ tweet: tweetId });

  if (likeResponse && likeResponse.length > 0) {
    await Like.deleteMany({ tweet: tweetId });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully."));
});

const updateTweet = asyncHandler(async (req, res) => {
  //get tweetId from params
  //get content from body
  //check if content and tweetId exist
  //fetch tweet from db using tweetId
  //check if tweet exist
  //update tweet in db
  //check if updated successfully
  //return res

  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId) {
    throw new ApiError(400, "tweetId not exist!!");
  }

  if (!content) {
    throw new ApiError(400, "Content field is required!!");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet you are trying to update is not exist!!");
  }

  tweet.content = content;

  const updatedTweet = await tweet.save({ validateBeforeSave: false });

  if (!updatedTweet) {
    throw new ApiError(
      400,
      "Something went wrong while updating tweet in db!!"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet updated successfully.", updatedTweet));
});

export { addTweet, removeTweet, updateTweet, getChannelTweets };
