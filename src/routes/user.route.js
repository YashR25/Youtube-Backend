import { Router } from "express";
import { registerUserController } from "../controllers/registerUser.controller.js";

const router = Router();

router.route("/register").post(registerUserController);

export default router;
