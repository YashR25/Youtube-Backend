import { asyncHandler } from "../utils/AsyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //get videoId from Params
  //check if owner/current_userId exist in db (likes collection)
  //if exist than check below else add entry
  //check if videoId already exist in current entry
  //if exist than update like entry else add entry
  //check if updated successfully
  //return res
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //get CommentId from params
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //get tweetId from params
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //get user from middleware
  //get videos from likes collection in db by matching userId
  //check if fetched successfully
  //return res
});

export { likeVideo, likeComment, likeTweet };
