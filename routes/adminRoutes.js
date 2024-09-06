const express = require("express");
const router = express.Router();
// const jsonToken = require('../config/jwt');
const studentController = require("../controller/studentController");
const adminController = require("../controller/adminController");
const wistiaController = require("../controller/wistiaController");
const multer = require("multer");
const multerS3 = require('multer-s3')
const path = require("path");
const fs = require("fs");
const { S3, GetObjectCommand } = require("@aws-sdk/client-s3");
const AWS_ACCESS_KEY_ID = "AKIAWGOLULIWBNKET5SM";
const AWS_SECRET_ACCESS_KEY = "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";
const AWS_REGION = "us-east-1";
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const onlineVideoModel = require("../models/onlineVideoModel");
const studentModel = require("../models/StudentModel");

const s3 = new S3({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

//Student Routes
router.post("/createStudent", studentController.createUpdateStudent);
router.post("/student", studentController.getAllStudent);
router.get("/student/:id", studentController.getStudentById);
router.post("/deleteStudent", studentController.createUpdateStudent);
router.post("/setAccessPran", studentController.setAccessPran);
router.post("/setAccessFoundation", studentController.setAccessFoundation);
router.post("/setAccessBreath", studentController.setAccessBreath);
// router.get('/sendBulkEmail',studentController.sendBulkEmail);

//mailer
router.post("/inquiryEmail", adminController.inquiryEmail);
router.post("/checkEmail", adminController.checkEmail);

router.post("/createMentor", adminController.createMentor);
router.get("/getAllMentor", adminController.getAllMentor);
router.get("/getMentorById/:id", adminController.getMentorById);
router.get("/getMentorBySlug/:id", adminController.getMentorBySlug);
router.post("/getHomeMentors", adminController.getHomeMentors);
router.post(
  "/getMentorsForCoursePage",
  adminController.getMentorsForCoursePage
);

/////////////
router.post("/createslider", adminController.createslider);
router.get("/getimagesliderById/:id", adminController.getimagesliderById);
router.get("/getSlider", adminController.getSlider);

//category
router.post("/createcategory", adminController.createCategory);
router.get("/getAllCategory", adminController.getAllCatV2);
router.get("/getCategoryTree", adminController.getCategoryTree);
router.get("/createrootCat", adminController.getAllCategoryCreated);

router.get("/getCategoryById/:id", adminController.getCategoryById);
router.post("/getSubCategoryByCatId", adminController.getSubCategoryByCatId);
router.post(
  "/getSubCourseCategoryBySubCatId",
  adminController.getSubCourseCategoryBySubCatId
);

//subcategory

router.post("/createSubcategory", adminController.createSubcategory);
router.get("/getAllSubCategory", adminController.getAllSubCategory);
router.get("/getSubCategoryById/:id", adminController.getSubCategoryById);

//sub course catgeory

router.post(
  "/createSubCoursecategory",
  adminController.createSubCoursecategory
);
router.get("/getAllSubCourseCategory", adminController.getAllSubCourseCategory);
router.get(
  "/getSubCourseCategoryById/:id",
  adminController.getSubCourseCategoryById
);

//course

router.post("/createCourse", adminController.createCourse);
router.get("/course/:id", adminController.getCourseByIdV2);
router.post("/getAllCourse", adminController.getAllCourse);
router.get("/getAllCourseV2", adminController.getAllCourseV2);
router.get("/getCourseById/:id", adminController.getCourseById);
router.post("/getCourseBySlug", adminController.getCourseBySlug);
router.post("/getAllVideoReviews", adminController.getAllVideoReviews);
router.get("/getAllCourseAdmin", adminController.getAllCourseAdmin);

//blog

router.post("/createBlog", adminController.createBlog);
router.post("/getAllBlog", adminController.getAllBlog);
router.get("/getBlogById/:id", adminController.getBlogById);
router.post("/getHomeBlog", adminController.getAllHomeBlog);
router.get("/getBlogBySlug/:id", adminController.getBlogBySlug);

//media

router.post("/createMedia", adminController.createMedia);
router.get("/getAllMedia", adminController.getAllMedia);

//pages

router.post("/createPage", adminController.createPage);
router.get("/getAllPages", adminController.getAllPages);
router.get("/getPageById/:id", adminController.getPageById);

//testimonial

router.post("/createTestimonial", adminController.createTestimonial);
router.get("/getAllTestimonial", adminController.getAllTestimonial);

//event
router.post("/createEvent", adminController.createEvent);
router.get("/getAllEvents", adminController.getAllEvents);
router.get("/getAllEventsAdmin", adminController.getAllEventsAdmin);
router.get("/getAllOnlineEvents", adminController.getAllOnlineEvents);
router.get("/getEventsById/:id", adminController.getEventsById);

//contact
router.post("/saveContactInquiry", adminController.saveContactInquiry);

//admin
router.post("/createAdmin", adminController.createAdmin);
router.post("/doLogin", adminController.doLogin);

///////////// for wistia API
router.post("/getCourseVideo", wistiaController.getCourseVideo);
router.post("/getAllProject", wistiaController.getAllProject);

router.post("/loginWeb", adminController.loginWeb);

router.post("/getValidation", adminController.getValidation);

router.post("/createFeedback", adminController.createFeedback);
router.post("/createSubscriber", adminController.createSubscriber);
router.post("/getFeedbackByCourse", adminController.getFeedbackByCourse);

router.post("/createAccessLog", adminController.createAccessLog);
router.post("/getAccessLog", adminController.getAccessLog);
router.post("/getcheckCourseStudent", adminController.getcheckCourseStudent);
router.post("/getAllInquiry", adminController.getAllInquiry);
router.post("/getAllPayment", adminController.getAllPayment);
router.post("/getAllOnlinePayment", adminController.getAllOnlinePayment);
router.get("/exportInquiry", adminController.exportInquiry);
router.post("/stripe", adminController.checkoutStripe);
router.post(
  "/stripeWithoutProduct",
  adminController.checkoutStripeWithoutProduct
);
router.post("/getPaymentResponse", adminController.getPaymentResult);
router.post("/getPaymentResponseV2", adminController.getPaymentResultV2);

//video Aws

router.post("/createVideo", adminController.createOnlineVideo);
router.get(
  "/getCourseVideoDataById/:id",
  adminController.getCourseVideoDataById
);

//anaylytics
router.post("/createAnalytics", adminController.createAnalytics);
router.post("/getAnalyticsByDate", adminController.getAnalyticsByDate);

//new landinga page form
router.post("/getPranaPageData", studentController.pranaPageRegister);
router.post(
  "/stripeNewPranaarabha",
  adminController.checkoutStripeNewPranaarabha
);

router.post("/getCourseVideosById", async (req, res) => {
  try {
    const getVideoData = await onlineVideoModel.find({
      courseId: req.body.courseId,
    });
    // console.log(getVideoData,'---');
    const params = {
      Bucket: "yogacourses",
      Prefix: `upCourses/${req.body.courseId}/`,
      Delimiter: "/",
    };
    const response = await s3.listObjectsV2(params);
    let arr = [];
    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key.endsWith(".mp4") || item.Key.endsWith(".MOV")) {
          // console.log(item,'---');
          const key = item.Key;
          const id = key.substring(
            key.lastIndexOf("/") + 1,
            key.lastIndexOf(".")
          );
          const url = await getPresignedUrl("yogacourses", key);
          const newUrl = url.replace(
            "yogacourses.s3.us-east-1.amazonaws.com",
            "d3mzqk1fxuwngx.cloudfront.net"
          );
          // console.log(urlv3,'id');
          const getObj = getVideoData.filter((e) => e.videoName == id);
          //  console.log(getObj,'filte rdata');
          let val = {
            updateId: getObj[0]._id,
            title: getObj[0].title,
            sortBy: getObj[0].sortBy,
            url: newUrl,
          };
          arr.push(val);
        }
      }
      // console.log(arr,'--');
      res.status(200).json(arr);
    } else {
      res.status(200).json(arr);
    }
  } catch (err) {
    res.status(400).json({ err });
  }
});

