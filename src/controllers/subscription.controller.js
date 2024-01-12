import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleChannelSubscription = asyncHandler(async (req, res) => {
  //get channelId from params
  //check if channelId exist
  //get channel from db using id
  //if channel exist than update channel
  //check if updated
  //return res

  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "channelId not exist!!");
  }

  const subscription = await Subscription.aggregate([
    {
      $match: {
        channel: channelId,
      },
    },
    {
      $match: {
        subscriber: req?.user._id,
      },
    },
  ]);

  if (subscription) {
    await Subscription.deleteOne({ _id: subscription._id });
    return res.status(200).json(
      new ApiResponse(200, "Unsubscribed Successfully.", {
        isSubscribed: false,
      })
    );
  } else {
    const subscriptionRes = await Subscription.create({
      subscriber: req?.user._id,
      channel: channelId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Subscribed Successfully.", { isSubscribed: true })
      );
  }
});

const getChannelSubscribersUser = asyncHandler(async (req, res) => {
  //get channelId from params
  //check if channelId exist
  //get subcription model from database using channelId
  //get subscription subscriber entry
  //return res

  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, "ChannelId not exist!!");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: channelId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
        pipeline: {
          $projectFields: {
            username: 1,
            avatar: 1,
          },
        },
      },
    },
    {
      $addFields: {
        subscribers: "$subscribers",
      },
    },
    {
      $projectFields: {
        subscribers: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Successfully fetched subscribers."),
      subscribers
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  //get subscriberId from params
  //check if subscriberId exist
  //get subcription model from database using subscriberId
  //get subscription channel entry
  //return res

  const { subscriberId } = req.params;
  if (!subscriberId) {
    throw new ApiError(400, "subscriberId not exist!!");
  }

  const subscriptions = await Subscription.aggregate([
    {
      $match: {
        subscriber: subscriberId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscriptions",
        pipeline: {
          $projectFields: {
            username: 1,
            avatar: 1,
          },
        },
      },
    },
    {
      $addFields: {
        subscriptions: "$subscriptions",
      },
    },
    {
      $projectFields: {
        subscriptions: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Successfully fetched subscriptions."),
      subscriptions
    );
});

export {
  toggleChannelSubscription,
  getChannelSubscribersUser,
  getSubscribedChannels,
};
