//sendMessage
//getMessagesOfChat

import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Chat } from "../models/chat.models.js";
import { getStaticFilePath, getLocalPath } from "../utils/helper.js";
import { Message } from "../models/message.models.js";
import mongoose from "mongoose";
import { emitSocketEvent } from "../socket/index.js";
import { ChatEventEnum } from "../constants.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const chatMessageCommonAggregation = () => {
  return [
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
              avatar: 1,
              email: 1,
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
  ];
};

const sendMessage = asyncHandler(async (req, res, next) => {
  //get chatId from params and content from body
  //check if content and files exist
  //check if chat exist with chatId
  //create messagefiles array to create an message obj
  //create message in db
  //update chat lasmessage
  //again find message and structure the message res to send to user
  //notify other users about message
  //return res

  const { chatId } = req.params;
  const { content } = req.body;

  if (!content && !req.files?.attachments?.length) {
    throw new ApiError(401, "Message or Content Attachment is required!");
  }

  const selectedChat = await Chat.findById(chatId);

  if (!selectedChat) {
    throw new ApiError(401, "Chat is not exist!");
  }

  let messageFiles = [];

  if (req.files && req.files?.attachments.length > 0) {
    req.files.attachments.map((attachment) => {
      messageFiles.push({
        url: getStaticFilePath(req, attachment.fileName),
        path: getLocalPath(attachment.fileName),
      });
    });
  }

  const message = await Message.create({
    content: content,
    sender: new mongoose.Types.ObjectId(req.user?._id),
    chat: new mongoose.Types.ObjectId(chatId),
    attachments: messageFiles,
  });

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $set: {
        lastMessage: new mongoose.Types.ObjectId(message._id),
      },
    },
    { new: true }
  );

  const messages = await Message.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(message._id),
      },
    },
    ...chatMessageCommonAggregation(),
  ]);

  const recievedMessage = messages[0];

  if (!recievedMessage) {
    throw new ApiError(500, "Internal Server Error");
  }

  chat.participants.forEach((participantObjectId) => {
    if (participantObjectId === req.user._id.toString()) return;

    emitSocketEvent(
      req,
      participantObjectId,
      ChatEventEnum.MESSAGE_RECEIVED_EVENT,
      recievedMessage
    );
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Message saved successfully!", recievedMessage));
});

const getAllMessages = asyncHandler(async (req, res, next) => {
  //get chatId from params
  //check if id exist
  //get All Chat Messages
  //structure messages data
  //return res

  const { chatId } = req.params;

  if (!chatId) {
    throw new ApiError(401, "ChatId not exist!");
  }

  const selectedChat = await Chat.findById(chatId);

  if (!selectedChat) {
    throw new ApiError(401, "chat not exist!");
  }

  const messages = await Message.aggregate([
    {
      $match: {
        chat: new mongoose.Types.ObjectId(chatId),
      },
    },
    ...chatMessageCommonAggregation(),
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Messages Fetched Successfully.", messages || [])
    );
});

export { sendMessage, getAllMessages };
