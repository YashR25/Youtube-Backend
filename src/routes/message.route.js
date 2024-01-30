import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { mongoIdPathVariableValidator } from "../validator/mongodb.validator.js";
import { validate } from "../validator/validate.js";
import {
  getAllMessages,
  sendMessage,
} from "../controllers/message.controller.js";
import { sendMessageValidator } from "../validator/message.validator.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJwt);

router
  .route("/:chatId")
  .get(mongoIdPathVariableValidator("chatId"), validate, getAllMessages)
  .post(
    upload.fields([{ name: "attachments", maxCount: 5 }]),
    mongoIdPathVariableValidator("chatId"),
    sendMessageValidator(),
    validate,
    sendMessage
  );

export default router;
