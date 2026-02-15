"use strict";
const subscriberRepo = require("../repositories/subscriberRepository");
const { transporter } = require("../helpers/nodemail");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const constants = require("../helpers/constants.json");

/**
 * Send bulk emails to all subscribers with robust error handling
 * @param {String} emailSubject - Subject line for the email
 * @param {String} templatePath - Path to email template (relative to controller folder)
 * @returns {Promise<Object>} Result with success/failure counts and details
 */
function sendBulkEmailToSubscribers(
  emailSubject = "Welcome to Yoga Vidya School",
  templatePath = constants.EMAIL_TEMPLATE.SUBSCRIBER_EMAIL_FORCEFULLY,
) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("=== Starting Bulk Email Send Process ===");
      console.log(`Email Subject: ${emailSubject}`);
      console.log(`Template: ${templatePath}`);

      // Get all subscribers
      const subscribers = await subscriberRepo.getAllSubscribers();
      console.log(`Total subscribers found: ${subscribers.length}`);

      if (subscribers.length === 0) {
        return resolve({
          status: "ok",
          message: "No subscribers found",
          totalSubscribers: 0,
          successCount: 0,
          failedCount: 0,
          details: [],
        });
      }

      // Load email template
      const filePath = path.join(__dirname, "..", "controller", templatePath);
      const source = fs.readFileSync(filePath, "utf-8").toString();
      const template = handlebars.compile(source);

      // Tracking variables
      const successfulEmails = [];
      const failedEmails = [];
      const emailHistoryUpdates = [];

      // Configuration
      const BATCH_SIZE = 50;
      const DELAY_BETWEEN_EMAILS = 2000; // 2 seconds
      const MAX_RETRIES = 2;
      const RETRY_DELAY = 5000; // 5 seconds

      // Process subscribers in batches
      for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
        const batch = subscribers.slice(i, i + BATCH_SIZE);
        console.log(
          `\n--- Processing Batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1}-${Math.min(i + BATCH_SIZE, subscribers.length)} of ${subscribers.length}) ---`,
        );

        // Process each subscriber in the batch
        for (const subscriber of batch) {
          const emailResult = await sendEmailWithRetry(
            subscriber,
            template,
            emailSubject,
            MAX_RETRIES,
            RETRY_DELAY,
          );

          if (emailResult.success) {
            successfulEmails.push({
              email: subscriber.email,
              name: subscriber.name,
            });
            emailHistoryUpdates.push({
              subscriberId: subscriber._id,
              emailHistoryEntry: {
                emailSubject: emailSubject,
                created: new Date(),
                isSend: true,
                isRead: false,
              },
            });
            console.log(`✓ Email sent successfully to: ${subscriber.email}`);
          } else {
            failedEmails.push({
              email: subscriber.email,
              name: subscriber.name,
              error: emailResult.error,
            });
            emailHistoryUpdates.push({
              subscriberId: subscriber._id,
              emailHistoryEntry: {
                emailSubject: emailSubject,
                created: new Date(),
                isSend: false,
                isRead: false,
              },
            });
            console.log(`✗ Failed to send email to: ${subscriber.email}`);
            console.log(`  Error: ${emailResult.error}`);
          }

          // Delay between emails to prevent rate limiting
          if (subscribers.indexOf(subscriber) < subscribers.length - 1) {
            await delay(DELAY_BETWEEN_EMAILS);
          }
        }

        console.log(
          `Batch ${Math.floor(i / BATCH_SIZE) + 1} completed. Success: ${successfulEmails.length}, Failed: ${failedEmails.length}`,
        );
      }

      // Bulk update email history in database
      console.log("\n--- Updating Email History in Database ---");
      try {
        const updateResult =
          await subscriberRepo.bulkUpdateEmailHistory(emailHistoryUpdates);
        console.log(
          `Email history updated: ${updateResult.success} records updated`,
        );
      } catch (error) {
        console.error("Error updating email history:", error);
      }

      // Final summary
      console.log("\n=== Email Send Process Completed ===");
      console.log(`Total Subscribers: ${subscribers.length}`);
      console.log(`Successfully Sent: ${successfulEmails.length}`);
      console.log(`Failed: ${failedEmails.length}`);

      return resolve({
        status: "ok",
        message: "Bulk email process completed",
        totalSubscribers: subscribers.length,
        successCount: successfulEmails.length,
        failedCount: failedEmails.length,
        details: {
          successful: successfulEmails,
          failed: failedEmails,
        },
      });
    } catch (error) {
      console.error("Critical error in bulk email process:", error);
      return reject(error);
    }
  });
}

/**
 * Send email with retry logic
 * @param {Object} subscriber - Subscriber object with name and email
 * @param {Function} template - Compiled handlebars template
 * @param {String} emailSubject - Email subject
 * @param {Number} maxRetries - Maximum number of retry attempts
 * @param {Number} retryDelay - Delay between retries in milliseconds
 * @returns {Promise<Object>} Result object with success status and error if any
 */
async function sendEmailWithRetry(
  subscriber,
  template,
  emailSubject,
  maxRetries,
  retryDelay,
) {
  let attempts = 0;

  while (attempts <= maxRetries) {
    try {
      // Prepare email content
      const replacements = {
        name: subscriber.name || "Yogi",
      };
      const htmlToSend = template(replacements);

      const mailOptions = {
        from: constants.EMAIL_DATA.FROM,
        to: subscriber.email,
        subject: emailSubject,
        replyTo: constants.EMAIL_DATA.REPLY_TO,
        html: htmlToSend,
      };

      // Send email
      await transporter.sendMail(mailOptions);

      return { success: true };
    } catch (error) {
      attempts++;
      if (attempts <= maxRetries) {
        console.log(
          `  Retry ${attempts}/${maxRetries} for ${subscriber.email} after ${retryDelay}ms...`,
        );
        await delay(retryDelay);
      } else {
        return {
          success: false,
          error: error.message || "Unknown error",
        };
      }
    }
  }

  return {
    success: false,
    error: "Max retries exceeded",
  };
}

/**
 * Delay helper function
 * @param {Number} ms - Milliseconds to delay
 * @returns {Promise}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  sendBulkEmailToSubscribers,
};
