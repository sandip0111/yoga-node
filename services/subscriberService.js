"use strict";
const subscriberRepo = require("../repositories/subscriberRepository");
const sendMail = require("../helpers/nodemail");
const helper = require("../helpers/helper");

/**
 * Send bulk emails to filtered subscribers with robust error handling
 * Uses the background campaign runner
 * Sends only to subscribers who haven't received the email or failed to receive it
 * @param {String} emailSubject - Subject line for the email
 * @param {Number} limit - Maximum number of subscribers to send to
 * @param {Array} preFetchedSubscribers - Pre-fetched list of eligible subscribers
 * @returns {Promise<Object>} Result with status and subscriber count
 */
async function sendBulkEmailToSubscribers(
  emailSubject = sendMail.EMAIL_CONFIG.DEFAULT_SUBJECT,
  limit = sendMail.EMAIL_CONFIG.DEFAULT_LIMIT,
  preFetchedSubscribers = null
) {
  try {
    const subscribers = preFetchedSubscribers || await subscriberRepo.getFilteredSubscribers(emailSubject, limit);

    console.log(`Total eligible subscribers found: ${subscribers.length}`);

    // Deduplicate emails to ensure we do not send multiple emails to the same address
    const uniqueSubscribers = helper.deduplicateByEmail(subscribers);
    console.log(`Total unique subscribers to process: ${uniqueSubscribers.length}`);

    if (uniqueSubscribers.length === 0) {
      return {
        status: "ok",
        message: "No eligible subscribers found",
        totalSubscribers: 0,
      };
    }

    // Filter valid and existing emails to prevent bounces
    const emailValidator = require("../helpers/emailValidator");
    console.log("[SubscriberCampaign] Validating email addresses and domain DNS records...");
    const validSubscribers = await emailValidator.filterValidEmails(uniqueSubscribers);
    console.log(`[SubscriberCampaign] Validation complete. Total Unique: ${uniqueSubscribers.length}, Valid: ${validSubscribers.length}, Filtered out: ${uniqueSubscribers.length - validSubscribers.length}`);

    if (validSubscribers.length === 0) {
      console.log("[SubscriberCampaign] No valid subscriber emails remaining after validation.");
      return {
        status: "ok",
        message: "No valid subscribers found after email verification",
        totalSubscribers: 0,
      };
    }

    const emailHistoryUpdates = [];

    // Trigger the background send
    sendMail.sendCampaignInBackground(
      validSubscribers,
      {
        subject: emailSubject,
        templatePath: sendMail.EMAIL_CONFIG.DEFAULT_TEMPLATE,
        replacementsFn: (sub) => ({ NAME: sub.name }),
        onResult: async (sub, success, lastError) => {
          emailHistoryUpdates.push({
            subscriberId: sub._id,
            emailHistoryEntry: {
              emailSubject: emailSubject,
              created: new Date(),
              isSend: success,
            },
          });
        },
        onComplete: async (successCount, failedCount) => {
          if (emailHistoryUpdates.length > 0) {
            console.log(`[Subscriber Campaign] Updating email history for ${emailHistoryUpdates.length} subscribers...`);
            try {
              const updateResult = await subscriberRepo.bulkUpdateEmailHistory(emailHistoryUpdates);
              console.log(`[Subscriber Campaign] Email history updated: ${updateResult.success} records updated`);
            } catch (historyErr) {
              console.error("[Subscriber Campaign] Error saving email history:", historyErr);
            }
          }
          console.log(`[Subscriber Campaign] Background send complete. Success: ${successCount}, Failed: ${failedCount}`);
        },
      }
    );

    return {
      status: "ok",
      message: "Bulk email process initiated in the background",
      totalSubscribers: validSubscribers.length,
    };
  } catch (error) {
    console.error("Error initiating bulk email process:", error);
    throw error;
  }
}

module.exports = {
  sendBulkEmailToSubscribers,
};
