import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.models.js";
import mongoose from "mongoose";

const commonCommentAggregation = (req) => {
  return [
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              usename: 1,
              avatar: 1,
              fullName: 1,
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
        isLiked: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req.user._id),
                "$likes.likedBy",
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
  ];
};

const getVideoComments = asyncHandler(async (req, res) => {
  //get VideoId from Params
  //get page and limit from query
  //check if videoid exist
  //get comments from database by matching videoId in it
  //return res
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "videoId not exist!!");
  }

  const commentAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    ...commonCommentAggregation(req),
  ]);

  const result = await Comment.aggregatePaginate(commentAggregate, {
    page: page,
    limit: limit,
  });

  if (!result) {
    throw new ApiError(
      500,
      "Something went wrong while fetching comments from db!!"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "comments fetched successfully.", result));
});

const addComment = asyncHandler(async (req, res) => {
  //get videoId and comment from body
  //validate data
  //add comments to db
  //check if comment added successfully
  //return res

  const { videoId } = req.params;
  const { comment } = req.body;

  if (!videoId) {
    throw new ApiError(400, "VideoId not exist!!");
  }

  if (!comment) {
    throw new ApiError(400, "comment fields is required!!");
  }

  const addedComment = await Comment.create({
    content: comment,
    owner: req.user?._id,
    video: videoId,
  });

  if (!addedComment) {
    throw new ApiError(500, "Something went wrong while adding comment.");
  }

  const result = await Comment.aggregate([
    {
      $match: {
        _id: addedComment._id,
      },
    },
    ...commonCommentAggregation(req),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment added successfully.", result[0]));
});

const removeComment = asyncHandler(async (req, res) => {
  //get commentId params
  //check if commentId exist
  //remove comment from db
  //remove comment ref from liked collection also if exist
  //check if removed successfully
  //return res

  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "commentId not exist.");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(
      400,
      "Comment you are trying to remove is not available!!"
    );
  }

  const deleteRes = await Comment.deleteOne({ _id: commentId });

  if (!deleteRes || (deleteRes && deleteRes.deletedCount < 1)) {
    throw new ApiError(400, "Something went wrong while deleting comment!!");
  }

  const commentRes = await Like.find({ comment: commentId });

  if (commentRes && commentRes.length > 0) {
    await Comment.deleteMany({ comment: commentId });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Removed Comments successfully."));
});

const updateComment = asyncHandler(async (req, res) => {
  //get commentId and content to be updated from body
  //validate content if not empty
  //check if commentId is valid or comment exist
  //update content of comment in db
  //check if successfully updated
  //return res

  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId) {
    throw new ApiError(400, "commentId not exist!!");
  }

  if (!content) {
    throw new ApiError(400, "Content is required!!");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment you are trying to update not found!!");
  }

  if (content) {
    comment.content = content;
  }

  const updatedComment = await comment.save({ validateBeforeSave: false });

  if (!updatedComment) {
    throw new ApiError(400, "Something went wrong while updating comment.");
  }

  const result = await Comment.aggregate([
    {
      $match: {
        _id: updatedComment._id,
      },
    },
    ...commonCommentAggregation(req),
  ]);

  if (!result) {
    throw new ApiError(500, "Internal Server Error!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment updated successfully.", result[0]));
});

export { getVideoComments, addComment, removeComment, updateComment };
