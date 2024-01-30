import { body } from "express-validator";

const creaetGroupChatValidator = () => {
  return [
    body("name").trim().notEmpty().withMessage("Group name is required!"),
    body("participants")
      .isArray({
        max: 100,
        min: 2,
      })
      .withMessage(
        "Participants must be an array more than 2 members and less than 100 members"
      ),
  ];
};

const updateGroupChatNameValidator = () => {
  return [body("name").trim().notEmpty().withMessage("Group name is required")];
};

export { creaetGroupChatValidator, updateGroupChatNameValidator };
