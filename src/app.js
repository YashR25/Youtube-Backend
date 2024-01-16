import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

const app = express();

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

app.use("/api/v1/dashboard", dashboardRouter);

export { app };
