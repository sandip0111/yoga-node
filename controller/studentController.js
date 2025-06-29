const Student = require("../models/StudentModel");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const transporter = require("../helpers/nodemail");
const courseModel = require("../models/courseModel");
const liveCoursesCustomerModel = require("../models/liveCoursesCustomerModel");
const studentService = require("../services/studentService");
module.exports = {
  createUpdateStudent: async function (req, res) {
    {
      try {
        const result = await studentService.createUpdateStudent(req.body);
        res.status(200).json(result);
      } catch (err) {
        res.status(400).json({ err });
      }
    }
  },

  getAllParayanamStudent: async function (req, res) {
    try {
      const result = await studentService.getAllParayanamStudent(req.body);
      res
        .status(200)
        .json({ data: result.studentList, total: result.totalStudent });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  getAllLiveClassStudent: async function (req, res) {
    try {
      const result = await studentService.getAllLiveClassStudent(req.body);
      res
        .status(200)
        .json({ data: result.studentList, total: result.totalData });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  getAllBreathDetoxStudent: async function (req, res) {
    try {
      const result = await studentService.getAllBreathDtoxStudent(req.body);
      res
        .status(200)
        .json({ data: result.studentList, total: result.totalStudent });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  getAllFoundationOfSpiritualityStudent: async function (req, res) {
    try {
      const result = await studentService.getAllFoundationOfSpiritualityStudent(
        req.body
      );
      res
        .status(200)
        .json({ data: result.studentList, total: result.totalStudent });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  getAllStudentCourseListAndCount: async function (req, res) {
    try {
      let size = req.body.size || 10;
      let pageNo = req.body.pageNo || 1;
      const skip = Number(size * (pageNo - 1));
      let search = req.body.searchText;
      const limit = Number(size) || 0;
      const courseMapping = {
        "644f9dfc499ffcfb45df35cd": "Pranayama",
        "63c3f26c461e531f3c3452e1": "Breath Detox",
        "63c4de4a2bce43a907211c74": "Foundation Of Spirituality",
      };
      // Global Search Filter (Regex for partial matching)
      const searchFilter = search
        ? {
            $or: [
              { firstName: { $regex: search, $options: "i" } },
              { lastName: { $regex: search, $options: "i" } },
              { city: { $regex: search, $options: "i" } },
              { phoneNumber: { $regex: search, $options: "i" } },
            ],
          }
        : {};

      const studentData = await Student.aggregate([
        { $match: searchFilter },
        { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { email: "$email", courseId: "$course" },
            firstName: { $first: "$firstName" },
            lastName: { $first: "$lastName" },
            city: { $first: "$city" },
            phoneNumber: { $first: "$phoneNumber" },
            created: { $first: "$created" },
            isActive: { $first: "$isActive" },
            source: { $first: "$source" },
            enrollmentDate: { $first: "$enrollmentDate" },
            sentEmail: { $first: "$sentEmail" },
            courseCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.email",
            firstName: { $first: "$firstName" },
            lastName: { $first: "$lastName" },
            city: { $first: "$city" },
            phoneNumber: { $first: "$phoneNumber" },
            created: { $first: "$created" },
            isActive: { $first: "$isActive" },
            source: { $first: "$source" },
            enrollmentDate: { $first: "$enrollmentDate" },
            sentEmail: { $first: "$sentEmail" },
            courses: {
              $push: {
                id: "$_id.courseId",
                name: { $literal: "" },
                count: "$courseCount",
              },
            },
          },
        },
      ]);

      const liveCoursesData = await liveCoursesCustomerModel.aggregate([
        { $match: searchFilter },
        { $unwind: { path: "$courses", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { email: "$email", title: "$courses.title" },
            firstName: { $first: "$name" },
            phoneNumber: { $first: "$phone" },
            created: { $first: "$created" },
            courseCount: { $sum: { $toInt: "$courses.quantity" } },
          },
        },
        {
          $group: {
            _id: "$_id.email",
            firstName: { $first: "$firstName" },
            phoneNumber: { $first: "$phoneNumber" },
            created: { $first: "$created" },
            courses: {
              $push: {
                name: "$_id.title",
                count: "$courseCount",
              },
            },
          },
        },
      ]);

      const combinedData = new Map();

      // Merge Student Data
      studentData.forEach((student) => {
        combinedData.set(student._id, {
          email: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          city: student.city,
          phoneNumber: student.phoneNumber,
          created: student.created,
          isActive: student.isActive,
          source: student.source,
          enrollmentDate: student.enrollmentDate,
          sentEmail: student.sentEmail,
          courses: student.courses.map((course) => ({
            id: course.id,
            name: courseMapping[course.id] || "Unknown Course",
            count: course.count,
          })),
        });
      });

      liveCoursesData.forEach((liveCustomer) => {
        if (combinedData.has(liveCustomer._id)) {
          // Merge courses if email exists in studentData
          const existingData = combinedData.get(liveCustomer._id);
          existingData.courses = existingData.courses.concat(
            liveCustomer.courses
          );
        } else {
          // If email is only in liveCoursesCustomer, add new entry
          combinedData.set(liveCustomer._id, {
            email: liveCustomer._id,
            firstName: liveCustomer.firstName,
            lastName: "",
            city: "",
            phoneNumber: liveCustomer.phoneNumber,
            created: liveCustomer.created,
            isActive: null,
            source: "",
            enrollmentDate: "",
            sentEmail: "",
            courses: liveCustomer.courses,
          });
        }
      });

      const finalResult = Array.from(combinedData.values());
      const paginatedData = finalResult.slice(skip, skip + limit);

      // Step 4: Send Response
      res.json({
        success: true,
        total: finalResult.length,
        data: paginatedData,
      });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  getKundaliniParichayRefferalCode: async function (req, res) {
    try {
      let code = "swarayoga@prashantji";
      res.status(200).json({ data: code });
    } catch (ex) {
      res.status(500).json({ error: err });
    }
  },

  getAllStudent: async function (req, res) {
    // const student = await Student.find({isActive:true});
    // res.status(200).json({"data":student});
    let size = req.body.size || 10;
    let pageNo = req.body.pageNo || 1;
    const query = {};
    query.skip = Number(size * (pageNo - 1));
    query.limit = Number(size) || 0;
    const sort = { _id: -1 };
    if (req.body.firstName) {
      const totalStudent = await Student.count({
        isActive: true,
        firstName: { $regex: req.body.firstName, $options: "i" },
      });
      if (totalStudent > 0) {
        const student = await Student.find({
          isActive: true,
          firstName: { $regex: req.body.firstName, $options: "i" },
        })
          .sort(sort)
          .skip(query.skip)
          .limit(query.limit);
        res.status(200).json({ data: student, total: totalStudent });
      } else {
        res.status(200).json({ data: [], total: totalStudent });
      }
    } else {
      const totalStudent = await Student.count({ isActive: true });
      if (totalStudent > 0) {
        const student = await Student.find({ isActive: true })
          .sort(sort)
          .skip(query.skip)
          .limit(query.limit);
        res.status(200).json({ data: student, total: totalStudent });
      } else {
        res.status(200).json({ data: [], total: totalStudent });
      }
    }
  },

  getStudentById: async function (req, res) {
    try {
      const { id: stuId } = req.params;

      const student = await Student.findOne({ _id: stuId });

      if (!student) {
        return res.status(404).json({ msg: `No User with Id ${stuId}` });
      }
      res.status(200).json({ Data: student });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },

  changeStudentPasswordById: async function (req, res) {
    try {
      const { studentId, newPassword, oldPassword } = req.body;

      const student = await Student.findById({ _id: studentId });
      if (!student) {
        res.status(404).json({ status: "404", msg: `No User Found` });
        return;
      }
      if (student.password != oldPassword) {
        res
          .status(400)
          .json({ status: "400", msg: `Old password does not match` });
        return;
      }
      // update password
      student.password = newPassword;
      //update database
      await student.save();

      res
        .status(200)
        .json({ status: "200", msg: `Password Changed Successfully` });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },

  deleteStudentById: async function (req, res) {
    try {
      const user = await Student.findOneAndUpdate(
        { _id: req.body._id },
        req.body
      );
      res.status(200).json({ status: "ok", msg: `User Deleted Successfully` });
    } catch (err) {
      res.status(500).json({ msg: err });
    }
  },

  setAccessPran: async function (req, res) {
    try {
      const student = await Student.findOne({ _id: req.body.studentId });
      if (student.course) {
        if (student.course.length > 0) {
          coursebody = [...student.course, "644f9dfc499ffcfb45df35cd"];
        } else {
          coursebody = ["644f9dfc499ffcfb45df35cd"];
        }
      } else {
        coursebody = ["644f9dfc499ffcfb45df35cd"];
      }
      let uniqueArray = coursebody.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });

      let val = {};
      val.course = uniqueArray;
      const up = await Student.findOneAndUpdate(
        { _id: req.body.studentId },
        val
      );
      sendRegistrationEmail(req.body.studentId);
      res.status(200).json({ status: "ok" });
    } catch (err) {
      res.status(404).json({ status: "error", msg: "Internal server" });
    }
  },

  setAccessFoundation: async function (req, res) {
    try {
      const student = await Student.findOne({ _id: req.body.studentId });
      if (student.course) {
        if (student.course.length > 0) {
          coursebody = [...student.course, "63c4de4a2bce43a907211c74"];
        } else {
          coursebody = ["63c4de4a2bce43a907211c74"];
        }
      } else {
        coursebody = ["63c4de4a2bce43a907211c74"];
      }
      let uniqueArray = coursebody.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });

      let val = {};
      val.course = uniqueArray;
      const up = await Student.findOneAndUpdate(
        { _id: req.body.studentId },
        val
      );
      sendRegistrationEmailV3(req.body.studentId);
      res.status(200).json({ status: "ok" });
    } catch (err) {
      res.status(404).json({ status: "error", msg: "Internal server" });
    }
  },

  setAccessBreath: async function (req, res) {
    try {
      const student = await Student.findOne({ _id: req.body.studentId });
      if (student.course) {
        if (student.course.length > 0) {
          coursebody = [...student.course, "63c3f26c461e531f3c3452e1"];
        } else {
          coursebody = ["63c3f26c461e531f3c3452e1"];
        }
      } else {
        coursebody = ["63c3f26c461e531f3c3452e1"];
      }
      let uniqueArray = coursebody.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });

      let val = {};
      val.course = uniqueArray;
      const up = await Student.findOneAndUpdate(
        { _id: req.body.studentId },
        val
      );
      sendRegistrationEmailV4(req.body.studentId);
      res.status(200).json({ status: "ok" });
    } catch (err) {
      res.status(404).json({ status: "error", msg: "Internal server" });
    }
  },
  pranaPageRegister: async function (req, res) {
    const checkUser = await Student.countDocuments({
      isActive: true,
      email: req.body.email,
    });
    const user = await Student.findOne({
      isActive: true,
      email: req.body.email,
    });
    let pass = Math.random().toString(36).slice(2);

    try {
      //   if (checkUser > 0) {
      //       await Student.findOneAndUpdate(
      //           { _id: user._id },
      //           { source: "PranaArabha-Landing-page" }
      //         );
      //         let checkCourse = await Student.countDocuments({_id:user._id,course:{$in:"644f9dfc499ffcfb45df35cd"}});

      //         if(checkCourse > 0){
      //             res.status(200).json({ status: "error",msg:"Already Purchased!!"});
      //         }
      //         else{
      //         sendRegistrationEmailV2(user._id);
      //         res.status(200).json({ status: "ok",stuId:user._id });
      //     }
      //   } else {
      let bg = {
        firstName: req.body.name,
        email: req.body.email.toLowerCase(),
        phoneNumber: req.body.phoneNumber,
        source: "PranaArabha-Landing-page",
        city: req.body.city,
        isActive: true,
        password: pass,
      };
      const student = await Student.create(bg);
      //sendRegistrationEmailV2(student._id);
      res.status(200).json({ status: "ok", stuId: student._id });
      //}
    } catch (err) {
      res.status(404).json({ status: "error", msg: "Internal server" });
    }
  },
  getAllSwaraSadhanaData: async function (req, res) {
    try {
      const result = await studentService.getAllSwaraSadhanaData(req.body);
      res
        .status(200)
        .json({ data: result.studentList, total: result.totalData });
    } catch (err) {
      res.status(404).json({ status: "error", msg: err.message });
    }
  },
  getCourseVideosById: async function (req, res) {
    try {
      const result = await studentService.getCourseVideosById(req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ err });
    }
  },
  getTabVideo: async function (req, res) {
    try {
      const result = await studentService.getTabVideo(req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ err });
    }
  },
  getAllPranicPurificationStudent: async function (req, res) {
    try {
      const result = await studentService.getAllPranicPurificationStudent(
        req.body
      );
      res
        .status(200)
        .json({ data: result.studentList, total: result.studentTotal });
    } catch (err) {
      res.status(404).json({ status: "error", msg: err.message });
    }
  },
  get200ttcData: async function (req, res) {
    try {
      const result = await studentService.get200ttcData(req.body);
      res
        .status(200)
        .json({ data: result.studentList, total: result.studentTotal });
    } catch (err) {
      res.status(404).json({ status: "error", msg: err.message });
    }
  },
};
let sendRegistrationEmail = async function (id) {
  const student = await Student.findOne({ _id: id });
  let course = await courseModel.findOne({ _id: "644f9dfc499ffcfb45df35cd" });
  let mailOptions;
  const filePath = path.join(__dirname, "/emailTemplate/prana.html");
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);
  const replacements = {
    name: student.firstName,
    password: student.password,
    email: student.email,
    courseTitle: course.coursetitle,
  };
  const htmlToSend = template(replacements);
  mailOptions = {
    from: "Yoga Vidya School info@yogavidyaschool.com",
    // to: "ayushr418@gmail.com",
    to: student.email,
    subject: `${course.coursetitle}`,
    // text: body,
    replyTo: "Info@yogavidyaschool.com",
    html: htmlToSend,
  };

  transporter.sendMail(mailOptions, async (err, result) => {
    if (err) {
      // res.status(400).json('Opps error occured')
    } else {
      // const blog = await feedbackModel.create(req.body);
      //res.status(200).json({'status':"ok","msg":"Feedback has been sent!"});
    }
  });
};

let sendRegistrationEmailV3 = async function (id) {
  const student = await Student.findOne({ _id: id });
  let course = await courseModel.findOne({ _id: "63c4de4a2bce43a907211c74" });
  // const student = await Student.findOne({_id:id});
  //    console.log(student.courseId,'----------------------------',course);
  // let courseTitleArray = []
  // for(let data of course){
  //     courseTitleArray.push(data.coursetitle);
  // }
  // let courseTitle = courseTitleArray.join();
  // return
  let mailOptions;

  // let student = await studentModel.findOne({_id:req.body.studentId});
  const filePath = path.join(__dirname, "/emailTemplate/prana.html");
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);
  const replacements = {
    name: student.firstName,
    password: student.password,
    email: student.email,
    courseTitle: course.coursetitle,
    // "question3":req.body.question3,
  };
  const htmlToSend = template(replacements);

  mailOptions = {
    from: "Yoga Vidya School info@yogavidyaschool.com",
    // to: "ayushr418@gmail.com",
    to: student.email,
    subject: `${course.coursetitle}`,
    // text: body,
    replyTo: "Info@yogavidyaschool.com",
    html: htmlToSend,
  };

  transporter.sendMail(mailOptions, async (err, result) => {
    if (err) {
      // res.status(400).json('Opps error occured')
    } else {
      // const blog = await feedbackModel.create(req.body);
      //res.status(200).json({'status':"ok","msg":"Feedback has been sent!"});
    }
  });
};

let sendRegistrationEmailV4 = async function (id) {
  const student = await Student.findOne({ _id: id });
  let course = await courseModel.findOne({ _id: "63c3f26c461e531f3c3452e1" });
  // const student = await Student.findOne({_id:id});
  //    console.log(student.courseId,'----------------------------',course);
  // let courseTitleArray = []
  // for(let data of course){
  //     courseTitleArray.push(data.coursetitle);
  // }
  // let courseTitle = courseTitleArray.join();
  // return
  let mailOptions;

  // let student = await studentModel.findOne({_id:req.body.studentId});
  const filePath = path.join(__dirname, "/emailTemplate/prana.html");
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);
  const replacements = {
    name: student.firstName,
    password: student.password,
    email: student.email,
    courseTitle: course.coursetitle,
    // "question3":req.body.question3,
  };
  const htmlToSend = template(replacements);

  mailOptions = {
    from: "Yoga Vidya School info@yogavidyaschool.com",
    // to: "ayushr418@gmail.com",
    to: student.email,
    subject: `${course.coursetitle}`,
    // text: body,
    replyTo: "Info@yogavidyaschool.com",
    html: htmlToSend,
  };

  transporter.sendMail(mailOptions, async (err, result) => {
    if (err) {
      // res.status(400).json('Opps error occured')
    } else {
      // const blog = await feedbackModel.create(req.body);
      //res.status(200).json({'status':"ok","msg":"Feedback has been sent!"});
    }
  });
};

