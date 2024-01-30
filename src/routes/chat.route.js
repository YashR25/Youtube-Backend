import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addParticipantToGroup,
  createGroupChat,
  createOrGetOneOnOneChat,
  deleteGroupChat,
  deleteOneOnOneChat,
  getAllChats,
  getGroupChatDetails,
  leaveGroupChat,
  removeParticipantFromGroup,
  searchAllAvailableUsers,
  updatedGroupName,
} from "../controllers/chat.controller.js";
import {
  mongoIdPathVariableValidator,
  mongoIdRequestBodyValidator,
} from "../validator/mongodb.validator.js";
import { validate } from "../validator/validate.js";
import {
  creaetGroupChatValidator,
  updateGroupChatNameValidator,
} from "../validator/chat.validator.js";

const router = Router();

router.use(verifyJwt);

router.route("/").get(getAllChats);

router.route("/users").get(searchAllAvailableUsers);

router
  .route("/c/:recieverId")
  .post(
    mongoIdPathVariableValidator("recieverId"),
    validate,
    createOrGetOneOnOneChat
  );

router
  .route("/group")
  .post(creaetGroupChatValidator(), validate, createGroupChat);

router
  .route("/group/:chatId")
  .get(mongoIdPathVariableValidator("chatId"), validate, getGroupChatDetails)
  .patch(
    mongoIdPathVariableValidator("chatId"),
    updateGroupChatNameValidator(),
    validate,
    updatedGroupName
  )
  .delete(mongoIdPathVariableValidator("chatId"), validate, deleteGroupChat);

router
  .route("/group/:chatId/:participantId")
  .post(
    mongoIdPathVariableValidator("chatId"),
    mongoIdPathVariableValidator("participantId"),
    validate,
    addParticipantToGroup
  )
  .delete(
    mongoIdPathVariableValidator("chatId"),
    mongoIdPathVariableValidator("participantId"),
    validate,
    removeParticipantFromGroup
  );

router
  .route("/leave/group/:chatId")
  .delete(mongoIdPathVariableValidator("chatId"), validate, leaveGroupChat);

router
  .route("/remove/:chatId")
  .delete(mongoIdPathVariableValidator("chatId"), validate, deleteOneOnOneChat);

export default router;
