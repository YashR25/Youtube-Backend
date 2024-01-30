//createOrGetOneOnOneChat
//removeParticipantFromGroup
//updateGroupName
//getAllChats
//addParticipantToGroup
//searchUsers
//getGroupChatDetails
//deleteGroupChat
//deleteOneOnOneChat
//leaveGroupChat

import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Chat } from "../models/chat.models.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { emitSocketEvent } from "../socket/index.js";
import { ChatEventEnum } from "../constants.js";
import { User } from "../models/user.models.js";
import { Message } from "../models/message.models.js";
import { removeLocalFile } from "../utils/helper.js";

const deleteCascadeChatMessages = async (chatId) => {
  const messages = await Message.find({
    chat: new mongoose.Types.ObjectId(chatId),
  });

  let attachments = [];

  attachments = attachments.concat(
    ...messages.map((message) => {
      return message.attachments;
    })
  );

  attachments.forEach((attachment) => {
    removeLocalFile(attachment.localPath);
  });

  await Message.deleteMany({
    chat: new mongoose.Types.ObjectId(chatId),
  });
};

const chatCommonAggregation = () => {
  return [
    {
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "participants",
        pipeline: [
          {
            $project: {
              password: 0,
              refreshToken: 0,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "lastMessage",
        foreignField: "_id",
        as: "lastMessage",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "sender",
              foreignField: "_id",
              as: "sender",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    email: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              sender: { $first: "$sender" },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        lastMessage: { $first: "$lastMessage" },
      },
    },
  ];
};

const createOrGetOneOnOneChat = asyncHandler(async (req, res, next) => {
  const { recieverId } = req.params;

  if (!recieverId) {
    throw new ApiError(401, "recieverId is required!");
  }

  const chat = await Chat.aggregate([
    {
      $match: {
        isGroupChat: false,
        $and: [
          {
            participants: { $elemMatch: { $eq: req.user._id } },
          },
          {
            participants: {
              $elemMatch: { $eq: new mongoose.Types.ObjectId(recieverId) },
            },
          },
        ],
      },
    },
    ...chatCommonAggregation(),
  ]);

  if (chat.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, "chat retrieved successfully.", chat[0]));
  }

  const newChatInstance = await Chat.create({
    name: "One on One Chat",
    participants: [req.user._id, new mongoose.Types.ObjectId(recieverId)],
    admin: req.user._id,
  });

  const createdChat = await Chat.aggregate([
    {
      $match: {
        _id: newChatInstance._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = createdChat[0];

  if (!payload) {
    throw new ApiError(500, "Internal error!");
  }

  payload?.participants.forEach((participant) => {
    if (participant._id.toString() === req.user._id.toString()) return;
    emitSocketEvent(
      req,
      participant._id.toString(),
      ChatEventEnum.NEW_CHAT_EVENT,
      payload
    );
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "chat created Successfully.", payload));
});

const removeParticipantFromGroup = asyncHandler(async (req, res, next) => {
  //get chatId, participantId from params
  //check if both Id exist
  //retrive chat from db using chatId
  //check if chat exist
  //check if participant exist in chat
  //is exist than remove id from chat participants
  //check if removed successfully
  //return res

  const { chatId, participantId } = req.params;

  if (!chatId || !participantId) {
    throw new ApiError(401, "chatId or participantId is required!");
  }

  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(chatId),
    isGroupChat: true,
  });

  if (!groupChat) {
    throw new ApiError(401, "Chat not exist!");
  }

  if (groupChat.admin?.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "You are not a admin!");
  }

  const existingParticipants = groupChat.participants;

  if (!existingParticipants.includes(participantId)) {
    throw new ApiError(400, "Participant does not exist in group chat!");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: {
        participants: participantId, //remove participantId
      },
    },
    { new: true }
  );

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: updatedChat._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(500, "Internal server Error!");
  }

  emitSocketEvent(req, participantId, ChatEventEnum.LEAVE_CHAT_EVENT, payload);

  return res
    .status(200)
    .json(new ApiResponse(200, "participant removed successfully!", payload));
});

const updatedGroupName = asyncHandler(async (req, res, next) => {
  //get chatid from params and name from body
  //check if both exist
  //find chatId from db
  //check if chat exist
  //check if current user id admin
  //updated chat
  //check if updated successfully
  //notify users
  //return res

  const { chatId } = req.params;
  const { name } = req.body;

  if (!chatId || !name) {
    throw new ApiError(401, "ChatId or name not exist!");
  }

  const chat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(chatId),
    isGroupChat: true,
  });

  if (!chat) {
    throw new ApiError(401, "chat not exist!");
  }

  if (chat.admin.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "You are not a admin!");
  }

  chat.name = name;

  await chat.save({ validateBeforeSave: false });

  const updatedChat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatId),
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = updatedChat[0];

  if (!payload) {
    throw new ApiError(500, "Internal server error!");
  }

  payload.participants.map((participant) => {
    if (participant._id.toString() === req.user._id.toString()) return;

    emitSocketEvent(
      req,
      participant._id.toString(),
      ChatEventEnum.UPDATE_GROUP_NAME_EVENT,
      payload
    );
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Group name updated successfully.", payload));
});

