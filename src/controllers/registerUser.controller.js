import { asyncHandler } from "../utils/AsyncHandler.js";

const registerUserController = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

export { registerUserController };
