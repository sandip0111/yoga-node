const express = require("express");
const mongoose = require("mongoose");
const app = express();
const adminRoutes = require("./routes/adminRoutes");
require("dotenv").config();
var cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const cron = require('node-cron');
const paymentService = require("./services/paymentService");

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
cron.schedule('21 21 * * *', async function() {
  paymentService.secondInstallmentPaymentMail();
});
//#region routes
app.use("/api/v1", adminRoutes);
