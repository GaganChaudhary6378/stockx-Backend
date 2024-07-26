import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserInfo } from "../models/userInfo.model.js";

const preference = asyncHandler(async (req, res) => {
    const { id } = req.params; // bitcoin
    console.log(id);
    const { userId } = req.body;
    const user = await UserInfo.findOne({ userId });
    if (!user) {
        throw new ApiError(400, "User does not exist");
    }
    const preferenceArray = user.favorites;
    if (preferenceArray.length >= 3) {
        throw new ApiError(400, "Cannot add more than 3 favorites");
    } else {
        const isExisting = preferenceArray.includes(id);
        if (isExisting) {
            // remove that id from the array
            const index = preferenceArray.indexOf(id);
            if (index > -1) {
                preferenceArray.splice(index, 1);
                await user.save({ validateBeforeSave: false });
            }
        } else {
            preferenceArray.push(id);
            await user.save({ validateBeforeSave: false });
        }

    }
    res
        .status(200)
        .json(new ApiResponse(200, { preferenceArray }, "Preferences added successfully"));

})

const getAllPreferences = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await UserInfo.findOne({ userId });
    if (!user) {
        throw new ApiError(400, "User not found");
    }
    const preferenceArray = user.favorites;
    res
        .status(200)
        .json(new ApiResponse(200, { preferenceArray }, "Successfully fetched the preferences."))
})

export { preference, getAllPreferences };