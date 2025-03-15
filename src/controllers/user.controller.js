import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"


// Register User Controller
export const registerUser = asyncHandler(async (req, res) => {

    // console.log('Received request to register user');
    // // Your logic for registering a user goes here
    // return  res.status(200).json({
    //     message: "ok"
    // });
    
    const {username, fullName, password, email} = req.body;
    console.log("email" , email);
    console.log("password" , password)

    // if(fullName === ""){
    //     throw new ApiError(400, "fullname is required ")
    // }

    if([fullName, email, username, password].some((field)=>{
        field?.trim() == ""
    }))
    {
        throw new ApiError(400, "all fields are required ")
    }


    const existedUser = await User.findOne({
        $or : [{
            username
        },
    {
        email
    }]
    })
    if(existedUser){
        throw new ApiError(409, "user with email or username already exists")
    }


    // const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // if(!avatarLocalPath){
    //     throw new ApiError(400, "avatar file is required ")
    // }

    const avatarFile = req.files?.avatar?.[0];
    const coverImageFile = req.files?.coverImage?.[0];
    if (!avatarFile) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarFile.path);
    const coverImage = coverImageFile ? await uploadOnCloudinary(coverImageFile.path) : null;
    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }


    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // const coverImage = await uploadOnCloudinary (coverImageLocalPath)
    // if(!avatar){
    //     throw new ApiError(400, "avatar file is required ")
    // }


    const user = await User.create({
        fullName,
        avatar : avatar?.url || "",
        coverImage : coverImage?.url || "",
        email , password , username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "something went wrong")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered")
    )

});





