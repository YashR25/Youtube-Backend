import { asyncHandler } from "../utils/AsyncHandler.js";

const getChannelVideos = asyncHandler(async (req, res) => {
  //get All videos uploaded by channel
  //get videos from db using video model
  //check if fetched successfully
  //return res
});

const getChannelStats = asyncHandler(async (req, res) => {
  //get the channel stats like total video views, total subscribers, total videos, total likes etc.
  //get total videos from db using video model
  //get total video views from video model
  //get total subscriber from db using subscription model
  //get total likes from db using like model
  //return res
});

export { getChannelVideos, getChannelStats };
