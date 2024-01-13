import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.route("/videos").get(verifyJwt, getChannelVideos);
router.route("/stats").get(verifyJwt, getChannelStats);

export default router;
