import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getAllSubscriptionsVideos,
  getChannelSubscribersUser,
  getSubscribedChannels,
  toggleChannelSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();

router
  .route("/toggleSubscription/:channelId")
  .get(verifyJwt, toggleChannelSubscription);

router
  .route("/getSubscriber/:channelId")
  .get(verifyJwt, getChannelSubscribersUser);

router
  .route("/getSubscriptions/:subscriberId")
  .get(verifyJwt, getSubscribedChannels);

router
  .route("/getAllSubscriptionVideos/")
  .get(verifyJwt, getAllSubscriptionsVideos);

export default router;
