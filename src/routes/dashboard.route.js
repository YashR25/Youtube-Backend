import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getChannelStats,
  getChannelStatsById,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.route("/videos").get(verifyJwt, getChannelVideos);
router.route("/stats").get(verifyJwt, getChannelStats);
router.route("/user/stats/:userId").get(verifyJwt, getChannelStatsById);

export default router;
