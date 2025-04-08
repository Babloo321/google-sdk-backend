import { Router } from "express";
import { loginUser, registerUser, logoutUser, refreshAccessTokenGenerator, googleAuthHandler, getCurrentUser } from '../controllers/User.controllers.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js'
const userRouter = Router();

userRouter.route("/register").post(registerUser);
userRouter.route("/me").get(verifyJWT,getCurrentUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT,logoutUser);
userRouter.route("/refresh-token").post(refreshAccessTokenGenerator)
userRouter.post("/google-auth", googleAuthHandler);
export default userRouter;