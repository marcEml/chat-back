import express from "express";
import { AuthController } from "../controllers/auth/auth";

const router = express.Router();

// routes for auth ...

router.post("/auth/register/user", AuthController.createUser); // create user
router.put("/auth/update/user", AuthController.updateUser); // update user
router.delete("/auth/delete/user", AuthController.deleteUser); // delete user
router.post("/auth/login", AuthController.loginUser); // login user
router.get("/auth/get/me", AuthController.getMe); // login user

export default router;
