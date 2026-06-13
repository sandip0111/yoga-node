"use strict";
const studentRepo = require("../repositories/studentRepository");
const courseRepo = require("../repositories/courseRepository");
const constants = require("./constants.json");
const sendMail = require("./nodemail");
const { MonthEnum } = require("../models/rishikeshStudent");
const pranicPurificationUsersModel = require("../models/pranicPurificationUsersModel");

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

  return `${hours}${minutes ? ":" + String(minutes).padStart(2, "0") : ""
    } ${suffix}`;
}
let sendRegistrationEmailV2 = async function (id) {
  const student = await studentRepo.getStudentById(id);
  const mailData = {
    replacements: {
      NAME: `${student.firstName} ${student.lastName}`,
      PASS: student.password,
      ID: student.email,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.SIGNUP_BREATH_DTOX,
    subject: "Thank you for join our BREATH DETOX YOGA course",
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
let send200TTCInstalmentEmail = async function (user, reqBody) {
  const fileName =
    reqBody.installment == "1st"
      ? constants.EMAIL_TEMPLATE["200_HOURS_TTC_1ST"]
      : constants.EMAIL_TEMPLATE["200_HOURS_TTC"];
  const mailData = {
    replacements: {
      NAME: user.name,
      USER: user.email,
      PASS: reqBody.password,
    },
    mailTo: user.email,
    contentPath: fileName,
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
    if (user.month == MonthEnum.March26) {
      const fileName = constants.EMAIL_TEMPLATE.RISHI100;
      mailData = {
        replacements: {
          NAME: user.name,
          WLINK: constants.LINK["100_HOURS_RISHIKESH_MARCH"],
          BOOK_LINK: constants.LINK.RISHIKESH_BOOKS,
        },
        mailTo: user.email,
        contentPath: fileName,
        subject: "🕉 Welcome to Your Yogic Journey – 100 Hrs TTC",
      };
    } else if (user.month == MonthEnum.October26) {
      const fileName = constants.EMAIL_TEMPLATE.RISHI100;
      mailData = {
        replacements: {
          NAME: user.name,
          WLINK: constants.LINK["100_HOURS_RISHIKESH_OCTOBER"],
          BOOK_LINK: constants.LINK.RISHIKESH_BOOKS,
        },
        mailTo: user.email,
        contentPath: fileName,
        subject: "🕉 Welcome to Your Yogic Journey – 100 Hrs TTC",
      };
    }
  } else if (user.hour == 200) {
    if (user.month == MonthEnum.March26) {
      const fileName = constants.EMAIL_TEMPLATE.RISHIKESH;
      mailData = {
        replacements: {
          NAME: user.name,
          COURSE: "200-Hour Yoga Teacher Training in Rishikesh",
          WLINK: constants.LINK["100_HOURS_RISHIKESH_MARCH"],
          BOOK_LINK: constants.LINK.RISHIKESH_BOOKS,
        },
        mailTo: user.email,
        contentPath: fileName,
        subject: "🕉 Welcome to the Yoga Vidya Family!",
      };
    } else if (user.month == MonthEnum.October26) {
      const fileName = constants.EMAIL_TEMPLATE.OCTOBER_200_HOURS_RISHIKESH;
      mailData = {
        replacements: {
          NAME: user.name,
          COURSE: "200-Hour Yoga Teacher Training in Rishikesh",
          BOOK_LINK: constants.LINK.RISHIKESH_BOOKS,
        },
        mailTo: user.email,
        contentPath: fileName,
        subject: "🕉 Welcome to the Yoga Vidya Family!",
      };
    }
  } else if (user.hour == 300) {
    if (user.month == MonthEnum.March26) {
      const fileName = constants.EMAIL_TEMPLATE.RISHI300;
      mailData = {
        replacements: {
          NAME: user.name,
          WLINK: constants.LINK["300_HOURS_RISHIKESH_MARCH"],
          BOOK_LINK: constants.LINK.RISHIKESH_BOOKS,
        },
        mailTo: user.email,
        contentPath: fileName,
        subject: "🕉 Welcome to the Next Step – 300 Hrs TTC",
      };
    } else if (user.month == MonthEnum.October26) {
      const fileName = constants.EMAIL_TEMPLATE.OCTOBER_300_HOURS_RISHIKESH;
      mailData = {
        replacements: {
          NAME: user.name,
          BOOK_LINK: constants.LINK.RISHIKESH_BOOKS,
        },
        mailTo: user.email,
        contentPath: fileName,
        subject: "🕉 Welcome to the Next Step – 300 Hrs TTC",
      };
    }
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
let completePranicPurificationAutomationEmail = async function (
  user,
  password,
) {
  const mailData = {
    replacements: {
      NAME: user.name,
      USER: user.email,
      PASS: password,
    },
    mailTo: user.email,
    contentPath: constants.EMAIL_TEMPLATE.PRANIC_PURIFICATION,
    subject: "Welcome to “PRANIC PURIFICATION”  with Prashantji",
  };
  sendMail.createContent(mailData);
};
let completePranicPurificationIIAutomationEmail = async function (
  user,
  password,
) {
  const mailData = {
    replacements: {
      NAME: user.name,
      USER: user.email,
      PASS: password,
    },
    mailTo: user.email,
    contentPath: constants.EMAIL_TEMPLATE.PRANIC_PURIFICATION_II,
    subject: "Welcome to Pranic Purification II",
  };
  await sendMail.createContent(mailData);
};
let sendFreeWebinarConfirmationEmail = async function (data) {
  try {
    const mailData = {
      replacements: {
        FirstName: data.name,
      },
      mailTo: data.email,
      contentPath: constants.EMAIL_TEMPLATE.FREE_WEBINAR_CONFIRMATION,
      subject: "Thank you for joining Breath of Yogis",
    };
    await sendMail.createContent(mailData);
  } catch (error) {
    console.error(
      `❌ Failed to send webinar confirmation email to ${email}`,
      error,
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
let completefOSEmail = async function (student) {
  const mailData = {
    replacements: {
      NAME: student.firstName,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.COMPLETE_FOS,
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
let sendBulkMail200TTC = async function (obj) {
  const mailData = {
    replacements: {
      USER: obj.email,
      PASSWORD: obj.password,
    },
    mailTo: obj.email,
    contentPath: constants.EMAIL_TEMPLATE.BULK_200_TTC,
    subject: "🌞 Welcome to the TTC Online Virtual Classroom",
  };
  await sendMail.createContent(mailData);
};
let genratePass = function (len) {
  var charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?";
  var password = "";
  for (var i = 0; i < len; i++) {
    var randomIndex = Math.floor(Math.random() * charset.length);
    password += charset.charAt(randomIndex);
  }
  return password;
};
let get24HoursPranicPurificationMailAfterPaymentEmail = async function (
  student,
) {
  const mailData = {
    replacements: {
      NAME: student.name,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.PRANIC_PURIFICATION_24_HOURS,
    subject: "A message from Prashant",
  };
  sendMail.createContent(mailData);
};
let completePranicPurificationEmail = async function (student) {
  const mailData = {
    replacements: {
      NAME: student.name,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.COMPLETE_PRANIC_PURIFICATION,
    subject: "Complete your journey with Yoga Vidya School",
  };
  sendMail.createContent(mailData);
};
let completePranicPurificationIIEmail = async function (student) {
  const mailData = {
    replacements: {
      NAME: student.name,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.COMPLETE_PRANIC_PURIFICATION_II,
    subject: "Complete your journey with Yoga Vidya School",
  };
  sendMail.createContent(mailData);
};
let completeRishikeshEmail = async function (student) {
  let link = "";
  if (student.hour == 100) {
    if (student.month == MonthEnum.March26) {
      link = constants.LINK["RISHIKESH_100_HRS_MARCH_CHECKOUT"];
    } else if (student.month == MonthEnum.October26) {
      link = constants.LINK["RISHIKESH_100_HRS_OCTOBER_CHECKOUT"];
    }
  } else if (student.hour == 200) {
    if (student.month == MonthEnum.March26) {
      link = constants.LINK["RISHIKESH_200_HRS_MARCH_CHECKOUT"];
    } else if (student.month == MonthEnum.October26) {
      link = constants.LINK["RISHIKESH_200_HRS_OCTOBER_CHECKOUT"];
    }
  } else if (student.hour == 300) {
    if (student.month == MonthEnum.March26) {
      link = constants.LINK["RISHIKESH_300_HRS_MARCH_CHECKOUT"];
    } else if (student.month == MonthEnum.October26) {
      link = constants.LINK["RISHIKESH_300_HRS_OCTOBER_CHECKOUT"];
    }
  }
  const mailData = {
    replacements: {
      NAME: student.name,
      LINK: link,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.COMPLETE_RISHIKESH,
    subject: "Complete your journey with Yoga Vidya School",
  };
  sendMail.createContent(mailData);
};
let sendBaliCourseEmail = async function (user) {
  let mailData;
  if (user.hour == 100) {
    const fileName = constants.EMAIL_TEMPLATE.BALI100;
    mailData = {
      replacements: {
        NAME: user.name,
      },
      mailTo: user.email,
      contentPath: fileName,
      subject: "🕉 Welcome to the Next Step – 100 Hrs TTC Bali",
    };
  } else if (user.hour == 200) {
    const fileName = constants.EMAIL_TEMPLATE.BALI200;
    mailData = {
      replacements: {
        NAME: user.name,
      },
      mailTo: user.email,
      contentPath: fileName,
      subject: "🕉 Welcome to the Next Step – 200 Hrs TTC Bali",
    };
  } else if (user.hour == 300) {
    const fileName = constants.EMAIL_TEMPLATE.BALI300;
    mailData = {
      replacements: {
        NAME: user.name,
      },
      mailTo: user.email,
      contentPath: fileName,
      subject: "🕉 Welcome to the Next Step – 300 Hrs TTC Bali",
    };
  }
  sendMail.createContent(mailData);
};
let completeBaliEmail = async function (student) {
  let link = "";
  switch (student.hour) {
    case 100:
      link =
        "https://www.yogavidyaschool.com/checkout/100-hour-yoga-teacher-training-in-bali";
      break;
    case 200:
      link =
        "https://www.yogavidyaschool.com/checkout/200-hour-yoga-teacher-training-in-bali";
      break;
    case 300:
      link =
        "https://www.yogavidyaschool.com/checkout/300-hour-yoga-teacher-training-in-bali";
      break;
  }
  const mailData = {
    replacements: {
      NAME: student.name,
      LINK: link,
    },
    mailTo: student.email,
    contentPath: constants.EMAIL_TEMPLATE.COMPLETE_BALI,
    subject: "Complete your journey with Yoga Vidya School",
  };
  sendMail.createContent(mailData);
};
let completeFoundationOfSpiritualityMail = async function ({
  firstName,
  email,
  password,
}) {
  const mailData = {
    replacements: {
      NAME: firstName,
      EMAIL: email,
      PASS: password,
    },
    mailTo: email,
    contentPath: constants.EMAIL_TEMPLATE.FOUNDATION_OF_SPIRITUALITY,
    subject: "Thank you for join our FOUNDATION OF SPIRITUALITY course",
  };
  sendMail.createContent(mailData);
};
let onlineSadhanaClassSendMail = async function (name, email, item, pass) {
  const replacements = {
    NAME: name,
    ZOOM: item.zoomLink,
    MID: item.meetingId,
    PASSCODE: item.passcode,
    WHATSAPP: item.whatsappLink,
    USER: email,
    PASS: pass,
    SDATE: item.startDate,
    CDAYS: item.date,
    CTIME: item.time,
  };
  const mailData = {
    replacements: replacements,
    mailTo: email,
    contentPath: `/emailTemplate/${item.emailTemplate}`,
    subject: item.subject,
  };
  sendMail.createContent(mailData);
};
let adminOnlineSadhanaClassSendMail = async function (replacements) {
  const mailData = {
    replacements: replacements,
    mailTo: constants.EMAIL_DATA.REPLY_TO,
    contentPath: constants.EMAIL_TEMPLATE.ADMIN_ORDERS_FOR_LIVE_CLASSES,
    subject: "Admin Purchase Confirmation for online classes",
  };
  sendMail.createContent(mailData);
};
let sendMailForcefully = async function (req, res) {
  const pipeline = [
    {
      $match: {
        month: "January, 2026",
        paymentStatus: "paid",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
      },
    },
  ];
  const users = await pranicPurificationUsersModel.aggregate(pipeline);
  console.log(`Found ${users.length} students to send emails to`);
  for (const user of users) {
    const mailData = {
      replacements: {
        NAME: user.name,
      },
      mailTo: user.email,
      contentPath: constants.EMAIL_TEMPLATE.PRANIC_PURIFICATION_FORCEFULLY,
      subject: "Continuing the Path After Pranic Purification",
    };

    try {
      await sendMail.createContent(mailData);
      console.log(`Email sent successfully to ${user.name} (${user.email})`);
    } catch (emailError) {
      console.error(`Failed to send email to ${user.email}:`, emailError);
    }
  }

  res.status(200).json({
    success: true,
    totalUsers: users.length,
    users,
    message: `Emails sent to ${users.length} users`,
  });
};
let sendPranayamaCertificationEmail = async function (user, password) {
  const mailData = {
    replacements: {
      NAME: user.name
    },
    mailTo: user.email,
    contentPath: constants.EMAIL_TEMPLATE.PRANAYAMA_CERTIFICATION,
    subject: "Welcome to your Pranayama Certification",
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
  sendBulkMail200TTC,
  genratePass,
  completePranicPurificationAutomationEmail,
  get24HoursPranicPurificationMailAfterPaymentEmail,
  completePranicPurificationEmail,
  completeRishikeshEmail,
  sendBaliCourseEmail,
  completeBaliEmail,
  completeFoundationOfSpiritualityMail,
  completefOSEmail,
  onlineSadhanaClassSendMail,
  adminOnlineSadhanaClassSendMail,
  sendMailForcefully,
  send200TTCInstalmentEmail,
  completePranicPurificationIIAutomationEmail,
  completePranicPurificationIIEmail,
  sendPranayamaCertificationEmail
};
