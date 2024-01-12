import { asyncHandler } from "../utils/AsyncHandler.js";

const getChannelTweets = asyncHandler(async (req, res) => {
  //get channelId from params
});

const addTweet = asyncHandler(async (req, res) => {
  //get content from body
});

const removeTweet = asyncHandler(async (req, res) => {
  //get tweetId from params
});

const updateTweet = asyncHandler(async (req, res) => {
  //get tweetId from params
  //get content from body
});

export { addTweet, removeTweet, updateTweet, getChannelTweets };
