"use strict";
const subscribeModel = require("../models/subscribeModel");

/**
 * Get all active subscribers
 * @returns {Promise<Array>} Array of subscriber documents
 */
async function getAllSubscribers() {
  try {
    const subscribers = await subscribeModel.find({}).select("_id name email");
    return subscribers;
  } catch (error) {
    throw error;
  }
}

/**
 * Get filtered subscribers based on email history
 * Returns subscribers who either:
 * 1. Don't have the emailSubject in their emailHistory, OR
 * 2. Have the emailSubject but isSend is false
 * @param {String} emailSubject - Email subject to filter by
 * @param {Number} limit - Maximum number of subscribers to return
 * @returns {Promise<Array>} Array of filtered subscriber documents
 */
async function getFilteredSubscribers(emailSubject, limit = 500) {
  try {
    const subscribers = await subscribeModel
      .find({
        $or: [
          // Case 1: emailSubject not in emailHistory at all
          { "emailHistory.emailSubject": { $ne: emailSubject } },
          // Case 2: emailSubject exists but isSend is false
          {
            emailHistory: {
              $elemMatch: {
                emailSubject: emailSubject,
                isSend: false,
              },
            },
          },
        ],
      })
      .select("_id name email emailHistory")
      .limit(limit);

    return subscribers;
  } catch (error) {
    throw error;
  }
}

/**
 * Update email history for a single subscriber
 * @param {String} subscriberId - Subscriber's MongoDB _id
 * @param {Object} emailHistoryEntry - Email history entry object
 * @returns {Promise<Object>} Updated subscriber document
 */
async function updateEmailHistory(subscriberId, emailHistoryEntry) {
  try {
    const updatedSubscriber = await subscribeModel.findByIdAndUpdate(
      subscriberId,
      {
        $push: {
          emailHistory: emailHistoryEntry,
        },
      },
      { new: true },
    );
    return updatedSubscriber;
  } catch (error) {
    throw error;
  }
}

/**
 * Bulk update email history for multiple subscribers
 * @param {Array} updates - Array of {subscriberId, emailHistoryEntry} objects
 * @returns {Promise<Object>} Result with success and failure counts
 */
async function bulkUpdateEmailHistory(updates) {
  try {
    if (!updates || updates.length === 0) {
      return { success: 0, failed: 0 };
    }

    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.subscriberId },
        update: {
          $push: {
            emailHistory: update.emailHistoryEntry,
          },
        },
      },
    }));

    const result = await subscribeModel.bulkWrite(bulkOps);
    return {
      success: result.modifiedCount,
      failed: updates.length - result.modifiedCount,
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAllSubscribers,
  getFilteredSubscribers,
  updateEmailHistory,
  bulkUpdateEmailHistory,
};
