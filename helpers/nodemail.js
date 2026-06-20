const nodemailer = require("nodemailer");
require("dotenv").config();
const constants = require("./constants.json");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const axios = require("axios");

const EMAIL_CONFIG = {
  BATCH_SIZE: 50,
  DELAY_BETWEEN_EMAILS: 3000, // 3 seconds
  MAX_RETRIES: 2,
  RETRY_DELAY: 3000, // 3 seconds
  DEFAULT_SUBJECT:
    "A New Beginning at Yoga Vidya School – A Message from Prashant",
  DEFAULT_LIMIT: 500,
  DEFAULT_TEMPLATE: constants.EMAIL_TEMPLATE.SUBSCRIBER_EMAIL_FORCEFULLY,
};

const transporter = nodemailer.createTransport({
  host: process.env.GMAIL_SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.GMAIL_SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_SMTP_USER,
    pass: process.env.GMAIL_SMTP_PASS,
  },
  logger: true,
  debug: true,
});

const brevoTransporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
  logger: true,
  debug: true,
});

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

function createCampaignContent(mailData) {
  return new Promise((resolve, reject) => {
    try {
      const filePath = path.join(
        __dirname,
        "..",
        "controller",
        mailData.contentPath
      );
      const source = fs.readFileSync(filePath, "utf-8").toString();
      const template = handlebars.compile(source);
      const htmlToSend = template(mailData.replacements);
      const mailOptions = {
        from: constants.EMAIL_DATA.FROM,
        to: mailData.mailTo,
        subject: mailData.subject,
        replyTo: constants.EMAIL_DATA.REPLY_TO,
        html: htmlToSend,
      };
      
      brevoTransporter.sendMail(mailOptions, (err, result) => {
        if (err) {
          console.error(`Failed to send campaign mail to ${mailData.mailTo}:`, err);
          return reject(err);
        }
        return resolve(result);
      });
    } catch (error) {
      return reject(error);
    }
  });
}

function sendCampaignInBackground(recipients, options) {
  (async () => {
    const total = recipients.length;
    console.log(`[Campaign] Started background campaign send. Recipients count: ${total}`);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < total; i += EMAIL_CONFIG.BATCH_SIZE) {
      const batch = recipients.slice(i, i + EMAIL_CONFIG.BATCH_SIZE);
      const batchNum = Math.floor(i / EMAIL_CONFIG.BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(total / EMAIL_CONFIG.BATCH_SIZE);
      
      console.log(`[Campaign] Processing Batch ${batchNum}/${totalBatches} (${i + 1} to ${Math.min(i + EMAIL_CONFIG.BATCH_SIZE, total)})`);
      
      for (let j = 0; j < batch.length; j++) {
        const user = batch[j];
        const mailData = {
          replacements: options.replacementsFn ? options.replacementsFn(user) : {},
          mailTo: user.email,
          contentPath: options.templatePath,
          subject: options.subject,
        };
        
        let attempts = 0;
        let success = false;
        let lastError = "";
        
        while (attempts <= EMAIL_CONFIG.MAX_RETRIES) {
          try {
            await createCampaignContent(mailData);
            success = true;
            break;
          } catch (error) {
            attempts++;
            lastError = error.message || "Unknown error";
            if (attempts <= EMAIL_CONFIG.MAX_RETRIES) {
              console.log(`[Campaign] Retry ${attempts}/${EMAIL_CONFIG.MAX_RETRIES} for ${user.email} in ${EMAIL_CONFIG.RETRY_DELAY}ms...`);
              await new Promise(r => setTimeout(r, EMAIL_CONFIG.RETRY_DELAY));
            }
          }
        }
        
        if (success) {
          successCount++;
          console.log(`[Campaign] ✓ [${i + j + 1}/${total}] Email sent successfully to: ${user.email}`);
        } else {
          failedCount++;
          console.log(`[Campaign] ✗ [${i + j + 1}/${total}] Failed to send to: ${user.email}. Error: ${lastError}`);
        }
        
        if (options.onResult) {
          try {
            await options.onResult(user, success, lastError);
          } catch (hookError) {
            console.error("[Campaign] Error in onResult hook:", hookError);
          }
        }
        
        if (i + j < total - 1) {
          await new Promise(r => setTimeout(r, EMAIL_CONFIG.DELAY_BETWEEN_EMAILS));
        }
      }
    }
    
    if (options.onComplete) {
      try {
        await options.onComplete(successCount, failedCount);
      } catch (completeError) {
        console.error("[Campaign] Error in onComplete hook:", completeError);
      }
    }
    
    console.log(`[Campaign] Finished. Success: ${successCount}, Failed: ${failedCount}`);
  })().catch(err => {
    console.error("[Campaign] Fatal error in background campaign executor:", err);
  });
}

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

module.exports = {
  createContent,
  createWhatsAppContent,
  transporter,
  brevoTransporter,
  createCampaignContent,
  sendCampaignInBackground,
  EMAIL_CONFIG,
  sendMail: (options, callback) => transporter.sendMail(options, callback),
};