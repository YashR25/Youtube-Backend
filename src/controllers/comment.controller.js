import { asyncHandler } from "../utils/AsyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //get VideoId from Params
  //get page and limit from query
  //check if videoid exist
  //get comments from database by matching videoId in it
  //return res
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
  //get videoId and comment from body
  //validate data
  //add comments to db
  //check if comment added successfully
  //return res
});

const removeComment = asyncHandler(async (req, res) => {
  //get commentId params
  //check if commentId exist
  //remove comment from db
  //check if removed successfully
  //return res
});

const updateComment = asyncHandler(async (req, res) => {
  //get commentId and content to be updated from body
  //validate content if not empty
  //check if commentId is valid or comment exist
  //update content of comment in db
  //check if successfully updated
  //return res
});

export { getVideoComments, addComment, removeComment, updateComment };
