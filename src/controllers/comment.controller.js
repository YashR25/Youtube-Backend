import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.models.js";

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

  const commentAggregate = await Comment.aggregate([
    {
      $match: {
        video: videoId,
      },
    },
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
    .json(new ApiResponse(200, "comments fetched successfully.", result.docs));
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

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment added successfully.", addedComment));
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

  if (!deleteRes || (deleteRes && deleteRes.ok != 1)) {
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

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Comment updated successfully.", updatedComment)
    );
});

export { getVideoComments, addComment, removeComment, updateComment };
