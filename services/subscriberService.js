"use strict";
const subscriberRepo = require("../repositories/subscriberRepository");
const sendMail = require("../helpers/nodemail");
const constants = require("../helpers/constants.json");

// Email sending configuration
const EMAIL_CONFIG = {
  BATCH_SIZE: 50,
  DELAY_BETWEEN_EMAILS: 2000, // 2 seconds
  MAX_RETRIES: 2,
  RETRY_DELAY: 5000, // 5 seconds
  DEFAULT_SUBJECT:
    "A New Beginning at Yoga Vidya School – A Message from Prashant",
  DEFAULT_LIMIT: 500,
  DEFAULT_TEMPLATE: constants.EMAIL_TEMPLATE.SUBSCRIBER_EMAIL_FORCEFULLY,
};

/**
 * Send bulk emails to filtered subscribers with robust error handling
 * Uses the standard sendMail.createContent pattern
 * Sends only to subscribers who haven't received the email or failed to receive it
 * @param {String} emailSubject - Subject line for the email
 * @param {Number} limit - Maximum number of subscribers to send to
 * @param {String} templatePath - Path to email template (relative to controller folder)
 * @returns {Promise<Object>} Result with success/failure counts and details
 */
async function sendBulkEmailToSubscribers(
  emailSubject = EMAIL_CONFIG.DEFAULT_SUBJECT,
  limit = EMAIL_CONFIG.DEFAULT_LIMIT,
  templatePath = EMAIL_CONFIG.DEFAULT_TEMPLATE,
) {
  try {
    logProcessStart(emailSubject, limit, templatePath);

    // Get filtered subscribers based on email history
    const subscribers = await subscriberRepo.getFilteredSubscribers(
      emailSubject,
      limit,
    );

    console.log(`Total eligible subscribers found: ${subscribers.length}`);

    if (subscribers.length === 0) {
      return buildResponse(0, 0, 0, "No eligible subscribers found");
    }

    // Process all subscribers
    const { successfulEmails, failedEmails, emailHistoryUpdates } =
      await processSubscriberBatches(subscribers, emailSubject, templatePath);

    // Update email history in database
    await updateEmailHistoryInBulk(emailHistoryUpdates);

    // Log final summary
    logProcessComplete(
      subscribers.length,
      successfulEmails.length,
      failedEmails.length,
    );

    return buildResponse(
      subscribers.length,
      successfulEmails.length,
      failedEmails.length,
      "Bulk email process completed",
      { successful: successfulEmails, failed: failedEmails },
    );
  } catch (error) {
    console.error("Critical error in bulk email process:", error);
    throw error;
  }
}

/**
 * Process subscribers in batches
 * @param {Array} subscribers - Array of subscriber objects
 * @param {String} emailSubject - Email subject
 * @param {String} templatePath - Template path
 * @returns {Promise<Object>} Processing results
 */
async function processSubscriberBatches(
  subscribers,
  emailSubject,
  templatePath,
) {
  const successfulEmails = [];
  const failedEmails = [];
  const emailHistoryUpdates = [];

  for (let i = 0; i < subscribers.length; i += EMAIL_CONFIG.BATCH_SIZE) {
    const batch = subscribers.slice(i, i + EMAIL_CONFIG.BATCH_SIZE);
    const batchNumber = Math.floor(i / EMAIL_CONFIG.BATCH_SIZE) + 1;
    const batchRange = `${i + 1}-${Math.min(i + EMAIL_CONFIG.BATCH_SIZE, subscribers.length)}`;

    console.log(
      `\n--- Processing Batch ${batchNumber} (${batchRange} of ${subscribers.length}) ---`,
    );

    await processBatch(
      batch,
      emailSubject,
      templatePath,
      successfulEmails,
      failedEmails,
      emailHistoryUpdates,
      subscribers.length,
    );

    console.log(
      `Batch ${batchNumber} completed. Success: ${successfulEmails.length}, Failed: ${failedEmails.length}`,
    );
  }

  return { successfulEmails, failedEmails, emailHistoryUpdates };
}

/**
 * Process a single batch of subscribers
 * @param {Array} batch - Batch of subscribers
 * @param {String} emailSubject - Email subject
 * @param {String} templatePath - Template path
 * @param {Array} successfulEmails - Array to track successful sends
 * @param {Array} failedEmails - Array to track failed sends
 * @param {Array} emailHistoryUpdates - Array to track history updates
 * @param {Number} totalSubscribers - Total number of subscribers
 */
