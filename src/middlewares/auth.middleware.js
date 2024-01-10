import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  if (!accessToken) {
    throw new ApiError(400, "unAuthorized Token");
  }
  const decodedToken = await jwt.verify(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(400, "Invalid accessToken!!");
  }

  req.user = user;
  next();
});
