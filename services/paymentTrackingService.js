"use strict";
const metaConversionsService = require("./metaConversionsService");
const courseRepo = require("../repositories/courseRepository");
const studentRepo = require("../repositories/studentRepository");

class PaymentTrackingService {
  /**
   * Track purchase event for Razorpay payments
   */
  async trackRazorpayPurchase(paymentData, userData) {
    try {
      const courseData = await this.getCourseData(paymentData.courseId);
      
      const purchaseData = {
        transactionId: paymentData.razorpayPaymentId || paymentData.paymentId,
        paymentId: paymentData.razorpayPaymentId || paymentData.paymentId,
        eventId: this.getStaticEventId(courseData.courseType),
        amount: paymentData.amount,
        currency: paymentData.currency,
        clientIp: paymentData.clientIp || "",
        userAgent: paymentData.userAgent || "",
        fbc: paymentData.fbc || "",
        fbp: paymentData.fbp || ""
      };

      const userInfo = {
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        firstName: userData.firstName || userData.name
      };

      await metaConversionsService.trackPurchase(purchaseData, userInfo, courseData);
    } catch (error) {
      console.error("PaymentTrackingService: Error tracking Razorpay purchase", error);
    }
  }

  /**
   * Track purchase event for Stripe payments
   */
  async trackStripePurchase(paymentData, userData) {
    try {
      const courseData = await this.getCourseData(paymentData.courseId);
      
      const purchaseData = {
        transactionId: paymentData.stripePaymentIntent || paymentData.paymentId,
        paymentId: paymentData.stripePaymentIntent || paymentData.paymentId,
        eventId: this.getStaticEventId(courseData.courseType),
        amount: paymentData.amount,
        currency: paymentData.currency,
        clientIp: paymentData.clientIp || "",
        userAgent: paymentData.userAgent || "",
        fbc: paymentData.fbc || "",
        fbp: paymentData.fbp || ""
      };

      const userInfo = {
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        firstName: userData.firstName || userData.name
      };

      await metaConversionsService.trackPurchase(purchaseData, userInfo, courseData);
    } catch (error) {
      console.error("PaymentTrackingService: Error tracking Stripe purchase", error);
    }
  }

  /**
   * Track purchase event for Pranic Purification courses
   */
  async trackPranicPurificationPurchase(paymentData, userData) {
    try {
      const courseData = {
        courseId: "pranic_purification",
        courseName: "Pranic Purification - Best online pranayama sadhana",
        courseType: "pranic_purification"
      };

      const purchaseData = {
        transactionId: paymentData.paymentId,
        paymentId: paymentData.paymentId,
        eventId: "pranic_purification",
        amount: userData.price,
        currency: userData.currency,
        clientIp: paymentData.clientIp,
        userAgent: paymentData.userAgent
      };

      const userInfo = {
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        firstName: userData.name
      };

      await metaConversionsService.trackPurchase(purchaseData, userInfo, courseData);
    } catch (error) {
      console.error("PaymentTrackingService: Error tracking Pranic Purification purchase", error);
    }
  }

  /**
   * Track purchase event for 200 TTC courses
   */
  async track200TTCPurchase(paymentData, userData) {
    try {
      const courseData = {
        courseId: "200_ttc",
        courseName: "200 Hours Online Yoga Teacher Training Course",
        courseType: "online_ttc"
      };

      const purchaseData = {
        transactionId: paymentData.paymentId,
        paymentId: paymentData.paymentId,
        eventId: "200_ttc",
        amount: userData.price,
        currency: userData.currency,
        clientIp: paymentData.clientIp || "",
        userAgent: paymentData.userAgent || "",
        fbc: paymentData.fbc || "",
        fbp: paymentData.fbp || ""
      };

      const userInfo = {
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        firstName: userData.name
      };

      await metaConversionsService.trackPurchase(purchaseData, userInfo, courseData);
    } catch (error) {
      console.error("PaymentTrackingService: Error tracking 200 TTC purchase", error);
    }
  }

