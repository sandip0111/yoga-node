"use strict";
const { S3, GetObjectCommand } = require("@aws-sdk/client-s3");
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
module.exports = { getPresignedUrl, getListObject, getFileObject };
