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
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

const username = "yogavidyaschooldb";
const password = "yogavidya4321qwerty";
const host = "44.211.96.198";
const port = "27014";
const dbName = "yogavidyaschool";

mongoose
  .connect(`mongodb://${username}:${password}@${host}:${port}/${dbName}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("Database connected");
    app.listen(3000);
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
