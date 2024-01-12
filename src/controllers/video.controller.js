import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  removeFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const publishVideo = asyncHandler(async (req, res) => {
  //get data from body
  //validate data
  //get video file from multer middleware
  //check if videolocalpath exist
  //if exist than upload on cloudinary
  //check if upladed successfully
  //add video object in db
  //return res

  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "All fields required!!");
  }

  const videoLocalPath = req.files?.video[0]?.path;
  let thumbnailLocalPath;
  if (req.files && req.files.thumbnail.length > 0) {
    thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  }

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file not exist!!");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail not exist!!");
  }

  const videoResponse = await uploadOnCloudinary(videoLocalPath);
  const thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath);

  // console.log(videoResponse);

  if (!videoResponse) {
    throw new ApiError(
      400,
      "Something went wrong while uploading video on cloudinary!!"
    );
  }

  if (!thumbnailResponse) {
    throw new ApiError(
      400,
      "Something went wrong while uploading thumbnail on cloudinary!!"
    );
  }

  const thumbnail = {
    publicId: thumbnailResponse.public_id,
    url: thumbnailResponse.url,
  };

  const videoFile = {
    publicId: videoResponse.public_id,
    url: videoResponse.url,
  };

  const videoToAdded = {
    videoFile: videoFile,
    thumbnail: thumbnail,
    title: title,
    description: description,
    duration: videoResponse?.duration,
    owner: req.user?._id,
  };

  const video = await Video.create(videoToAdded);

  if (!video) {
    throw new ApiError(
      401,
      "Something went wrong while adding video to databse"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video published successfully.", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
  //get videoId from params
  //check if videoId exist
  //get video from db and get the url of uploaded video
  //remove video from cloudinary using videoUrl
  //remove video from database
  //return res if removed successfully

  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "VideoId not exist!!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video does not exist!!");
  }

  const videoPublicId = video.videoFile.publicId;
  const thumbnailPublicId = video.thumbnail.publicId;

  const isVideoDeleted = await removeFromCloudinary(videoPublicId, "video");
  const isThumbnailDeleted = await removeFromCloudinary(
    thumbnailPublicId,
    "image"
  );

  if (!isVideoDeleted || !isThumbnailDeleted) {
    throw new ApiError(
      401,
      "Something went wrong while deleting video from cloudinary"
    );
  }

  const response = await Video.deleteOne({ _id: videoId });

  if (!response) {
    throw new ApiError(400, "Something went wrong while deleting video!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video removed successfully."));
});

const updateVideo = asyncHandler(async (req, res) => {
  //get videoId from params
});

const getVideoById = asyncHandler(async (req, res) => {
  //get videoId from params
});

const getAllVideos = asyncHandler(async (req, res) => {
  //get paginate querys from req
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
});

const togglePublishedStatus = asyncHandler(async (req, res) => {
  //get videoId from params
});

export { publishVideo, deleteVideo, updateVideo, getVideoById, getAllVideos };
