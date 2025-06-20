const nodemailer = require("nodemailer");
require("dotenv").config();
const constants = require("./constants.json");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const axios = require("axios");

function createContent(mailData) {
  return new Promise(async (resolve, reject) => {
    try {
      let mailOptions;
      let template;
      const filePath = path.join(
        __dirname,
        "..",
        "controller",
        mailData.contentPath
      );
      const source = fs.readFileSync(filePath, "utf-8").toString();
      template = handlebars.compile(source);
      const htmlToSend = template(mailData.replacements);
      mailOptions = {
        from: constants.EMAIL_DATA.FROM,
        to: mailData.mailTo,
        subject: mailData.subject,
        replyTo: constants.EMAIL_DATA.REPLY_TO,
        html: htmlToSend,
      };
      transporter.sendMail(mailOptions, async (err, result) => {
        if (err) {
          return resolve({ status: 400, data: "Opps error occured" });
        }
      });
      return resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "Info@yogavidyaschool.com",
    pass: "gbpdiztkoofmivha",
  },
  logger: true,
  debug: true,
});
function createWhatsAppContent(whatsappData) {
  return new Promise(async (resolve, reject) => {
    try {
      const wspMessage = {
        messaging_product: "whatsapp",
        to: whatsappData.to,
        type: "template",
        template: {
          name: whatsappData.templateName,
          language: { code: "en" },
          components: [
            {
              type: "header",
              parameters: whatsappData.headerParam,
            },
            {
              type: "body",
              parameters: whatsappData.params,
            },
          ],
        },
      };
      axios
        .post(process.env.WHATSAPP_API_URL, wspMessage, {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log("WhatsApp message sent successfully:", response.data);
        })
        .catch((error) => {
          console.log("WhatsApp message error:", error.message);
        });
      return resolve(1);
    } catch (error) {
      return reject(error);
    }
  });
}
module.exports = { createContent, createWhatsAppContent, transporter };