let sendRegistrationEmailV5 = async function (id) {
  const student = await Student.findOne({ _id: id });
  let course = await courseModel.findOne({ _id: "63c3f26c461e531f3c3452e1" });
  // const student = await Student.findOne({_id:id});
  //    console.log(student.courseId,'----------------------------',course);
  // let courseTitleArray = []
  // for(let data of course){
  //     courseTitleArray.push(data.coursetitle);
  // }
  // let courseTitle = courseTitleArray.join();
  // return
  let mailOptions;

  // let student = await studentModel.findOne({_id:req.body.studentId});
  const filePath = path.join(__dirname, "/emailTemplate/prana.html");
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);
  const replacements = {
    name: student.firstName,
    password: student.password,
    email: student.email,
    courseTitle: course.coursetitle,
    // "question3":req.body.question3,
  };
  const htmlToSend = template(replacements);

  mailOptions = {
    from: "Yoga Vidya School info@yogavidyaschool.com",
    // to: "ayushr418@gmail.com",
    to: student.email,
    subject: `${course.coursetitle}`,
    // text: body,
    replyTo: "Info@yogavidyaschool.com",
    html: htmlToSend,
  };

  transporter.sendMail(mailOptions, async (err, result) => {
    if (err) {
      // res.status(400).json('Opps error occured')
    } else {
      // const blog = await feedbackModel.create(req.body);
      // res.status(200).json({'status':"ok","msg":"Feedback has been sent!"});
      // return "sent";
    }
  });
};