async function processBatch(
  batch,
  emailSubject,
  templatePath,
  successfulEmails,
  failedEmails,
  emailHistoryUpdates,
  totalSubscribers,
) {
  for (let i = 0; i < batch.length; i++) {
    const subscriber = batch[i];

    const emailResult = await sendEmailWithRetry(
      subscriber,
      emailSubject,
      templatePath,
    );

    trackEmailResult(
      subscriber,
      emailResult,
      emailSubject,
      successfulEmails,
      failedEmails,
      emailHistoryUpdates,
    );

    // Delay between emails to prevent rate limiting (except for last subscriber)
    const isLastSubscriber =
      successfulEmails.length + failedEmails.length >= totalSubscribers;
    if (!isLastSubscriber) {
      await delay(EMAIL_CONFIG.DELAY_BETWEEN_EMAILS);
    }
  }
}

/**
 * Track email send result and update tracking arrays
 * @param {Object} subscriber - Subscriber object
 * @param {Object} emailResult - Email send result
 * @param {String} emailSubject - Email subject
 * @param {Array} successfulEmails - Success tracking array
 * @param {Array} failedEmails - Failure tracking array
 * @param {Array} emailHistoryUpdates - History updates array
 */
function trackEmailResult(
  subscriber,
  emailResult,
  emailSubject,
  successfulEmails,
  failedEmails,
  emailHistoryUpdates,
) {
  const emailInfo = {
    email: subscriber.email,
    name: subscriber.name,
  };

  const historyEntry = {
    subscriberId: subscriber._id,
    emailHistoryEntry: {
      emailSubject: emailSubject,
      created: new Date(),
      isSend: emailResult.success,
    },
  };

  if (emailResult.success) {
    successfulEmails.push(emailInfo);
    emailHistoryUpdates.push(historyEntry);
    console.log(`✓ Email sent successfully to: ${subscriber.email}`);
  } else {
    failedEmails.push({ ...emailInfo, error: emailResult.error });
    emailHistoryUpdates.push(historyEntry);
    console.log(`✗ Failed to send email to: ${subscriber.email}`);
    console.log(`  Error: ${emailResult.error}`);
  }
}

/**
 * Send email with retry logic using sendMail.createContent
 * @param {Object} subscriber - Subscriber object with name and email
 * @param {String} emailSubject - Email subject
 * @param {String} templatePath - Path to email template
 * @returns {Promise<Object>} Result object with success status and error if any
 */
async function sendEmailWithRetry(subscriber, emailSubject, templatePath) {
  let attempts = 0;

  while (attempts <= EMAIL_CONFIG.MAX_RETRIES) {
    try {
      const mailData = {
        replacements: {},
        mailTo: subscriber.email,
        contentPath: templatePath,
        subject: emailSubject,
      };

      await sendMail.createContent(mailData);
      return { success: true };
    } catch (error) {
      attempts++;
      if (attempts <= EMAIL_CONFIG.MAX_RETRIES) {
        console.log(
          `  Retry ${attempts}/${EMAIL_CONFIG.MAX_RETRIES} for ${subscriber.email} after ${EMAIL_CONFIG.RETRY_DELAY}ms...`,
        );
        await delay(EMAIL_CONFIG.RETRY_DELAY);
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
 * Update email history in database
 * @param {Array} emailHistoryUpdates - Array of history updates
 */
async function updateEmailHistoryInBulk(emailHistoryUpdates) {
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
}

/**
 * Build standardized response object
 * @param {Number} totalSubscribers - Total subscribers processed
 * @param {Number} successCount - Number of successful sends
 * @param {Number} failedCount - Number of failed sends
 * @param {String} message - Response message
 * @param {Object} details - Additional details
 * @returns {Object} Response object
 */
function buildResponse(
  totalSubscribers,
  successCount,
  failedCount,
  message,
  details = [],
) {
  return {
    status: "ok",
    message,
    totalSubscribers,
    successCount,
    failedCount,
    details,
  };
}

/**
 * Log process start information
 * @param {String} emailSubject - Email subject
 * @param {Number} limit - Subscriber limit
 * @param {String} templatePath - Template path
 */
function logProcessStart(emailSubject, limit, templatePath) {
  console.log("=== Starting Bulk Email Send Process ===");
  console.log(`Email Subject: ${emailSubject}`);
  console.log(`Limit: ${limit} subscribers`);
  console.log(`Template: ${templatePath}`);
}

/**
 * Log process completion information
 * @param {Number} totalSubscribers - Total subscribers
 * @param {Number} successCount - Success count
 * @param {Number} failedCount - Failed count
 */
function logProcessComplete(totalSubscribers, successCount, failedCount) {
  console.log("\n=== Email Send Process Completed ===");
  console.log(`Total Eligible Subscribers: ${totalSubscribers}`);
  console.log(`Successfully Sent: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
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
