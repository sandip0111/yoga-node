require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
// const https = require('https');
const fs = require("fs");
const app = express();
const adminRoutes = require("./routes/adminRoutes");
var cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const cron = require("node-cron");
const paymentService = require("./services/paymentService");
const courseService = require("./services/courseService");
const studentService = require("./services/studentService");
const emailSchedulerService = require("./services/emailSchedulerService");

//middleware
app.use(express.json({ limit: "1000mb" }));
app.use(cors());
app.use(bodyParser.urlencoded({ limit: "1000mb", extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

const username = "yogavidyauser";
const password = "l8eqBG0xIWFDUhD9";
const appName = "yogavidya";

mongoose
  .connect(
    `mongodb://${username}:${password}@ac-un8jerx-shard-00-00.oqcuqk9.mongodb.net:27017,ac-un8jerx-shard-00-01.oqcuqk9.mongodb.net:27017,ac-un8jerx-shard-00-02.oqcuqk9.mongodb.net:27017/yogavidya_db?ssl=true&replicaSet=atlas-pfm564-shard-0&authSource=admin&appName=${appName}`,
  )
  .then((result) => {
    console.log("Database connected");
    const server = app.listen(3000);
    server.timeout = 600000; // 10 minutes timeout for large video uploads
  })
  .catch((error) => {
    console.log(error);
  });
//#region cron jon function
cron.schedule("0 0 * * *", async function () {
  paymentService.secondInstallmentPaymentMail();
});
cron.schedule("*/1 * * * *", async function () {
  paymentService.updatePaymentStatusForcefully();
  paymentService.updateSwaraSadhanaPaymentStatusForcefully();
  paymentService.updateOnlineSadhanaPaymentStatusForcefully();
  paymentService.updatePranaArambhPaymentStatusForcefully();
  courseService.changeCourseStatusToOngoing();
  studentService.get24HoursPranicPurificationMailAfterPayment();
  paymentService.updatePranicPurificationStatusForcefully();
  paymentService.updatePranicPurificationIIStatusForcefully();
  paymentService.updateRishikeshStatusForcefully();
  paymentService.updateBaliStatusForcefully();
});
cron.schedule("0 * * * *", async function () {
  emailSchedulerService.startScheduler();
});
cron.schedule("10 18 17 * * *", async function () {
  // paymentService.updateabc();
});
//#region routes
app.use("/api/v1", adminRoutes);

const certPath = "/etc/letsencrypt/live/yogavidyaschool.com";
// https.createServer( {
//     key: fs.readFileSync(`${certPath}/privkey.pem`),
//     cert: fs.readFileSync(`${certPath}/fullchain.pem`),
//   },app)
//   .listen(3000, ()=>{
//     console.log('server is runing at port 3000')
// });
