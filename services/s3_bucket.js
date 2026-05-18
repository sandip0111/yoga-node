"use strict";
const {
  S3,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const s3 = new S3({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});
async function getPresignedUrl(bucket, key) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return url;
}
async function getListObject(params) {
  const response = await s3.listObjectsV2(params);
  const filteredObjects = response.Contents?.filter(
    (obj) => !obj.Key.endsWith(".ts")
  );
  return { filteredObjects, response };
}
async function getFileObject(params) {
  const res = await s3.getObject(params);
  return res;
}
/**
 * NEW: Upload video file to S3 (Direct upload from backend)
 * @param {Buffer} fileBuffer - File buffer from multer or file read
 * @param {string} fileName - Original filename
 * @param {string} courseId - Course ID for organizing files
 * @param {string} contentType - MIME type of the file
 */
async function uploadVideoToS3(fileBuffer, fileName, courseId, contentType) {
  // Use AWS SDK v2 locally to bypass the InvalidPart v3 bug completely
  const AWS = require("aws-sdk");
  const s3v2 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName1 = `${timestamp}-${sanitizedFileName}`;
  const key = `videos/upCourses/${courseId}/${fileName1}`;

  const params = {
    Bucket: "yogavidya-bucket",
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  };

  try {
    // This automatically splits the read stream into 5MB chunks safely
    const result = await s3v2.upload(params, {
      partSize: 5 * 1024 * 1024, // 5 MB
      queueSize: 1 // Sequential parts to eliminate any InvalidPart overlap
    }).promise();

    return {
      success: true,
      key: key,
      location: result.Location,
      etag: result.ETag,
      bucket: "yogavidya-bucket",
      fileName: fileName1,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}
module.exports = {
  getPresignedUrl,
  getListObject,
  getFileObject,
  uploadVideoToS3,
};
