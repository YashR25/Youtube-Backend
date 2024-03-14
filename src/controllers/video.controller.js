import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  removeFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { getVideoDurationInSeconds } from "get-video-duration";
import os from "os";
import { Like } from "../models/like.models.js";
import { User } from "../models/user.models.js";
import { Playlist } from "../models/playlist.models.js";

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

  //delete from like collection
  await Like.find({
    video: videoId,
  });

  //delete from watch history
  await User.updateMany({
    $pull: {
      videos: videoId,
    },
  });

  //delete from playlists
  await Playlist.updateMany({
    $pull: {
      videos: videoId,
    },
  });

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
  //get data from body
  //check if videoId exist and if data are not empty
  //fetch video from database using id
  //check if video exist
  //if exist than update details
  //return res
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!videoId) {
    throw new ApiError(401, "videoId not exist!!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(401, "video you are tying to update is not available!!");
  }

  if (title) {
    video.title = title;
  }

  if (description) {
    video.description = description;
  }

  const updatedVideo = await video.save({ validateBeforeSave: false });

  if (!updatedVideo) {
    throw new ApiError(
      500,
      "Something went wrong while updating video details!!!"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Video details updated successfully.", updateVideo)
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  //get videoId from params
  //check if videoId exist
  //fetch video from database using id
  //check if video exist
  //if exist than return res

  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(401, "VideoId does not exist!!");
  }

  const selectedVideo = await Video.findById(videoId);

  if (!selectedVideo) {
    throw new ApiError(404, "video not found!!");
  }

  selectedVideo.views += 1;

  await selectedVideo.save({ validateBeforeSave: false });

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req.user?.id),
                "$subscribers.subscriber",
              ],
            },
            then: true,
            else: false,
          },
        },
        isLiked: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req.user?.id),
                "$likes.likedBy",
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);

  if (!video.length < 0) {
    throw new ApiError(401, "Video you are trying to get is not available.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video fetched successfully.", video[0]));
});

const getAllVideos = asyncHandler(async (req, res) => {
  //get paginate querys from req
  //get all videos from database
  //check if fetched successfully
  //return res
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  let pipeline = [];

  if (query) {
    console.log(query);
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"],
        },
      },
    });
  }

  if (userId) {
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  if (!userId) {
    pipeline.push({ $match: { isPublished: true } });
  }

  if (userId && userId.toString() !== req.user?._id.toString()) {
    pipeline.push({ $match: { isPublished: true } });
  }

  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  pipeline.push(
    ...[
      {
        $lookup: {
          from: "subscriptions",
          localField: "owner",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                username: 1,
                fullName: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
          isSubscribed: {
            $cond: {
              if: {
                $in: [
                  new mongoose.Types.ObjectId(req.user._id),
                  "$subscribers.subscriber",
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
    ]
  );

  const videosAggregate = Video.aggregate(pipeline);

  const result = await Video.aggregatePaginate(videosAggregate, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  /* return result will be type of below

    result.docs
    result.totalDocs = 100
    result.limit = 10
    result.page = 1
    result.totalPages = 10
    result.hasNextPage = true
    result.nextPage = 2
    result.hasPrevPage = false
    result.prevPage = null
  */

  if (!result) {
    throw new ApiError(500, "Something went wrong while fetching videos!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "All videos fetched successfully!!", result));
});

const togglePublishedStatus = asyncHandler(async (req, res) => {
  //get videoId from params
  //check if videoId exist
  //fetch video from database using id
  //toggle published true/false according to value in video
  //return res
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "VideoId not exist!!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not available!!");
  }

  if (video.isPublished) {
    video.isPublished = false;
  } else {
    video.isPublished = true;
  }

  const updatedVideo = await video.save({ validateBeforeSave: false });

  if (!updatedVideo) {
    throw new ApiError(500, "Something went wrong while updating video!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video updated successfully.", updatedVideo));
});

const altPublishVideoForTest = asyncHandler(async (req, res) => {
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

  const thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath);

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

  const videoFileName = req.files.video[0].filename;
  const videoUrl = `temp/${videoFileName}`;

  const videoFile = {
    publicId: videoLocalPath,
    url: videoUrl,
  };

  const videoDuration = await getVideoDurationInSeconds(videoLocalPath);

  const videoToAdded = {
    videoFile: videoFile,
    thumbnail: thumbnail,
    title: title,
    description: description,
    duration: videoDuration,
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

const searchSuggestControlle = asyncHandler(async (req, res) => {
  try {
    const result = await Video.aggregate([
      {
        $search: {
          index: "search-video-autocomplete",
          autocomplete: {
            query: req.query.t,
            path: "title",
          },
          highlight: {
            path: "title",
          },
        },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          title: 1,
          highlights: {
            $meta: "searchHighlights",
          },
        },
      },
    ]);
    console.log(result);
    const suggestions = [];
    if (result.length > 0) {
      result.map((item) => {
        if (item.highlights.length > 0) {
          item.highlights.map((highlightItem) => {
            highlightItem.texts.map((textItem) => {
              suggestions.push(textItem.value);
            });
          });
        }
      });
    }
    return res.send(new ApiResponse(200, "suggestions", suggestions));
  } catch (error) {
    console.log(error);
  }
});

export {
  publishVideo,
  deleteVideo,
  updateVideo,
  getVideoById,
  getAllVideos,
  togglePublishedStatus,
  altPublishVideoForTest,
  searchSuggestControlle,
};
