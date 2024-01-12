import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      media_metadata: true,
      folder: "youtube",
    });
    // console.log("file is uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved file as the operation got failed
    return null;
  }
};

const removeFromCloudinary = async (publicId, resource_type) => {
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resource_type,
    });
    // console.log(response);
    if (response.result == "ok") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export { uploadOnCloudinary, removeFromCloudinary };
