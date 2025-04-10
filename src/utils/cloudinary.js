import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// creating a function which upload files on cloudinary
export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Detect file type from extension
    const ext = path.extname(localFilePath).toLowerCase();

    let resourceType = "raw"; // default fallback for docs and others

    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].includes(ext)) {
      resourceType = "image";
    } else if ([".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext)) {
      resourceType = "video";
    }

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: resourceType,
    });

    // Remove local file after successful upload
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    // Clean up local file even if upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

/*
uses of upload file on cloudinary
const result = await uploadOnCloudinary("/uploads/somefile.pdf");
// or
const result = await uploadOnCloudinary("/uploads/photo.jpg");


*/
/**
 * Deletes a file from Cloudinary by publicId and file path (for type detection)
 * @param {string} publicId - Cloudinary public ID (without extension)
 * @param {string} filePath - File path to detect resource type (like `.jpg`, `.pdf`)
 */
export const deleteFromCloudinary = async (publicId, filePath) => {
  try {
    if (!publicId || !filePath) {
      console.error("❌ Missing publicId or filePath");
      return null;
    }

    // Get extension to detect resource_type
    const ext = path.extname(filePath).toLowerCase();

    let resourceType = "raw"; // default fallback

    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].includes(ext)) {
      resourceType = "image";
    } else if ([".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext)) {
      resourceType = "video";
    }

    // Use appropriate API call
    let response;
    if (resourceType === "video" || resourceType === "raw") {
      response = await cloudinary.api.delete_resources([publicId], {
        resource_type: resourceType,
      });
    } else {
      response = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    }

    return response;
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
    return null;
  }
};
// how to use delete file on cloudinary
// await deleteFromCloudinary(uploaded.public_id, "uploads/sample.pdf");

// export const deleteOnCloudinary = async (publicId, resourceType = "auto") => {
//   try {
//     if (!publicId) {
//       console.error("❌ Public ID is missing");
//       return null;
//     }

//     let response;

//     if (resourceType === "video" || resourceType === "raw") {
//       // Use delete_resources for videos or raw files like PDFs
//       response = await cloudinary.api.delete_resources([publicId], {
//         resource_type: resourceType,
//       });
//     } else {
//       // Use destroy for images or default
//       response = await cloudinary.uploader.destroy(publicId, {
//         resource_type: resourceType,
//       });
//     }

//     return response;
//   } catch (error) {
//     console.error("❌ Cloudinary Deletion Error:", error);
//     return null;
//   }
// };
