import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app = express();

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS,
    credentials: true,
  },
});
app.set("io", io);

app.use(
  cors({
    origin: process.env.CORS,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

//initialize socket.io
initializeSocketIo(io);

app.get("/api/v1/", (req, res) => {
  console.log(req.socket);
  return res.json({ message: "ok" });
});

//import user router
import userRouter from "./routes/user.route.js";

app.use("/api/v1/user", userRouter);

//import video router
import videoRouter from "./routes/video.route.js";

app.use("/api/v1/video", videoRouter);

import tweetRouter from "./routes/tweet.route.js";

app.use("/api/v1/tweet", tweetRouter);

import subscriptionRouter from "./routes/subscription.route.js";

app.use("/api/v1/subscription", subscriptionRouter);

import playlistrouter from "./routes/playlist.route.js";

app.use("/api/v1/playlist", playlistrouter);

import likeRouter from "./routes/like.route.js";

app.use("/api/v1/like", likeRouter);

import commentRouter from "./routes/comment.route.js";

app.use("/api/v1/comment", commentRouter);

import dashboardRouter from "./routes/dashboard.route.js";
import { initializeSocketIo } from "./socket/index.js";

app.use("/api/v1/dashboard", dashboardRouter);

import chatRouter from "./routes/chat.route.js";

app.use("/api/v1/chat", chatRouter);

import messageRouter from "./routes/message.route.js";

app.use("/api/v1/message", messageRouter);

export { httpServer };