  /**
   * Track purchase event for Rishikesh courses
   */
  async trackRishikeshPurchase(paymentData, userData) {
    try {     

      const courseData = {
        courseId: 'rishikesh_ttc',
        courseName: 'Rishikesh Yoga Teacher Training Course',
        courseType: 'rishikesh_ttc'
      };

      const eventId = 'rishikesh_ttc';

      const purchaseData = {
        transactionId: paymentData.paymentId,
        paymentId: paymentData.paymentId,
        eventId: eventId,
        amount: userData.price,
        currency: userData.currency,
        clientIp: paymentData.clientIp,
        userAgent: paymentData.userAgent        
      };

      const userInfo = {
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        firstName: userData.name
      };

      await metaConversionsService.trackPurchase(purchaseData, userInfo, courseData);
    } catch (error) {
      console.error("PaymentTrackingService: Error tracking Rishikesh purchase", error);
    }
  }

  /**
   * Track purchase event for Live Classes
   */
  async trackLiveClassPurchase(paymentData, userData) {
    try {
      const courseData = {
        courseId: "live_classes",
        courseName: "Live Yoga Classes",
        courseType: "live_yoga_classes"
      };

      const purchaseData = {
        transactionId: paymentData.paymentId,
        paymentId: paymentData.paymentId,
        eventId: "live_classes",
        amount: userData.price,
        currency: userData.currency,
        clientIp: paymentData.clientIp,
        userAgent: paymentData.userAgent,
        fbc: paymentData.fbc || "",
        fbp: paymentData.fbp || ""
      };

      const userInfo = {
        email: userData.email,
        phoneNumber: userData.phone,
        firstName: userData.name
      };

      await metaConversionsService.trackPurchase(purchaseData, userInfo, courseData);
    } catch (error) {
      console.error("PaymentTrackingService: Error tracking Live Class purchase", error);
    }
  }

  /**
   * Track purchase event for Swara Sadhana courses
   */
  async trackSwaraSadhanaPurchase(paymentData, userData) {
    try {
      const courseData = {
        courseId: "swara_sadhana",
        courseName: "Swara Sadhana",
        courseType: "breathing_course"
      };

      const purchaseData = {
        transactionId: paymentData.paymentId,
        paymentId: paymentData.paymentId,
        eventId: "swara_sadhana",
        amount: userData.price,
        currency: userData.currency,
        clientIp: paymentData.clientIp,
        userAgent: paymentData.userAgent
      };

      const userInfo = {
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        firstName: userData.name
      };

      await metaConversionsService.trackPurchase(purchaseData, userInfo, courseData);
    } catch (error) {
      console.error("PaymentTrackingService: Error tracking Swara Sadhana purchase", error);
    }
  }

  /**
   * Get course data from database
   */
  async getCourseData(courseId) {
    try {
      if (!courseId) {
        return {
          courseId: "unknown_course",
          courseName: "Yoga Course",
          courseType: "yoga_course"
        };
      }

      const course = await courseRepo.getCourseById(courseId);
      return {
        courseId: courseId,
        courseName: course?.coursetitle || "Yoga Course",
        courseType: this.determineCourseType(course?.coursetitle || "")
      };
    } catch (error) {
      console.error("PaymentTrackingService: Error getting course data", error);
      return {
        courseId: courseId || "unknown_course",
        courseName: "Yoga Course",
        courseType: "yoga_course"
      };
    }
  }

  determineCourseType(courseTitle) {
    const title = courseTitle.toLowerCase();
    
    if (title.includes("ttc") || title.includes("teacher training")) {
      return "teacher_training";
    } else if (title.includes("pranayama") || title.includes("pranic")) {
      return "pranayama_course";
    } else if (title.includes("live") || title.includes("online")) {
      return "live_yoga_classes";
    } else if (title.includes("breathing") || title.includes("swara")) {
      return "breathing_course";
    } else if (title.includes("rishikesh")) {
      return "rishikesh_course";
    } else {
      return "yoga_course";
    }
  }

  getStaticEventId(courseType) {
    const staticEventIds = {
      "online_ttc": "200_ttc",
      "pranayama_course": "pranic_purification",
      "live_yoga_classes": "live_classes",
      "breathing_course": "swara_sadhana",
      "rishikesh_course": "rishikesh",
      "teacher_training": "200_ttc",
      "yoga_course": "yoga_course"
    };
    return staticEventIds[courseType] || "yoga_course";
  }
}

module.exports = new PaymentTrackingService();