const getAllChats = asyncHandler(async (req, res, next) => {
  const chats = await Chat.aggregate([
    {
      $match: {
        participants: { $elemMatch: { $eq: req.user?._id } },
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
    ...chatCommonAggregation(),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "All chat fetched successfully!", chats || []));
});

const addParticipantToGroup = asyncHandler(async (req, res, next) => {
  //get partcipantId and chatId from params
  //check if both exist
  //find chat from db using chatId
  //check if chat is exist
  //check if current user is admin
  //add participantId to chat participants
  //check if updated successfully, and restructure
  //notify all users
  //return res

  const { chatId, participantId } = req.params;

  if (!chatId || !participantId) {
    throw new ApiError(401, "chatId or participantId is Required!");
  }

  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(chatId),
    isGroupChat: true,
  });

  if (!groupChat) {
    throw new ApiError(401, "group chat not found!");
  }

  if (groupChat.admin.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "You are not an admin!");
  }

  const existingParticipants = groupChat.participants;

  if (existingParticipants.includes(participantId)) {
    throw new ApiError(400, "Participant aleready exist in group!");
  }

  existingParticipants.push(participantId);

  groupChat.participants = existingParticipants;

  await groupChat.save({ validateBeforeSave: false });

  const updatedChat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatId),
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = updatedChat[0];

  if (!payload) {
    throw new ApiError(500, "Internal Server Error!");
  }

  emitSocketEvent(req, participantId, ChatEventEnum.NEW_CHAT_EVENT, payload);

  return res
    .status(200)
    .json(new ApiResponse(200, "Participant added successfully.", payload));
});

const searchAllAvailableUsers = asyncHandler(async (req, res, next) => {
  const users = await User.aggregate([
    {
      $match: {
        _id: {
          $ne: req.user?._id,
        },
      },
    },
    {
      $project: {
        avatar: 1,
        username: 1,
        email: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "All users fetched successfuly!", users));
});

const getGroupChatDetails = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  if (!chatId) {
    throw new ApiError(400, "chat id is required!");
  }

  const groupChat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatId),
        isGroupChat: true,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const chat = groupChat[0];

  if (!chat) {
    throw new ApiError(500, "Internal Server Error!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Group details fetched successfully!", chat));
});

const deleteGroupChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  if (!chatId) {
    throw new ApiError(401, "chat id is reuiqred!");
  }

  const groupChat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatId),
        isGroupChat: true,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const chat = groupChat[0];

  if (!chat) {
    throw new ApiError(401, "Chat is not exist!");
  }

  if (chat.admin.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "You are not an admin!");
  }

  await Chat.findByIdAndDelete(chatId);

  await deleteCascadeChatMessages(chatId);

  chat.participants.forEach((participant) => {
    if (participant._id.toString() !== req.user?._id.toString()) return;

    emitSocketEvent(
      req,
      participant._id.toString(),
      ChatEventEnum.LEAVE_CHAT_EVENT,
      chat
    );
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Group chat deleted successfully.", {}));
});

const deleteOneOnOneChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  if (!chatId) {
    throw new ApiError(401, "chat id is required!");
  }

  const oneOnOneChat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatId),
        isGroupChat: false,
      },
    },
  ]);

  const chat = oneOnOneChat[0];

  if (!chat) {
    throw new ApiError(401, "Chat not Exist!");
  }

  await Chat.findByIdAndDelete(chatId);

  await deleteCascadeChatMessages(chatId);

  chat.participants.map((participantObjectId) => {
    if (participantObjectId.toString() === req.user?._id) return;

    emitSocketEvent(
      req,
      participantObjectId,
      ChatEventEnum.LEAVE_CHAT_EVENT,
      chat
    );
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Chat deleted successfully!", {}));
});

const leaveGroupChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  if (!chatId) {
    throw new ApiError(401, "chat id is required!");
  }

  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(chatId),
    isGroupChat: true,
  });

  if (!groupChat) {
    throw new ApiError(401, "group chat not exist!");
  }

  const existingParticipants = groupChat.participants;

  if (!existingParticipants.includes(req.user?._id)) {
    throw new ApiError(401, "You are not a participant of the group!");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: {
        participants: req.user?._id,
      },
    },
    { new: true }
  );

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: updatedChat._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(500, "Internal Server Error!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Left a group successfully."));
});

const createGroupChat = asyncHandler(async (req, res, next) => {
  const { name, participants } = req.body;

  if (participants.includes(req.user._id.toString())) {
    throw new ApiError(
      401,
      "Participants array should not contain the group creater!"
    );
  }

  const members = [...new Set([...participants, req.user._id.toString()])];

  if (members.length < 3) {
    throw new ApiError(
      400,
      "Seems like you have passed duplicate participants."
    );
  }

  const groupChat = await Chat.create({
    name: name,
    isGroupChat: true,
    participants: members,
    admin: req.user?._id,
  });

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: groupChat._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(401, "Internal Server Error!");
  }

  payload.participants.forEach((participant) => {
    if (participant._id.toString() === req.user._id.toString()) return;

    emitSocketEvent(
      req,
      participant._id?.toString(),
      ChatEventEnum.NEW_CHAT_EVENT,
      payload
    );
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Group created successfully!", payload));
});

export {
  createOrGetOneOnOneChat,
  updatedGroupName,
  removeParticipantFromGroup,
  getAllChats,
  addParticipantToGroup,
  searchAllAvailableUsers,
  getGroupChatDetails,
  deleteGroupChat,
  deleteOneOnOneChat,
  leaveGroupChat,
  createGroupChat,
};
