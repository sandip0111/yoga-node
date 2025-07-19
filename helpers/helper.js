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
module.exports = {
  getTimeBefore,
  sendRegistrationEmailV2,
  sendRegistrationEmail,
};
