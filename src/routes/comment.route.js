import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addComment,
  getVideoComments,
  removeComment,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/video/:videoId").get(verifyJwt, getVideoComments);
router.route("/:videoId").post(verifyJwt, addComment);
router.route("/:commentId").delete(verifyJwt, removeComment);
router.route("/:commentId").patch(verifyJwt, updateComment);

export default router;
