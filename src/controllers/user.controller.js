import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import express from 'express';
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { UserInfo } from "../models/userInfo.model.js";
import OpenAI from "openai";
import { io } from "../index.js";

const openai = new OpenAI({
    apiKey: process.env.OPEN_API_KEY,  // Replace with your OpenAI API key
});



const generateTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        console.log(user)
        return { accessToken, refreshToken };

    } catch (err) {
        throw new ApiError(500, "Something went wrong while generating token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation
    // check if user already exist : username , email
    // check for images , check for avatar
    // upload to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token form response
    // check for user creation
    // return res 

    const { email, password } = req.body;
    if ([email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({
        // $or: [{ username }, { email }]
        email
    })



    if (existedUser) {
        throw new ApiError(409, "User already exist")
    }


    // const avatarLocalPath = req.files?.avatar[0]?.path;
    //    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path;
    // }

    // if (!avatarLocalPath) {
    //     throw new ApiError(400, "Avatar file is required")
    // }

    // const avatar = await uploadOnCloudinary(avatarLocalPath);
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // if (!avatar) {
    //     throw new ApiError(400, "Avatar file is required")
    // }

    const newUser = new User({ email, password });
    await newUser.save();

    console.log("User created:", user._id);

    const userInfo = await UserInfo.create({
        userId: user._id,
        username: email,
    });

    console.log("UserInfo created:", userInfo);

    // Handle the response to the client as needed


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "User creation failed")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // username , password, 
    // check if username or email or password are not empty
    // find the user
    // passeord check
    // access and refresh token generate
    // send cookie

    const { email, password } = req.body;

    if (!email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        email
        // $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateTokens(user._id);

    // console.log(accessToken, " ", refreshToken)
    // await User.findByIdAndUpdate({_id : user._id }, {refreshToken:refreshToken}, {new:true});

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    console.log(loggedInUser, "loggedInUser")
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken

            }, "User logged in successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined,
        },
    }, {
        new: true,
    })

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const updateUser = asyncHandler(async (req, res) => {
    const { email, newEmail, password, newPassword, address, zipcode, city, country, fullName, username, dob } = req.body;
    if (email === newEmail) {
        throw new ApiResponse(404, "New email cannot be same as previous.");
    }
    if (!email && !password) {
        throw new ApiResponse(401, "Username and password required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiResponse(404, "User does not exist");
    }

    if (password != "") {
        const isPasswordValid = await user.isPasswordCorrect(password)

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials")
        }

        user.password = newPassword;
    }

    if (newEmail != "") {
        user.email = newEmail;

    } else {
        throw new ApiResponse(404, "New email is required.");
    }
    user.save({ validateBeforeSave: false })
    const userId = user._id;
    // const newUser = await UserInfo.findOne({userId});

    await UserInfo.findOneAndUpdate(
        { userId },
        {
            $set: {
                address: address || "",
                zipcode: zipcode || "",
                city: city || "",
                country: country || "",
                fullName: fullName || "",
                username: username || "",
                dob: dob || "",
            }
        },
        { new: true },
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Profile updated successfully"))

})

const getUserProfile = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiResponse(401, "Email is required");
    }

    // Debug: Log the email received
    console.log(`Received email: ${email}`);

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
        // Debug: Log user not found
        console.log(`User not found for email: ${email}`);
        throw new ApiResponse(404, "User does not exist");
    }

    // Debug: Log user found
    console.log(`User found: ${user}`);

    // Find the user profile by user ID
    const userId = user._id;
    const userProfile = await UserInfo.findOne({ userId });
    if (!userProfile) {
        // Debug: Log user profile not found
        console.log(`User profile not found for user ID: ${user._id}`);
        throw new ApiResponse(404, "User profile does not exist");
    }

    // Debug: Log user profile found
    console.log(`User profile found: ${userProfile}`);

    return res.status(200).json(new ApiResponse(200, {}, userProfile));
});

const stockInfo = asyncHandler(async (req, res) => {
    const { question } = req.body;
    if (!question) {
        throw new ApiResponse(401, "Question is required");
    }

    const gptQuery = `⁠ Act as a stock market news reporter and give me the news related to the query in 100 words: ${question} ⁠`;

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: gptQuery }],
        stream: true,
        max_tokens: 300,
        temperature: 0.5,
        top_p: 0.5,
        stream_options: { "include_usage": true }
    }, { responseType: 'stream' });

    let flag = true;

    for await (const chunk of response) {
        if (!chunk.choices[0]) {
            flag = false;
            break;
        }

        // Introduce a constant delay of 3 seconds
        await new Promise(resolve => setTimeout(resolve, 500));

        io.emit('chat message', chunk.choices[0].delta);
    }

    if (!flag) {
        return res.status(200).json(new ApiResponse(200, {}, "Response completed"));
    }
});



export { registerUser, loginUser, logoutUser, updateUser, getUserProfile, stockInfo };