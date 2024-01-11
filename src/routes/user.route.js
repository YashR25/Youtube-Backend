import { Router } from "express";
import {
  changePassword,
  getChannelInfo,
  getCurrentUser,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAvatar,
  updateCoverImage,
  updateUserData,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").get(verifyJwt, logoutUser);
router.route("/refreshAccessToken").post(refreshAccessToken);
router.route("/change-password").patch(verifyJwt, changePassword);
router.route("/").patch(verifyJwt, updateUserData);
router.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateAvatar);
router
  .route("/coverImage")
  .patch(verifyJwt, upload.single("coverImage"), updateCoverImage);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/c/:username").get(verifyJwt, getChannelInfo);
router.route("/history").get(verifyJwt, getWatchHistory);

export default router;