let sendRegistrationEmailV2 = async function (id) {
  const student = await Student.findOne({ _id: id });
  let mailOptions;

  // let student = await studentModel.findOne({_id:req.body.studentId});
  const filePath = path.join(__dirname, "/emailTemplate/signupV2.html");
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);
  const replacements = {
    name: student.firstName,
    password: student.password,
    email: student.email,
  };
  const htmlToSend = template(replacements);

  mailOptions = {
    from: "Yoga Vidya School info@yogavidyaschool.com",
    to: student.email,
    subject: `Registration Mail`,
    // text: body,
    replyTo: "Info@yogavidyaschool.com",
    html: htmlToSend,
  };

  transporter.sendMail(mailOptions, async (err, result) => {
    if (err) {
      // res.status(400).json('Opps error occured')
    } else {
      // const blog = await feedbackModel.create(req.body);
      //res.status(200).json({'status':"ok","msg":"Feedback has been sent!"});
    }
  });
};

//helpers

function mergeArrays(results, result, students) {
  const uniqueMap = new Map();

  function addToMap(array) {
    for (const item of array) {
      const id = item.studentDetails?._id || item._id; // Handle nested structure
      if (!uniqueMap.has(id)) {
        uniqueMap.set(id, item);
      }
    }
  }

  // Priority order: results → result → students
  addToMap(results);
  addToMap(result);
  addToMap(students);

  return Array.from(uniqueMap.values());
}
