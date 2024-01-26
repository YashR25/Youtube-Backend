import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    attachments: {
      type: [
        {
          type: String,
          localPath: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
