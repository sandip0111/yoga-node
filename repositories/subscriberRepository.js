"use strict";
const subscribeModel = require("../models/subscribeModel");

/**
 * Get all active subscribers
 * @returns {Promise<Array>} Array of subscriber documents
 */
function getAllSubscribers() {
  return new Promise(async (resolve, reject) => {
    try {
      const subscribers = await subscribeModel
        .find({})
        .select("_id name email");
      return resolve(subscribers);
    } catch (error) {
      return reject(error);
    }
  });
}

/**
 * Update email history for a single subscriber
 * @param {String} subscriberId - Subscriber's MongoDB _id
 * @param {Object} emailHistoryEntry - Email history entry object
 * @returns {Promise<Object>} Updated subscriber document
 */
function updateEmailHistory(subscriberId, emailHistoryEntry) {
  return new Promise(async (resolve, reject) => {
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
      return resolve(updatedSubscriber);
    } catch (error) {
      return reject(error);
    }
  });
}

/**
 * Bulk update email history for multiple subscribers
 * @param {Array} updates - Array of {subscriberId, emailHistoryEntry} objects
 * @returns {Promise<Object>} Result with success and failure counts
 */
function bulkUpdateEmailHistory(updates) {
  return new Promise(async (resolve, reject) => {
    try {
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
      return resolve({
        success: result.modifiedCount,
        failed: updates.length - result.modifiedCount,
      });
    } catch (error) {
      return reject(error);
    }
  });
}

module.exports = {
  getAllSubscribers,
  updateEmailHistory,
  bulkUpdateEmailHistory,
};
