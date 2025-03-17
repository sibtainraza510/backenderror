import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"


export const generateAccessAndRefreshTokens = async(userId)=>{
    {
        try{
            const user = await User.findById(userId)
            const accessToken = User.generateAccessToken()
            const refreshToken = User.generateRefreshToken()

            user.refreshToken = refreshToken

            //time lg sakta hai toh await lga do
           await user.save({validateBeforeSave : false})
            return {accessToken , refreshToken}
        }
        catch(error){
            throw new ApiError(500, "something went wrong while generating refresh and access token")
        }
    }
}


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
    //TODO: delete old image - assignment

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


//loginuser

export const loginUser = asyncHandler(async (req,res)=>{

    //rebody = data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const {email, username, password} = req.body
    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{username} , {email}]
    })
    if(!user){
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid  = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(404, "user does not exist")
    }

    await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password  -refreshToken")
    const options = {
        httpOnly : true,
        secure : true
    }
    return res 
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser , accessToken , refreshToken
            },
            "user logged in successfully"
        )
    )


})


export const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id, {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , {} , "user logged out"))
})




export  const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})





export const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


export const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    // .json(200, req.user, "current user fetched successfully")
    .json(new ApiResponse(200, req.user, "user fetched successfully"))
})


export const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await  User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});



export const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})



export const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})