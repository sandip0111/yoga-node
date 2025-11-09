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
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName1 = `${timestamp}-${sanitizedFileName}`;
  const key = `upCourses/${courseId}/${fileName1}`;

  const params = {
    Bucket: "yogacourses",
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  };

  try {
    const command = new PutObjectCommand(params);
    const result = await s3.send(command);

    return {
      success: true,
      key: key,
      location: `https://yogacourses.s3.${AWS_REGION}.amazonaws.com/${key}`,
      etag: result.ETag,
      bucket: "yogacourses",
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
