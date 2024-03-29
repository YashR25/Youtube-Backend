import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  altPublishVideoForTest,
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishVideo,
  searchSuggestControlle,
  togglePublishedStatus,
  updateVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/").post(
  verifyJwt,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router.route("/:videoId").delete(verifyJwt, deleteVideo);
router.route("/:videoId").patch(verifyJwt, updateVideo);
router.route("/:videoId").get(verifyJwt, getVideoById);
router.route("/").get(verifyJwt, getAllVideos);

router
  .route("/toggle/publish/:videoId")
  .patch(verifyJwt, togglePublishedStatus);

router.route("/publish").post(
  verifyJwt,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  altPublishVideoForTest
);

router.route("/search/suggest").get(verifyJwt, searchSuggestControlle);

export default router;
