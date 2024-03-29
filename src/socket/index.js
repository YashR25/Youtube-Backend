import cookie from "cookie";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ChatEventEnum } from "../constants.js";
import { Video } from "../models/video.models.js";

const mountJoinChatEvent = (socket) => {
  //joining the room with chatId will allow specific event to fired where we dont wont to bother users like typing events
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId) => {
    console.log("User Joined chat. chatId: ", chatId);
    socket.join(chatId);
  });
};

const mountParticipantTypingEvent = (socket) => {
  socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId);
  });
};

const mountSearchAutoSuggestEvent = (socket, userId) => {
  socket.on("search-auto-suggest", async (data) => {
    try {
      const result = await Video.aggregate([
        {
          $search: {
            index: "search-video-autocomplete",
            autocomplete: {
              query: data,
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
          suggestions.push(item.title);
        });
      }
      // if (result.length > 0) {
      //   result.map((item) => {
      //     if (item.highlights.length > 0) {
      //       item.highlights.map((highlightItem) => {
      //         highlightItem.texts.map((textItem) => {
      //           suggestions.push(textItem.value);
      //         });
      //       });
      //     }
      //   });
      // }
      socket.emit("receive-suggestion", {
        data: suggestions,
      });
    } catch (error) {
      console.log(error);
    }
  });
};

const mountParticipantStopTypingEvent = (socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};

const initializeSocketIo = (io) => {
  try {
    io.on("connection", async (socket) => {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      let token = cookies?.accessToken;

      if (!token) {
        token = socket.handshake.auth?.token;
      }

      if (!token) {
        throw new ApiError(400, "Un-authorized handshake. Token is missing,");
      }

      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );

      if (!user) {
        throw new ApiError(401, "Un-authorized handshake. Token is invalid");
      }
      socket.user = user;

      socket.join(user._id.toString());
      socket.emit(ChatEventEnum.CONNECTED_EVENT);
      console.log("User Connected. userId: ", user._id.toString());

      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStopTypingEvent(socket);
      mountSearchAutoSuggestEvent(socket, user._id.toString());

      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        console.log("User has disconnected. userId: ", user._id.toString());
        if (socket.user?._id) {
          socket.leave(socket.user._id);
        }
      });
    });
  } catch (error) {
    socket.emit(
      ChatEventEnum.SOCKET_ERROR_EVENT,
      error?.message || "Something went wrong while connecting to socket."
    );
  }
};

const emitSocketEvent = (req, roomId, event, payload) => {
  req.app.get("io").in(roomId).emit(event, payload);
};

export { initializeSocketIo, emitSocketEvent };
