import asyncHandler from "../utils/asyncHandler.js";

// Register User Controller
export const registerUser = asyncHandler(async (req, res) => {
    console.log('Received request to register user');
    // Your logic for registering a user goes here
     res.status(200).json({
        message: "ok"
    });
});
