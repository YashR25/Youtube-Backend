import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addTweet,
  getChannelTweets,
  removeTweet,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.route("/").post(verifyJwt, addTweet);
router.route("/:tweetId").delete(verifyJwt, removeTweet);
router.route("/:tweetId").patch(verifyJwt, updateTweet);
router.route("/c/:channelId").get(verifyJwt, getChannelTweets);

export default router;
