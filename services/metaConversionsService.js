"use strict";
const axios = require("axios");
const crypto = require("crypto");

class MetaConversionsService {
  constructor() {
    this.accessToken = process.env.META_CONVERSIONS_ACCESS_TOKEN;
    this.pixelId = process.env.META_PIXEL_ID;
    this.apiVersion = "v19.0";
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events`;
  }

  async trackPurchase(purchaseData, userData, courseData) {
    try {
      if (!this.accessToken || !this.pixelId) {
        console.log("Meta Conversions API credentials not configured");
        return;
      }

      const eventData = this.buildPurchaseEventData(purchaseData, userData, courseData);
      
      const response = await axios.post(this.baseUrl, eventData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 second timeout
      });

      console.log("Meta Conversions API: Purchase event tracked successfully", response.data);
      return response.data;
    } catch (error) {
      console.error("Meta Conversions API: Error tracking purchase event", error.response?.data || error.message);
      // Don't throw error to avoid disrupting payment flow
    }
  }

  /**
   * Build purchase event data according to Meta Conversions API format
   */
  buildPurchaseEventData(purchaseData, userData, courseData) {
    const eventTime = Math.floor(Date.now() / 1000);
    
    // Hash user data for privacy
    const hashedEmail = userData.email ? crypto.createHash('sha256').update(userData.email.toLowerCase()).digest('hex') : null;
    const hashedPhone = userData.phoneNumber ? crypto.createHash('sha256').update(userData.phoneNumber.toString()).digest('hex') : null;

    const eventData = {
      data: [{
        event_name: "Purchase",
        event_time: eventTime,
        event_id: purchaseData.transactionId || purchaseData.paymentId,
        event_source_url: "https://yogavidyaschool.com",
        action_source: "website",
        user_data: {
          em: [hashedEmail],
          ph: [hashedPhone],
          client_ip_address: purchaseData.clientIp || "",
          client_user_agent: purchaseData.userAgent || "",
          fbc: purchaseData.fbc || "", // Facebook click ID
          fbp: purchaseData.fbp || ""  // Facebook browser ID
        },
        custom_data: {
          currency: purchaseData.currency || "USD",
          value: parseFloat(purchaseData.amount) || 0,
          content_ids: [courseData.courseId],
          content_name: courseData.courseName,
          content_type: "yoga_course",
          content_category: courseData.courseType || "yoga_training",
          num_items: 1
        }
      }]
    };

    // Remove test_event_code if not set
    if (!eventData.test_event_code) {
      delete eventData.test_event_code;
    }

    return eventData;
  }

  /**
   * Track custom events (for future use)
   */
  async trackCustomEvent(eventName, eventData, userData) {
    try {
      if (!this.accessToken || !this.pixelId) {
        console.log("Meta Conversions API credentials not configured");
        return;
      }

      const eventTime = Math.floor(Date.now() / 1000);
      const hashedEmail = userData.email ? crypto.createHash('sha256').update(userData.email.toLowerCase()).digest('hex') : null;

      const customEventData = {
        data: [{
          event_name: eventName,
          event_time: eventTime,
          event_id: eventData.eventId || `custom_${Date.now()}`,
          event_source_url: "https://yogavidyaschool.com",
          action_source: "website",
          user_data: {
            em: [hashedEmail],
            client_ip_address: eventData.clientIp || "",
            client_user_agent: eventData.userAgent || ""
          },
          custom_data: eventData.customData || {}
        }]
      };

      const response = await axios.post(this.baseUrl, customEventData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      console.log(`Meta Conversions API: ${eventName} event tracked successfully`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Meta Conversions API: Error tracking ${eventName} event`, error.response?.data || error.message);
    }
  }

  /**
   * Validate Meta Conversions API configuration
   */
  validateConfig() {
    const missing = [];
    if (!this.accessToken) missing.push("META_CONVERSIONS_ACCESS_TOKEN");
    if (!this.pixelId) missing.push("META_PIXEL_ID");
    
    if (missing.length > 0) {
      console.warn("Meta Conversions API: Missing environment variables:", missing.join(", "));
      return false;
    }
    return true;
  }
}

module.exports = new MetaConversionsService();
