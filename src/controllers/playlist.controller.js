import { asyncHandler } from "../utils/AsyncHandler.js";

const getUserPlaylist = asyncHandler(async (req, res) => {
  //get userId from params
  //chek if userId exist
  //fetch playlist from playlists collection by matching userId
  //return res
});

const createPlaylist = asyncHandler(async (req, res) => {
  //get data from body
  //check if data exist
  //add playlist object on db
  //check if added successfully
  //return res
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //get playlistId from params
  //check if playlistId exist
  //fetch playlist from db usig playlistId
  //check if fetched successfully
  //return res
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  //get playlist and video ids from params
  //check if playlist and video id exist
  //get current playlisy by matching playlist id
  //update current playlist entry
  //check if updated successfully
  //return res
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  //get playlist and video id from params
});

const deletePlaylist = asyncHandler(async (req, res) => {
  //get playlistId from params
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //get playlistId from params
  //get name and desc from body
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
