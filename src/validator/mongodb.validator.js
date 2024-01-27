import { body, param } from "express-validator";

const mongoIdPathVariableValidator = (idName) => {
  return [
    param(idName).notEmpty().isMongoId().withMessage(`Invalid ${idName}`),
  ];
};

const mongoIdRequestBodyValidator = (idName) => {
  return [body(idName).notEmpty().isMongoId().withMessage(`Invalid ${idName}`)];
};

export { mongoIdPathVariableValidator, mongoIdRequestBodyValidator };
