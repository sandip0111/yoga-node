// const User = require('../models/UserModel');
const mentorModel = require('../models/mentorModel');
const sliderModel = require('../models/sliderModel');
const categoryModel = require('../models/categoryModel');
const inquiryModel = require('../models/inquiryModel');
const courseModel = require('../models/courseModel');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars')
const transporter = require('../helpers/nodemail');


module.exports ={
    // doLogin: async function (req, res) {
    //     {
    //         // console.log(req.body);
    //         try{
    //             const email = req.body.email;
    //             const password = req.body.password;
    
    //             const user = await User.findOne({"email":email,"password":password});

    //             if(user){
    //                 res.json({ 'status':"ok",'user': user, 'msg': 'succesfully logged in' });
    //             }else{
    //                 res.json({ 'msg': 'User not found' });
    //             }
          
    //             // res.json(user);
    
    //         }
    //         catch(err){
    //             res.status(500).json({msg:err});
    //         }
    //     }
    // },
    // createUpdateUser: async function (req, res) {
    //     {
            
    //         try{
    //             if(req.body._id){
    //                 const user = await User.findOneAndUpdate({_id:req.body._id},req.body);
    //                 res.status(200).json({status:"ok",msg:`User updated Successfully`});
    //             }else{
    //                 const user = await User.create(req.body);
    //                 res.status(201).json({status:"ok", msg:"User Registerd Success",userId:user._id});
    //             }
             
    //         }
    //         catch(err) {
    //          res.status(400).json({err});
    //         }
    
            
    //     }
    // },
    createMentor: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const user = await mentorModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`User updated Successfully`});
                }else{
                    const user = await mentorModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"User Registerd Success",userId:user._id});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
    
            
        }
    },

    getAllMentor: async function (req, res) {
        const user = await mentorModel.find({});
        res.status(200).json({user});
    },

    getMentorById: async function (req, res) {
        try{
            const {id:userId} = req.params;
    
            const user = await mentorModel.findOne({_id:userId});
    
            if(!user){
              return res.status(404).json({msg:`No User with Id ${userId}`});
            }
            res.status(200).json({user});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    createslider: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const user = await sliderModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`User updated Successfully`});
                }else{
                    const user = await sliderModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"User Registerd Success",userId:user._id});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
    
            
        }
    },

    getimagesliderById: async function (req, res) {
        try{
            const {id:userId} = req.params;
    
            const user = await sliderModel.findOne({_id:userId});
    
            if(!user){
              return res.status(404).json({msg:`No User with Id ${userId}`});
            }
            res.status(200).json({user});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },

    getSlider: async function (req, res) {
        const user = await  sliderModel.find({});
        res.status(200).json({user});
    },

    createCourse: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const course = await courseModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`Course updated Successfully`});
                }else{
                    const course = await courseModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"Course Registerd Success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
            
        }
    },
    getAllCourse: async function (req, res) {
        const user = await courseModel.find({});
        res.status(200).json({user});
    },
    getCourseById: async function (req, res) {
        console.log(req.params);
        try{
            const {id:cId} = req.params;
    
            const course = await courseModel.findOne({_id:cId});
    
            if(!course){
              return res.status(404).json({msg:`No course with Id ${cId}`});
            }
            res.status(200).json({"data":course});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    getCourseBySlug: async function (req, res) {
        try{
            const cs = req.body.slug;
    
            const course = await courseModel.findOne({slug:cs});
    
            if(!course){
              return res.status(404).json({msg:`No course with Id ${cId}`});
            }
            res.status(200).json({"data":[course]});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    createCategory: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const user = await categoryModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`category updated Successfully`});
                }else{
                    const user = await categoryModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"category Registerd Success",categoryId:user._id});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
    
            
        }
    },
    getAllCategory: async function (req, res) {
        const data = await categoryModel.find({});
        res.status(200).json({data});
    },
    getCategoryById: async function (req, res) {
        try{
            const {id:userId} = req.params;
    
            const user = await categoryModel.findOne({_id:userId});
    
            if(!user){
              return res.status(404).json({msg:`No User with Id ${userId}`});
            }
            res.status(200).json({user});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },

    inquiryEmail:async function (req, res) {
        const { to,message,name,courseName,contactNumber,startDate,courseDate} = req.body;

        let emailBody = `Dear sir, <br /> Following person has applied for a Yoga course. Please find the enquiry details as below <br /><br /><strong>Student\'s Name: </strong>${name}<br/><strong>Student\'s Email Address: </strong>${to}<br/><strong>Student\'s Contact Number: </strong>${contactNumber}<br /><strong>Course Applied For: </strong>${courseName}<br/><strong>Expected Start Date: </strong>${startDate}<br/><strong>Student left following message: </strong><br />${message}<br/>`;
        try {
            if (to) {
                if (to.trim() === "") throw new Error("Invalid recipent email");
            } else throw new Error("Invalid receipt email")
            if (courseName) {
                if (courseName.trim() === "") throw new Error("Kindly enter subject");
            } else throw new Error("Kindly enter subject");
            if (name) {
                if (name.trim() === "") throw new Error("Kindly add name");
            } else throw new Error("Kindly add name");
    
            const filePath = path.join(__dirname, '/emailTemplate/testEmail.html');
            const source = fs.readFileSync(filePath, 'utf-8').toString();
            const template = handlebars.compile(source);
            const replacements = {
                "studentEmail":to,
                "studentName":name,
                "courseName":courseName,
                "contact":contactNumber,
                "startDate":startDate,
                "message":message
            };
            const htmlToSend = template(replacements);
    
            const mailOptions = {
                from: "Info@yogavidyaschool.com",
                to: "Info@yogavidyaschool.com",
                subject: `You have a new course enquiry - ${courseName}`,
                // text: body,
                replyTo: to,
                html: htmlToSend
            }
            const dbBody = {
                "name":name,
                "email":to,
                "contact":contactNumber,
                "course":courseName,
                "message":message,
                "courseDate":courseDate,
            }
            transporter.sendMail(mailOptions, async (err, result) => {
                // console.log(err);
                if (err) {
                    res.status(400).json('Opps error occured')
                } else {
                    const inq = await inquiryModel.create(dbBody);
                    res.status(200).json({'status':"ok","msg":"Enquiry has been sent!"});
                }
            })
        } catch (error) {
            // console.log(error);
            res.status(400).json(error.message)
        }
    }


    
}