async function getPresignedUrl(bucket, key) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return url;
}

const imageStorage = multer.diskStorage({
  // Destination to store image
  // console.log('test');
  destination: "public/images",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
    // file.fieldname is name of the field (image)
    // path.extname get the uploaded file extension
  },
});

const imageStorages3 = multerS3({
  s3: s3,
  bucket: 'my-s3-images-bucket', // Replace with your bucket name
  acl: 'public-read', // Public access for images
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    cb(null, `img/${Date.now().toString()}-${file.originalname}`); // Save to images folder
  }
});

const imageUpload = multer({
  storage: imageStorages3,
  limits: {
    fileSize: 1000000, // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    if (
      !file.originalname.match(/\.(png|jpg|JPG|jpeg|JPEG|PNG|docx|jfif|xlsx)$/)
    ) {
      // upload only png and jpg format
      return cb(new Error("Please upload a Image"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/uploadImage",
  imageUpload.single("image"),
  (req, res) => {
    const imageName = req.file.key.split('/').pop(); 
    res.send({
      imageName: imageName,
      msg: "Upload succesfully",
      status: "ok",
    });
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

const videoStorage = multer.diskStorage({
  // Destination to store image
  // console.log('test');
  destination: "public/video",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
    // file.fieldname is name of the field (image)
    // path.extname get the uploaded file extension
  },
});
const videoUpload = multer({
  storage: videoStorage,
  fileFilter(req, file, cb) {
    // console.log(file.originalname);
    if (!file.originalname.match(/\.(mp4|mov|avi|MOV|MP4|AVI)$/)) {
      // upload only png and jpg format
      return cb(new Error("Please upload a Video"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/uploadVideo",
  videoUpload.single("video"),
  (req, res) => {
    res.send({
      videoName: req.file.filename,
      msg: "Upload succesfully",
      status: "ok",
    });
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.post(
  "/uploadOnlineVideo",
  videoUpload.single("video"),
  async (req, res) => {
    let path = __dirname + "/../public/video/" + req.body.videoName;
    // Read the video file from disk
    const videoFile = fs.readFileSync(path);
    // Set the S3 bucket and object key
    const s3Bucket = "yogacourses";
    const s3ObjectKey = `course/${req.body.courseId}/${req.body.videoName}`;
    // Upload the video file to S3 and assign it the specified object ID
    const result = await s3.putObject({
      Bucket: s3Bucket,
      Key: s3ObjectKey,
      Body: videoFile,
      ContentType: "video/mp4",
    });

    const vname = req.body.videoName.substring(
      0,
      req.body.videoName.lastIndexOf(".")
    );
    const vidBody = {
      courseId: req.body.courseId,
      videoName: vname,
      title: req.body.title,
      sortBy: req.body.order,
    };
    if (result.$metadata.httpStatusCode == 200) {
      await onlineVideoModel.create(vidBody);
      res.status(200).json({ status: "ok", msg: "Video Uploaded Success" });
    } else {
      res.status(400).json({ status: "error", msg: "Error on uploading!" });
    }
  }
);

router.post("/uploadReview", videoUpload.single("video"), async (req, res) => {
  const file = req.file;
  const filePath = file.path;
  const fileStream = fs.createReadStream(filePath);

  console.log(file, filePath, "--------");

  const s3Bucket = "yogacourses";
  const s3ObjectKey = `reviews/${file.filename}`;

  // Upload the video file to S3 and assign it the specified object ID
  const result = await s3.putObject({
    Bucket: s3Bucket,
    Key: s3ObjectKey,
    Body: fileStream,
  });

  console.log(result);

  if (result.$metadata.httpStatusCode == 200) {
    // const fullPath = path.resolve(__dirname, filePath);
    let fullPath = __dirname + "/../"+ filePath;
    fs.unlink(fullPath, (err) => {
      if (err) {
          console.error(`Error deleting file ${filePath}:`, err);
          res.status(400).json({ status: "error", msg: "Error on uploading!" });
      } else {
          console.log(`File ${filePath} has been deleted.`);
          res
          .status(200)
          .json({
            videoName: file.filename,
            msg: "Upload succesfully",
            status: "ok",
          });
      }
  });
 
  } else {
    res.status(400).json({ status: "error", msg: "Error on uploading!" });
  }
});

module.exports = router;
