require("dotenv").config();
const AWS = require("aws-sdk");

const bucketName = process.env.S3_BUCKET_NAME || "mind-guide-karmanya-s3";
const region = process.env.AWS_REGION || "us-east-1";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: region,
});

async function emptyAndDeleteBucket() {
  try {
    // console.log(`Checking bucket: ${bucketName}...`);

    // 1. List and Delete all Objects
    let objects = await s3.listObjectsV2({ Bucket: bucketName }).promise();
    if (objects.Contents.length > 0) {
      // console.log(`Deleting ${objects.Contents.length} objects...`);
      const deleteParams = {
        Bucket: bucketName,
        Delete: { Objects: objects.Contents.map((obj) => ({ Key: obj.Key })) },
      };
      await s3.deleteObjects(deleteParams).promise();
    }

    // 2. List and Delete all Versions (case sensitive for buckets with versioning)
    let versions = await s3.listObjectVersions({ Bucket: bucketName }).promise();
    const deleteVersions = [];
    if (versions.Versions && versions.Versions.length > 0) {
      versions.Versions.forEach((v) => deleteVersions.push({ Key: v.Key, VersionId: v.VersionId }));
    }
    if (versions.DeleteMarkers && versions.DeleteMarkers.length > 0) {
      versions.DeleteMarkers.forEach((m) => deleteVersions.push({ Key: m.Key, VersionId: m.VersionId }));
    }

    if (deleteVersions.length > 0) {
      // console.log(`Deleting ${deleteVersions.length} object versions/markers...`);
      await s3.deleteObjects({
        Bucket: bucketName,
        Delete: { Objects: deleteVersions },
      }).promise();
    }

    // 3. Delete the Bucket
    // console.log(`Deleting bucket: ${bucketName}...`);
    await s3.deleteBucket({ Bucket: bucketName }).promise();
    // console.log("Bucket deleted successfully!");

  } catch (err) {
    if (err.code === "NoSuchBucket") {
      // console.log("Bucket already deleted or does not exist.");
    } else {
      console.error("Error during cleanup:", err.message);
      process.exit(1);
    }
  }
}

emptyAndDeleteBucket();
