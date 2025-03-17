import express from 'express';
import { loginUser, registerUser , logoutUser , refreshAccessToken } from '../controllers/user.controller.js';  // Ensure this path is correct
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = express.Router();

// Register User Route
// router.post('/newregister', upload.fields([
//     {
//         name : "avatar",
//         maxCount : 1
//     },
//     {
//         name : "coverImage",
//         maxCount: 1
//     }
// ]));


router.post('/newregister', upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
]), registerUser);  

router.post("/login", loginUser)
router.post("/logout", verifyJWT ,  logoutUser)
// router.route("/refresh-token").post(refreshAccessToken)
router.post("/refresh-token" , refreshAccessToken)

export default router;
