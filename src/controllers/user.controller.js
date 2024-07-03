import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

    const {email, password } = req.body;
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

    const user = await User.create({
        fullname : "",
        avatar: "",
        coverImage: "",
        email,
        password,
        username: "",
    })

    

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

    if ( !email) {
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
export { registerUser, loginUser, logoutUser }