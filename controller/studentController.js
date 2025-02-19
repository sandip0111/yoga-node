const Student = require('../models/StudentModel');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars')
const transporter = require('../helpers/nodemail');
const mongoose = require('mongoose');
const courseModel = require('../models/courseModel');
const paymentModel = require('../models/paymentModel');
const onlinePaymentModel = require('../models/onlinePaymentModel');
const liveCoursesCustomerModel = require('../models/liveCoursesCustomerModel');
module.exports ={
    createUpdateStudent: async function (req, res) {
        {
            
            try{
                
                if(req.body._id){
                    const student = await Student.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`Student updated Successfully`});
                    // sendRegistrationEmail(req.body._id);
                }else{
                    const studentchek = await Student.countDocuments({isActive:true,email:req.body.email});
                    const studentData = await Student.findOne({isActive:true,email:req.body.email});
                    if(studentchek > 0){
                        res.status(200).json({status:"error", msg:"email already registered",studentId:studentData._id,studentEmail:studentData.email});
                    }
                    else{
                         req.body.email = req.body.email.toLowerCase();
                        const student = await Student.create(req.body);
                        res.status(201).json({status:"ok", msg:"Student Registerd Success",studentId:student._id});
                        if(req.body.source == "web"){
                            //sendRegistrationEmailV2(student._id);
                        }
                        else if(req.body.source == "admin"){
                            // sendRegistrationEmail(student._id);
                        }
                            
                    }       
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
    
            
        }
    },

    getAllParayanamStudent: async function (req, res) {
        try {
            let courseId = '644f9dfc499ffcfb45df35cd';
            let size = req.body.size || 10;
            let pageNo = req.body.pageNo || 1;           
            const skip = Number(size * (pageNo - 1));
            const limit = Number(size) || 0; 

            const studentList = await Student.aggregate([
                // Filter students who have the specified courseId in the course array
                { $match: { course: courseId } },
                { $sort: { created: -1 } },
                // Left Join with Payments (Match studentId)
                {
                    $lookup: {
                        from: "payments",
                        localField: "_id",
                        foreignField: "studentId",
                        as: "paymentDetails",
                    },
                },
    
                // Left Join with Online Payments (Match email)
                {
                    $lookup: {
                        from: "onlinepayments",
                        localField: "email",
                        foreignField: "email",
                        as: "onlinePayments",
                    },
                },
                {
                    $set: {
                        latestOnlinePayment: {
                            $arrayElemAt: [
                                { $filter: { input: "$onlinePayments", as: "payment", cond: {} } },
                                0
                            ]
                        }
                    }
                },
                {
                    $project: {
                        onlinePayments: 0, 
                    },
                },
                { $skip: skip }, 
                { $limit: limit },
            ]);
            res.status(200).json({data:studentList,total:studentList.length});
          
          } catch (err) {
            res.status(500).json({error:err});
          } 
    },

    getAllLiveClassStudent: async function (req, res) {
        try {
            let size = req.body.size || 10;
            let pageNo = req.body.pageNo || 1;           
            const skip = Number(size * (pageNo - 1));
            const limit = Number(size) || 0; 
            const studentList = await liveCoursesCustomerModel.aggregate([
                // Unwind the courses array to treat each course as a separate document
                { $unwind: "$courses" },
    
                // Group by courses.title and keep all customer details
                {
                    $group: {
                        _id: "$courses.title",
                        totalCustomers: { $sum: 1 }, // Count customers per course
                        customers: {
                            $push: {
                                _id: "$_id",
                                name: "$name",
                                email: "$email",
                                phone: "$phone",
                                currency: "$currency",
                                price: "$price",
                                paymentStatus: "$paymentStatus",
                                created: "$created",
                                courses: {
                                    _id: "$courses._id",
                                    title: "$courses.title",
                                    shortDescription: "$courses.shortDescription",
                                    priceINR: "$courses.priceINR",
                                    priceUSD: "$courses.priceUSD",
                                    quantity: "$courses.quantity",
                                    priceInfo: "$courses.priceInfo"
                                }
                            }
                        }
                    }
                },
    
                // Sort by totalCustomers in descending order
                { $sort: { totalCustomers: -1 } },
    
                // Pagination: Skip and Limit
                { $skip: skip },
                { $limit: limit }
            ]);
           
            res.status(200).json({data:studentList,total:studentList.length});
          
          } catch (err) {
            res.status(500).json({error:err});
          } 
    },

    getKundaliniParichayRefferalCode: async function (req, res) {
        try {
            let code = 'swarayoga@prashantji';
            res.status(200).json({data:code});        
        }
        catch(ex){
            res.status(500).json({error:err});
        }
    },

    getAllStudent: async function (req, res) {
        // const student = await Student.find({isActive:true});
        // res.status(200).json({"data":student});
        let size = req.body.size || 10;
        let pageNo = req.body.pageNo || 1; 
        const query={};
        query.skip = Number(size * (pageNo - 1));
        query.limit = Number(size) || 0;
        const sort = { _id: -1 };
        if(req.body.firstName){
            const totalStudent = await Student.count({isActive:true,firstName: { $regex: req.body.firstName,$options: "i" } });
            if(totalStudent>0){
                const student = await Student.find({isActive:true,firstName: { $regex: req.body.firstName, $options: "i"} }).sort(sort).skip(query.skip).limit(query.limit);
                res.status(200).json({data:student,total:totalStudent});
            }else{
                res.status(200).json({data:[],total:totalStudent}); 
            }
        }
        else{
            const totalStudent = await Student.count({isActive:true});
            if(totalStudent>0){
                const student = await Student.find({isActive:true}).sort(sort).skip(query.skip).limit(query.limit);
                res.status(200).json({data:student,total:totalStudent});
            }else{
                res.status(200).json({data:[],total:totalStudent}); 
            }
        }

    },

    getStudentById: async function (req, res) {
        try{
            const {id:stuId} = req.params;
    
            const student = await Student.findOne({_id:stuId});
    
            if(!student){
              return res.status(404).json({msg:`No User with Id ${stuId}`});
            }
            res.status(200).json({"Data":student});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },

    changeStudentPasswordById: async function (req, res) {
        try{
            const { studentId, newPassword, oldPassword } = req.body;           
    
            const student = await Student.findById({_id:studentId});
            if (!student) {
                res.status(404).json({status:"404",msg:`No User Found`});
                return;
            }
            if (student.password != oldPassword) {
                res.status(400).json({status:"400",msg:`Old password does not match`});
                return;
            }
            // update password
            student.password = newPassword;
            //update database
            await student.save();

            res.status(200).json({status:"200", msg:`Password Changed Successfully`});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },

    deleteStudentById: async function (req, res) {
        try{
            const user = await Student.findOneAndUpdate({_id:req.body._id},req.body);
            res.status(200).json({status:"ok",msg:`User Deleted Successfully`});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },

    setAccessPran:async function(req, res){

        try{
            const student = await Student.findOne({_id:req.body.studentId});
            if(student.course){
                if(student.course.length > 0){
                    coursebody = [...student.course,"644f9dfc499ffcfb45df35cd"];
                   }
                   else{
                    coursebody = ["644f9dfc499ffcfb45df35cd"];
                   } 
            }
            else{
                coursebody = ["644f9dfc499ffcfb45df35cd"];
            }
            let uniqueArray = coursebody.filter((value, index, self) => {
                return self.indexOf(value) === index;
              });
    
               let val = {}
              val.course = uniqueArray;
           const up = await Student.findOneAndUpdate({_id:req.body.studentId},val);
           sendRegistrationEmail(req.body.studentId);
           res.status(200).json({status: 'ok'});
        }
        catch(err){
            res.status(404).json({status: 'error',msg:"Internal server"});
        }

    },
    
    setAccessFoundation:async function(req, res){

        try{
            const student = await Student.findOne({_id:req.body.studentId});
            if(student.course){
                if(student.course.length > 0){
                    coursebody = [...student.course,"63c4de4a2bce43a907211c74"];
                   }
                   else{
                    coursebody = ["63c4de4a2bce43a907211c74"];
                   } 
            }
            else{
                coursebody = ["63c4de4a2bce43a907211c74"];
            }
            let uniqueArray = coursebody.filter((value, index, self) => {
                return self.indexOf(value) === index;
              });
    
               let val = {}
              val.course = uniqueArray;
           const up = await Student.findOneAndUpdate({_id:req.body.studentId},val);
           sendRegistrationEmailV3(req.body.studentId);
           res.status(200).json({status: 'ok'});
        }
        catch(err){
            res.status(404).json({status: 'error',msg:"Internal server"});
        }

    },

    setAccessBreath:async function(req, res){

        try{
            const student = await Student.findOne({_id:req.body.studentId});
            if(student.course){
                if(student.course.length > 0){
                    coursebody = [...student.course,"63c3f26c461e531f3c3452e1"];
                   }
                   else{
                    coursebody = ["63c3f26c461e531f3c3452e1"];
                   } 
            }
            else{
                coursebody = ["63c3f26c461e531f3c3452e1"];
            }
            let uniqueArray = coursebody.filter((value, index, self) => {
                return self.indexOf(value) === index;
              });
    
               let val = {}
              val.course = uniqueArray;
           const up = await Student.findOneAndUpdate({_id:req.body.studentId},val);
           sendRegistrationEmailV4(req.body.studentId);
           res.status(200).json({status: 'ok'});
        }
        catch(err){
            res.status(404).json({status: 'error',msg:"Internal server"});
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
          if (checkUser > 0) {
              await Student.findOneAndUpdate(
                  { _id: user._id },
                  { source: "PranaArabha-Landing-page" }
                );
                let checkCourse = await Student.countDocuments({_id:user._id,course:{$in:"644f9dfc499ffcfb45df35cd"}});
                
                if(checkCourse > 0){
                    res.status(200).json({ status: "error",msg:"Already Purchased!!"});
                }
                else{
                sendRegistrationEmailV2(user._id);
                res.status(200).json({ status: "ok",stuId:user._id });
            }
          } else {
            let bg = {
              firstName: req.body.name,
              email: req.body.email.toLowerCase(),
              phoneNumber: req.body.phoneNumber,
              source: "PranaArabha-Landing-page",
              city:req.body.city,
              password: pass,
            };
            const student = await Student.create(bg);
            sendRegistrationEmailV2(student._id);
            res.status(200).json({ status: "ok", stuId:student._id });
          }
        } catch (err) {
          res.status(404).json({ status: "error", msg: "Internal server" });
        }
      }
    // sendBulkEmail: async function(req, res){

    //     try{
    //         const getStudentWithEmailSent = await Student.find({sentEmail:"unsent",created: {$gte:new Date('2023-07-30T00:00:00Z'),$lte:new Date('2023-07-30T23:59:59Z')}}).limit(5);
    //         if(getStudentWithEmailSent.length > 0){
    //                 for (const st of getStudentWithEmailSent) {

    //                        const getresponse = await sendRegistrationEmailV5(st._id);
    //                         const y = await Student.findOneAndUpdate({_id:st._id},{sentEmail:"sent"});

    //         }

    //         res.status(200).json("emailed");
              
    //         }
    //         else{
    //             res.status(200).json("No More Studennt Left");
    //         }

    //     }
    //     catch(err){
    //         res.status(404).json({status: 'error',msg:"Internal server"});
    //     }


    // }

}
let sendRegistrationEmail = async function (id) {
    
    const student = await Student.findOne({_id:id});
    let course = await courseModel.findOne({_id:"644f9dfc499ffcfb45df35cd"});
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
    const filePath = path.join(__dirname, '/emailTemplate/prana.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const replacements = {
       
        "name":student.firstName,
        "password":student.password,
        "email":student.email,
        "courseTitle":course.coursetitle,
        // "question3":req.body.question3,
    };
    const htmlToSend = template(replacements);

    mailOptions = {
        from: "Yoga Vidya School info@yogavidyaschool.com",
        // to: "ayushr418@gmail.com",
        to: student.email,
        subject: `${course.coursetitle}`,
        // text: body,
        replyTo: 'Info@yogavidyaschool.com',
        html: htmlToSend
    }

    transporter.sendMail(mailOptions, async (err, result) => {
        if (err) {
           // res.status(400).json('Opps error occured')
        } else {
            // const blog = await feedbackModel.create(req.body);
            //res.status(200).json({'status':"ok","msg":"Feedback has been sent!"});
        }
    })
  }

  let sendRegistrationEmailV3 = async function (id) {
    
    const student = await Student.findOne({_id:id});
    let course = await courseModel.findOne({_id:"63c4de4a2bce43a907211c74"});
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
    const filePath = path.join(__dirname, '/emailTemplate/prana.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const replacements = {
       
        "name":student.firstName,
        "password":student.password,
        "email":student.email,
        "courseTitle":course.coursetitle,
        // "question3":req.body.question3,
    };
    const htmlToSend = template(replacements);

    mailOptions = {
        from: "Yoga Vidya School info@yogavidyaschool.com",
        // to: "ayushr418@gmail.com",
        to: student.email,
        subject: `${course.coursetitle}`,
        // text: body,
        replyTo: 'Info@yogavidyaschool.com',
        html: htmlToSend
    }

    transporter.sendMail(mailOptions, async (err, result) => {
        if (err) {
           // res.status(400).json('Opps error occured')
        } else {
            // const blog = await feedbackModel.create(req.body);
            //res.status(200).json({'status':"ok","msg":"Feedback has been sent!"});
        }
    })
  }

  let sendRegistrationEmailV4 = async function (id) {
    
    const student = await Student.findOne({_id:id});
    let course = await courseModel.findOne({_id:"63c3f26c461e531f3c3452e1"});
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
    const filePath = path.join(__dirname, '/emailTemplate/prana.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const replacements = {
       
        "name":student.firstName,
        "password":student.password,
        "email":student.email,
        "courseTitle":course.coursetitle,
        // "question3":req.body.question3,
    };
    const htmlToSend = template(replacements);

    mailOptions = {
        from: "Yoga Vidya School info@yogavidyaschool.com",
        // to: "ayushr418@gmail.com",
        to: student.email,
        subject: `${course.coursetitle}`,
        // text: body,
        replyTo: 'Info@yogavidyaschool.com',
        html: htmlToSend
    }

    transporter.sendMail(mailOptions, async (err, result) => {
        if (err) {
           // res.status(400).json('Opps error occured')
        } else {
            // const blog = await feedbackModel.create(req.body);
            //res.status(200).json({'status':"ok","msg":"Feedback has been sent!"});
        }
    })
  }

  let sendRegistrationEmailV5 = async function (id) {
    
    const student = await Student.findOne({_id:id});
    let course = await courseModel.findOne({_id:"63c3f26c461e531f3c3452e1"});
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
    const filePath = path.join(__dirname, '/emailTemplate/prana.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const replacements = {
       
        "name":student.firstName,
        "password":student.password,
        "email":student.email,
        "courseTitle":course.coursetitle,
        // "question3":req.body.question3,
    };
    const htmlToSend = template(replacements);

    mailOptions = {
        from: "Yoga Vidya School info@yogavidyaschool.com",
        // to: "ayushr418@gmail.com",
        to: student.email,
        subject: `${course.coursetitle}`,
        // text: body,
        replyTo: 'Info@yogavidyaschool.com',
        html: htmlToSend
    }

    transporter.sendMail(mailOptions, async (err, result) => {
        if (err) {
           // res.status(400).json('Opps error occured')
        } else {
            // const blog = await feedbackModel.create(req.body);
            // res.status(200).json({'status':"ok","msg":"Feedback has been sent!"});
            // return "sent";
        }
    })
  }

  let sendRegistrationEmailV2 = async function (id) {
    
    const student = await Student.findOne({_id:id});
    let mailOptions;

    // let student = await studentModel.findOne({_id:req.body.studentId});
    const filePath = path.join(__dirname, '/emailTemplate/signupV2.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const replacements = {
       
        "name":student.firstName,
        "password":student.password,
        "email":student.email,
    };
    const htmlToSend = template(replacements);

    mailOptions = {
        from: "Yoga Vidya School info@yogavidyaschool.com",
        to: student.email,
        subject: `Registration Mail`,
        // text: body,
        replyTo: 'Info@yogavidyaschool.com',
        html: htmlToSend
    }

    transporter.sendMail(mailOptions, async (err, result) => {
        if (err) {
           // res.status(400).json('Opps error occured')
        } else {
            // const blog = await feedbackModel.create(req.body);
            //res.status(200).json({'status':"ok","msg":"Feedback has been sent!"});
        }
    })
  }

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