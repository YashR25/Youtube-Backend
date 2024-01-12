import { asyncHandler } from "../utils/AsyncHandler.js";

const toggleChannelSubscription = asyncHandler(async (req, res) => {
  //get channelId from params
});

const getChannelSubscribersUser = asyncHandler(async (req, res) => {
  //get channelId from params
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  //get subscriberId from params
});

export {
  toggleChannelSubscription,
  getChannelSubscribersUser,
  getSubscribedChannels,
};
