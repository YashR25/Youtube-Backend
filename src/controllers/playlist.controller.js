import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/playlist.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getUserPlaylist = asyncHandler(async (req, res) => {
  //get userId from params
  //chek if userId exist
  //fetch playlist from playlists collection by matching userId
  //return res

  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "userId not exist!!");
  }

  const playlists = await Playlist.find({ owner: userId });

  if (!playlists) {
    throw new ApiError(400, "Something went wrong while fetching playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist fetched successfully.", playlists));
});

const createPlaylist = asyncHandler(async (req, res) => {
  //get data from body
  //check if data exist
  //add playlist object on db
  //check if added successfully
  //return res

  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "All fields are required!!");
  }

  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(400, "Somthing went wrong while creating playlist!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist created successfully.", playlist));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //get playlistId from params
  //check if playlistId exist
  //fetch playlist from db usig playlistId
  //check if fetched successfully
  //return res

  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "playlistId not exist!!");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: playlistId,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
          },
          $addFields: {
            owner: {
              $first: "$owner",
            },
          },
          $project: {
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            duration: 1,
            views: 1,
            owner: 1,
          },
        },
      },
    },
    {
      $addFields: {
        videos: "$videos",
      },
    },
  ]);

  if (!playlist) {
    throw new ApiError(500, "Something went wrong while fetching playlist");
  }

  return res
    .status(200)
    .json(200, "Playlist fetched successfully.", playlist[0]);
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  //get playlist and video ids from params
  //check if playlist and video id exist
  //get current playlist by matching playlist id
  //update current playlist entry
  //check if updated successfully
  //return res
  const { playlistId, videoId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "playlistId not exist!!");
  }

  if (!videoId) {
    throw new ApiError(400, "videoId not exist!!");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Playlist not exist!!");
  }

  playlist.videos.push(videoId);

  const updatedPlaylist = await playlist.save({ validateBeforeSave: false });

  if (!updatedPlaylist) {
    throw new ApiError(400, "Something went wrong while updating playlist.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "video added to playlist successfully.",
        updatedPlaylist
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  //get playlist and video id from params
  const { playlistId, videoId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "playlistId not exist");
  }

  if (!videoId) {
    throw new ApiError(400, "videoId not exist");
  }

  const playlist = await Playlist.findById(playlistId);

  playlist.videos = playlist.videos.filter((item) => item._id != videoId);

  const updatedPlaylist = await playlist.save({ validateBeforeSave: false });

  if (!updatedPlaylist) {
    throw new ApiError(
      500,
      "Something went wrong while removing video from playlist."
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "video removed from playlist successfully.",
        updatedPlaylist
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  //get playlistId from params
  //check if playlistId exist
  //remove playlist from db
  //check if removed successfully
  //return res

  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "playlistId not exist");
  }

  const response = await Playlist.deleteOne({ _id: playlistId });

  if (!response || (response && response.deletedCount < 1)) {
    throw new ApiError(
      500,
      "Something went wrong while deleting playlist from db!!"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist successfully deleted."));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //get playlistId from params
  //get name and desc from body
  //check if playlistId and body data exist
  //updated data in db
  //check if updated successfully
  //return res

  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!playlistId) {
    throw new ApiError(400, "PlaylistId is required to updated playlist!!");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(
      401,
      "Playlist you are trying to update not found in db!!"
    );
  }

  if (name) {
    playlist.name = name;
  }

  if (description) {
    playlist.description = description;
  }

  const updatedPlaylist = await playlist.save({ validateBeforeSave: false });

  if (!updatedPlaylist) {
    throw new ApiError(500, "Something went wrong while upadting playlist!!");
  }

  return res
    .status(200)
    .json(200, "Playlist updated successfully.", updatedPlaylist);
});

export {
  getUserPlaylist,
  getPlaylistById,
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
