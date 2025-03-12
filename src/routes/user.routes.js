import express from 'express';
import { registerUser } from '../controllers/user.controller.js';  // Ensure this path is correct
import {upload} from "../middlewares/multer.middleware.js"
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

export default router;
