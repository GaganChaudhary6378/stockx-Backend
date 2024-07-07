import { Router } from "express";
import { getUserProfile, loginUser, logoutUser, registerUser, updateUser, stockInfo } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    // upload.fields([
    //     {
    //         name: "avatar",
    //         maxCount: 1
    //     },
    //     {
    //         name: "coverImage",
    //         maxCount: 1
    //     },
    // ]),
    registerUser
)
router.route("/login").post(loginUser)

// secured routes
router.route("/updateProfile").post(updateUser)

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/getProfile").get(getUserProfile)
router.route("/getStockInfo").post(stockInfo)
export default router