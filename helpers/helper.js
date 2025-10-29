"use strict";
const studentRepo = require("../repositories/studentRepository");
const courseRepo = require("../repositories/courseRepository");
const constants = require("./constants.json");
const sendMail = require("./nodemail");

function getTimeBefore(duration) {
  // Split start and end times
  let [start, end] = duration.split(" - ");

  // Convert start time to Date object
  let startTime = parseTime(start);

  // Subtract 10 minutes
  let timeBefore = new Date(startTime);
  timeBefore.setMinutes(timeBefore.getMinutes() - 10);

  // Format output
  return {
    startTime: formatTime(startTime),
    timeBefore: formatTime(timeBefore),
  };
}
function parseTime(timeStr) {
  let isPM = timeStr.includes("PM");
  let [hours, minutes] = timeStr.replace("AM", "").replace("PM", "").split(":");

  hours = parseInt(hours);
  minutes = minutes ? parseInt(minutes) : 0;

  // Convert 12-hour format to 24-hour format
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0; // Handle midnight (12 AM)

  let date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date;
}
function formatTime(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let suffix = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12; // Convert 24-hour to 12-hour format

  return `${hours}${
    minutes ? ":" + String(minutes).padStart(2, "0") : ""
  } ${suffix}`;
}
let sendRegistrationEmailV2 = async function (id) {
  const student = await studentRepo.getStudentById(id);
  const mailData = {
    replacements: {
      name: student.firstName,
      password: student.password,
      email: student.email,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.SIGNUP_BREATH_DTOX,
    subject: "Registration Mail",
  };
  sendMail.createContent(mailData);
};
let sendRegistrationEmail = async function (id) {
  const student = await studentRepo.getStudentById(id);
  let course = await courseRepo.getCourseById(constants.COURSE.PRANA_ARAMBHA);
  const mailData = {
    replacements: {
      name: student.firstName,
      password: student.password,
      email: student.email,
      courseTitle: course,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.ADMIN_PRANA_ARAMBH,
    subject: course,
  };
  sendMail.createContent(mailData);
};
let sendWebinerEmail = async function (student) {
  const mailData = {
    replacements: {
      name: student.name,
      password: student.password,
      email: student.email,
      courseTitle: "Swara Sadhana Webiner",
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.ADMIN_PRANA_ARAMBH,
    subject: `Swara Sadhana Webiner Registration Confirmation`,
  };
  sendMail.createContent(mailData);
};
let sendPranicEmail = async function (student) {
  const mailData = {
    replacements: {
      NAME: student.name,
      COURSETITLE: "21 Days Pranic Purification",
      WLINK: constants.LINK.WHATSAPP_COMMUNITY_LINK,
      FB: constants.LINK.FB_LINK,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.ADMIN_REGISTER,
    subject: `21 Days Pranic Purification Registration Confirmation`,
  };
  sendMail.createContent(mailData);
};
let send200TTCEmail = async function (student) {
  const mailData = {
    replacements: {
      name: student.name,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE["200_HOURS_TTC"],
    subject: "🕉 Welcome to the Yoga Vidya Family!",
  };
  sendMail.createContent(mailData);
};
let complete200TTCEmail = async function (student) {
  const mailData = {
    replacements: {
      NAME: student.name,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.COMPLETE_200_TTC_PAYMENT,
    subject: "Complete your journey with Yoga Vidya School",
  };
  sendMail.createContent(mailData);
};
let sendSwaraSadhnaEmail = async function (data, email) {
  const mailData = {
    replacements: data,
    mailTo: email,
    contentPath: constants.EMAIL_TEMPLATE.SWARA,
    subject: "Swara Sadhana Webiner Registration Confirmation",
  };
  sendMail.createContent(mailData);
};
let sendLiveCourseEmail = async function (data, email, emailTemplate, subject) {
  const mailData = {
    replacements: data,
    mailTo: email,
    contentPath: emailTemplate,
    subject: subject,
  };
  sendMail.createContent(mailData);
};
let sendRishikeshCourseEmail = async function (user) {
  let mailData;
  if (user.hour == 100) {
    const fileName = constants.EMAIL_TEMPLATE.RISHI100;
    mailData = {
      replacements: {
        NAME: user.name,
        WLINK: constants.LINK["100_HOURS_RISHIKESH"],
      },
      mailTo: user.email,
      contentPath: fileName,
      subject: "🕉 Welcome to Your Yogic Journey – 100 Hrs TTC",
    };
  } else if (user.hour == 200) {
    const fileName = constants.EMAIL_TEMPLATE.RISHIKESH;
    mailData = {
      replacements: {
        NAME: user.name,
        COURSE: "200-Hour Yoga Teacher Training in Rishikesh",
        WLINK: constants.LINK["100_HOURS_RISHIKESH"],
      },
      mailTo: user.email,
      contentPath: fileName,
      subject: "🕉 Welcome to the Yoga Vidya Family!",
    };
  } else if (user.hour == 300) {
    const fileName = constants.EMAIL_TEMPLATE.RISHI300;
    mailData = {
      replacements: {
        NAME: user.name,
        WLINK: constants.LINK["300_HOURS_RISHIKESH"],
      },
      mailTo: user.email,
      contentPath: fileName,
      subject: "🕉 Welcome to the Next Step – 300 Hrs TTC",
    };
  }
  sendMail.createContent(mailData);
};
let sendPranaArambhEmail = async function (replacement) {
  const fileName = constants.EMAIL_TEMPLATE.ORDER_CONFIRMATION;
  let mailData = {
    replacements: replacement,
    mailTo: replacement.email,
    contentPath: fileName,
    subject: `Purchase Confirmation - ${replacement.course}`,
  };
  sendMail.createContent(mailData);
};
let completeSwaraSadhanaEmail = async function (student) {
  const mailData = {
    replacements: {
      NAME: student.name,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.COMPLETE_SWARA_SADHANA,
    subject: "Complete your journey with Yoga Vidya School",
  };
  sendMail.createContent(mailData);
};

let sendFreeWebinarConfirmationEmail = async function (data) {
  try {
    const mailData = {
      replacements: {
        FirstName: data.name,
      },
      mailTo: data.email,
      contentPath: constants.EMAIL_TEMPLATE.FREE_WEBINAR_CONFIRMATION,
      subject: 'Replay: “From Sadhana to Seva”',
    };
    await sendMail.createContent(mailData);
  } catch (error) {
    console.error(
      `❌ Failed to send webinar confirmation email to ${email}`,
      error
    );
  }
};

let completeOnlineSadhanaEmail = async function (student) {
  const mailData = {
    replacements: {
      NAME: student.name,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.COMPLETE_ONLINE_SADHANA,
    subject: "Complete your journey with Yoga Vidya School",
  };
  sendMail.createContent(mailData);
};
let completePranaArambhEmail = async function (student) {
  const mailData = {
    replacements: {
      NAME: student.firstName,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.COMPLETE_PRANA_ARAMBH,
    subject: "Complete your journey with Yoga Vidya School",
  };
  sendMail.createContent(mailData);
};
let sendBulkFreeWebinerMail = async function (email) {
  const mailData = {
    replacements: {},
    mailTo: email,
    contentPath: constants.EMAIL_TEMPLATE.BULK_FREE_WEB,
    subject: "Thank you for joining Sadhana to Seva",
  };
  await sendMail.createContent(mailData);
};
module.exports = {
  getTimeBefore,
  sendRegistrationEmailV2,
  sendRegistrationEmail,
  sendWebinerEmail,
  sendPranicEmail,
  send200TTCEmail,
  sendSwaraSadhnaEmail,
  sendLiveCourseEmail,
  sendRishikeshCourseEmail,
  sendPranaArambhEmail,
  complete200TTCEmail,
  completeSwaraSadhanaEmail,
  completeOnlineSadhanaEmail,
  sendFreeWebinarConfirmationEmail,
  completePranaArambhEmail,
  sendBulkFreeWebinerMail,
};
