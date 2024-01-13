import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router.route("/video/:videoId").patch(verifyJwt, toggleVideoLike);
router.route("/comment/:commentId").patch(verifyJwt, toggleCommentLike);
router.route("/tweet/:tweetId").patch(verifyJwt, toggleTweetLike);
router.route("/likedVideos").get(verifyJwt, getLikedVideos);

export default router;
