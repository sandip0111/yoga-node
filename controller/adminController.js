// const User = require('../models/UserModel');
const mentorModel = require('../models/mentorModel');
const sliderModel = require('../models/sliderModel');
const categoryModel = require('../models/categoryModel');
const inquiryModel = require('../models/inquiryModel');
const courseModel = require('../models/courseModel');
const blogModel = require('../models/blogModel');
const mediaModel = require('../models/mediaModel');
const pageModel = require('../models/PagesModel');
const testimonialModel = require('../models/testimonialModel');
const subcategoryModel = require('../models/subcategoryModel');
const subcoursecategoryModel = require('../models/subcatcourseModel');
const categoryTreeModel = require('../models/categoryTreeModel');
const eventModel = require('../models/eventModel');
const adminModel = require('../models/adminModel');
const studentModel = require('../models/StudentModel');
const feedbackModel = require('../models/feedbackModel');
const accesslogModel = require('../models/accesslogModel');
const paymentModel = require('../models/paymentModel');
const onlinepaymentModel = require('../models/onlinePaymentModel');
const onlineVideoModel= require('../models/onlineVideoModel');
const analyticsModel = require('../models/analyticsModel');
const subscribeModel = require('../models/subscribeModel');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars')
const transporter = require('../helpers/nodemail');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const stripe = require('stripe')('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');
const jwt = require('jsonwebtoken');
// const stripe = require('stripe')('sk_test_51LTjKYSDnZBoIVm7EqcwQWYWStbdS5gufmBl3BLFKAReBHCSJharwcKHURUMEv3gq4oFCuDnDAO59WnKmpMPqi0100n0lg3QtG');

// const nodeCCAvenue = require('node-ccavenue');
// const ccav = new nodeCCAvenue.Configure({
//   merchant_id: '2566832',
//   working_key: 'B3489497A467813AFC801D9273189D24',
// });

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'PK@2023#', {
    expiresIn: maxAge
  });
};

const decodeToken = (token) =>{
   jwt.verify(token,'net ninja secret',(err,decodedToken)=>{
        if(err){
            console.log(err.message);
            let val = {
                status : 'error'
            }
            return val;
        }  
        else{
            let val = {
                status : 'ok' , user:decodeToken
            }
            console.log(decodedToken);
            return val;
        }
     });
}

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
        const user = await mentorModel.find({isActive:true}).sort({sortBy:1});
        res.status(200).json({user});
    },

    getMentorById: async function (req, res) {
        try{
            const {id:userId} = req.params;
    
            const user = await mentorModel.findOne({_id:userId});
    
            if(!user){
              return res.status(404).json({msg:`No Mentor with Id ${userId}`});
            }
            res.status(200).json({data:user});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    getMentorBySlug: async function (req, res) {
        try{
            const {id:userId} = req.params;
    
            const user = await mentorModel.findOne({slug:userId});
    
            if(!user){
              return res.status(404).json({msg:`No Mentor with Id ${userId}`});
            }
            res.status(200).json({data:user});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    createslider: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const user = await sliderModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`slider updated Successfully`});
                }else{
                    const user = await sliderModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"slider inserted Success",userId:user._id});
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
            res.status(200).json({data:user});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },

    getSlider: async function (req, res) {
        const user = await  sliderModel.find({isActive:true});
        res.status(200).json({data:user});
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
        let size = req.body.size || 10;
        let pageNo = req.body.pageNo || 1; 
        const query={};
        query.skip = Number(size * (pageNo - 1));
        query.limit = Number(size) || 0;
        const sort = { _id: -1 };
        const totalCourse = await courseModel.find({isActive:true});
        const course = await courseModel.find({isActive:true}).skip(query.skip).limit(query.limit);
        res.status(200).json({data:course,total:totalCourse.length});
    },
    getAllCourseV2: async function (req, res) {
        try{
            let documentIds = ["63c3f26c461e531f3c3452e1","63c4de4a2bce43a907211c74","63c4e12f2bce43a907211c76","63c4e7e72bce43a907211c78","63c4eea32bce43a907211c7a","644f9dfc499ffcfb45df35cd","63fc3fdc6d203300eae38625"]
            const course = await courseModel.find({isActive:true,_id: { $in: documentIds }},{"_id":1,"coursetitle":1})
            res.status(200).json({data:course});
        }
        catch(err){
            res.status(500).json({msg:'Internal Server error'})
        }

    },
    getAllCourseAdmin: async function (req, res) {
        try{
            const course = await courseModel.find({isActive:true})
            res.status(200).json({data:course});
        }
        catch(err){
            res.status(500).json({msg:'Internal Server error'})
        }

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
              return res.status(200).json({"data":[],msg:`No course with Slug`});
            }
            res.status(200).json({"data":[course]});
    
        } catch(err){
            res.status(500).json({ msg:'Internal Server error' }) 
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
    checkEmail: async function (req, res) {
        // console.log(req.body);
        try{
            const checkUser = await studentModel.countDocuments({ isActive:true, email:req.body.email});
            const user = await studentModel.findOne({ isActive:true, email:req.body.email});

            if(checkUser > 0){
                let check = await studentModel.countDocuments({_id:user._id,course:{$in:req.body.course}});
                res.status(200).json({status:"ok","id":user._id,coursePurchased:check > 0 ? true : false});
            }
            else{
                res.status(200).json({status:"error"});
            }
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    getAllCategoryCreated: async function (req, res) {
        // let categoryData = await categoryModel.find({isActive:true})
        // let data =JSON.parse(JSON.stringify(categoryData));
        // for (let cat of data) {
        //    let SubCatCont =  await subcategoryModel.count({categoryId:cat._id});
         
        //     if(SubCatCont>0){
        //         // console.log(SubCatCont,'find sub categoy count');
        //         cat['subCatData'] = await subcategoryModel.find({categoryId:cat._id});
        //         cat['subCatData'] = JSON.parse(JSON.stringify( cat['subCatData']));
        //         for(let subCat of cat['subCatData']){
        //          const courceCount = await subcoursecategoryModel.count({subcategoryId:subCat._id});
        //          if(courceCount>0){
        //             subCat['subCatData'] = await subcoursecategoryModel.find({subcategoryId:subCat._id});
        //             console.log(subCat['subCatData'],'find cource page details ');
        //          }else{
        //             subCat['subCatData'] = []
        //          }
                 
        //         }
        //     }else{
        //         cat['subCatData'] = []
        //     }
            
            
        // }
        // // console.log(data);
        // let dbCat = {'rootCat':data}
        // const test = await categoryTreeModel.create(dbCat);
        //     res.status(200).json({data});
    },
    getCategoryById: async function (req, res) {
        try{
            const {id:userId} = req.params;
    
            const user = await categoryModel.findOne({_id:userId});
    
            if(!user){
              return res.status(404).json({msg:`No User with Id ${userId}`});
            }
            res.status(200).json({data:user});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },

    inquiryEmail:async function (req, res) {
        const { to,message,name,courseName,contactNumber,startDate,courseDate,type,subject,package} = req.body;
        try {
            if (to) {
                if (to.trim() === "") throw new Error("Invalid recipent email");
            } else throw new Error("Invalid receipt email")
            if (name) {
                if (name.trim() === "") throw new Error("Kindly add name");
            } else throw new Error("Kindly add name");

            let mailOptions;
            let dbBody;
            if(courseName == 'Best Online Yoga Classes'){
                if(startDate != "5.30 AM – 6.30 AM" && startDate != "6.30 AM – 7.30 AM" && startDate != "10:30 AM – 11:30 AM" && startDate != "5.30 PM – 6.30 PM"){
                    res.status(200).json({status:"ok",msg:"Select different time slot"});
                    return
                }
            }

       if(type == 1){

        const filePath = path.join(__dirname, '/emailTemplate/testEmail.html');
        const source = fs.readFileSync(filePath, 'utf-8').toString();
        const template = handlebars.compile(source);
        const replacements = {
            "studentEmail":to,
            "studentName":name,
            "courseName":courseName,
            "contact":contactNumber,
            "startDate":startDate,
            "message":message,
            "package":package
        };
        const htmlToSend = template(replacements);

        mailOptions = {
            from: "Yoga Vidya School info@yogavidyaschool.com",
            to: "info@yogavidyaschool.com",
            subject: `You have a new course enquiry - ${courseName}`,
            // text: body,
            replyTo: to,
            html: htmlToSend
        }
        dbBody = {
            "name":name,
            "email":to,
            "contact":contactNumber,
            "course":courseName,
            "message":message,
            "courseDate":courseDate,
            "type":type,
            "package":package
        }

       }
       else{
        const filePath = path.join(__dirname, '/emailTemplate/testEmailV2.html');
        const source = fs.readFileSync(filePath, 'utf-8').toString();
        const template = handlebars.compile(source);
        const replacements = {
            "studentEmail":to,
            "studentName":name,
            "subject":subject,
            "message":message
        };
        const htmlToSend = template(replacements);

        mailOptions = {
            from: "Yoga Vidya School info@yogavidyaschool.com",
            to: "info@yogavidyaschool.com",
            subject: `You have a new contact enquiry`,
            // text: body,
            replyTo: to,
            html: htmlToSend
        }
         dbBody = {
            "name":name,
            "email":to,
            "subject":subject,
            "message":message,
            "type":type,
        }
       }
           transporter.sendMail(mailOptions, async (err, result) => {
                if (err) {
                    res.status(400).json('Opps error occured')
                } else {
                    const inq = await inquiryModel.create(dbBody);
                    res.status(200).json({'status':"ok","msg":"Enquiry has been sent!"});
                }
            })
        } catch (error) {
            res.status(400).json(error.message)
        }
    },
    createBlog: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    req.body.authorId = mongoose.Types.ObjectId(req.body.authorId);
                    const blog = await blogModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`Blog updated Successfully`});
                }else{
                    req.body.authorId = mongoose.Types.ObjectId(req.body.authorId);
                    const blog = await blogModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"Blog Registerd Success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
            
        }
    },
    getAllBlog: async function (req, res) {
        let size = req.body.size || 10;
        let pageNo = req.body.pageNo || 1; 
        const query={};
        query.skip = Number(size * (pageNo - 1));
        query.limit = Number(size) || 0;
        const sort = { _id: -1 };
        const totalBlog = await blogModel.count({isActive:true});
        if(totalBlog>0){
            const blog = await blogModel.find({isActive:true}).sort(sort).skip(query.skip).limit(query.limit);
            res.status(200).json({data:blog,total:totalBlog});
        }else{
            res.status(200).json({data:[{}],total:totalBlog}); 
        }
       
    },
    getBlogById: async function (req, res) {
        try{
            const {id:userId} = req.params;
    
            const user = await blogModel.findOne({_id:userId});
    
            if(!user){
              return res.status(404).json({msg:`No Blog with Id ${userId}`});
            }
            res.status(200).json({data:user});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    getBlogBySlug: async function (req, res) {
        try{
            const {id:slug} = req.params;
    
            const user = await blogModel.findOne({isActive:true,slug:slug});
    
            if(!user){
              return res.status(200).json({"data":[],msg:`No Blog with Slug`});
            }
            
            res.status(200).json({data:user});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    getAllHomeBlog: async function (req, res) {
        const limit = Number(req.body.limit);
        // const blog = await blogModel.aggregate([{ $match: { isActive: true } },{ $sample: { size: limit } },{ $limit: limit }]);
        const blog = await blogModel.find({ isActive: true }).sort({ _id: -1 }).limit(limit)
        res.status(200).json({data:blog});
    },
    getHomeMentors: async function (req, res) {
        const value = Number(req.body.limit)
        const total = await mentorModel.countDocuments({isActive:true,});
        const mentor = await mentorModel.find({isActive:true, sortBy: { $gte: value, $lte: value + 3 } }).sort({ sortBy: 1 })
        res.status(200).json({data:mentor,total:total});
    }, getMentorsForCoursePage: async function (req, res) {
        const value = Number(req.body.limit)
        const total = await mentorModel.countDocuments({isActive:true,});
        const mentor = await mentorModel.find({isActive:true}).limit(value).sort({ sortBy: 1 })
        res.status(200).json({data:mentor,total:total});
    },
    createMedia: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const blog = await mediaModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`Media updated Successfully`});
                }else{
                    const blog = await mediaModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"Media Upload Success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
            
        }
    },
    getAllMedia: async function (req, res) {
        const blog = await mediaModel.find({isActive:true});
        res.status(200).json({data:blog});
    },
    createPage: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const page = await pageModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`Page updated Successfully`});
                }else{
                    const page = await pageModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"Page Registerd Success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
            
        }
    },
    getAllPages: async function (req, res) {
        const page = await pageModel.find({isActive:true});
        res.status(200).json({data:page});
    },
    getPageById: async function (req, res) {
        try{
            const {id:pageId} = req.params;
    
            const page = await pageModel.findOne({_id:pageId});
    
            if(!page){
              return res.status(404).json({msg:`No Page with Id ${pageId}`});
            }
            res.status(200).json({data:page});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },

    createTestimonial: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const test = await testimonialModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`Testimonial updated Successfully`});
                }else{
                    const test = await testimonialModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"Testimonial Registerd Success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
            
        }
    },
    getAllTestimonial: async function (req, res) {
        const test = await testimonialModel.find({isActive:true});
        res.status(200).json({data:test});
    },
    createSubcategory: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const subcat = await subcategoryModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`subcategory updated Successfully`});
                }else{
                    const subcat = await subcategoryModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"subcategory Registerd Success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
    
            
        }
    },
    getAllSubCategory: async function (req, res) {
        const data = await subcategoryModel.find({isActive:true});
        res.status(200).json({data});
    },
    getAllCatV2: async function (req, res) {
        const data = await categoryModel.find({isActive:true});
        res.status(200).json({data});
    },
    getSubCategoryById: async function (req, res) {
        try{
            const {id:userId} = req.params;
    
            const user = await subcategoryModel.findOne({_id:userId});
    
            if(!user){
              return res.status(404).json({msg:`No subcat with Id ${userId}`});
            }
            res.status(200).json({data:user});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    createSubCoursecategory: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const subcat = await subcoursecategoryModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`subcategory course updated Successfully`});
                }else{
                    const subcat = await subcoursecategoryModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"subcategory course Registerd Success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
    
            
        }
    },
    getAllSubCourseCategory: async function (req, res) {
        const data = await subcoursecategoryModel.find({isActive:true});
        res.status(200).json({data});
    },
    getSubCourseCategoryById: async function (req, res) {
        try{
            const {id:userId} = req.params;
    
            const user = await subcoursecategoryModel.findOne({_id:userId});
    
            if(!user){
              return res.status(404).json({msg:`No subcat course with Id ${userId}`});
            }
            res.status(200).json({data:user});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    getSubCategoryByCatId: async function (req, res) {
        let catId = req.body.catId;
        const data = await subcategoryModel.find({categoryId:catId});
        res.status(200).json({data});
    },
    getSubCourseCategoryBySubCatId: async function (req, res) {
        let subcatId = req.body.subcatId;
        const data = await subcoursecategoryModel.find({subcategoryId:subcatId});
        res.status(200).json({data});
    },
    getCategoryTree: async function (req, res) {
        let data = await categoryTreeModel.findOne({});
        res.status(200).json({data});
    },
    createEvent: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const event = await eventModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`Event updated Successfully`});
                }else{
                    const event = await eventModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"Event Registerd Success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
    
            
        }
    },
    getAllEventsAdmin: async function (req, res) {
        let data = await eventModel.find( {isActive:true} ).sort({ startDate: 1 });
        res.status(200).json({data});
    },
    getAllEvents: async function (req, res) {
        let date = new Date();
        const targetDateFormatted = date.toISOString().split('T')[0];
        let data = await eventModel.find( { startDate:{ $gte: targetDateFormatted }, isActive:true,type:'offline'} ).sort({ startDate: 1 }).limit(4);
        res.status(200).json({data});
    },
    getAllOnlineEvents: async function (req, res) {
        let date = new Date();
        // const targetDateFormatted = date.toISOString().split('T')[0];
        let data = await eventModel.find( {isActive:true,type:'online'} ).limit(4);
        res.status(200).json({data});
    },
    saveContactInquiry: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const contact = await inquiryModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`Updated Successfully`});
                }else{
                    const contact = await inquiryModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"Inserted Success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
            
        }
    },
    createAdmin: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const user = await adminModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`Admin updated Successfully`});
                }else{
                    const user = await adminModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"admin Registerd Success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
    
            
        }
    },
    doLogin: async function(req, res){
        try {
            const email = req.body.email;
            const password = req.body.password;
    
            const user = await adminModel.findOne({ email: email, password: password });          
            if (user) {
            const token = createToken(user._id);
            res.json({ status: "ok",token, msg: "succesfully logged in"});
            } else {
              res.json({ msg: "User not found" });
            }
    
            // res.json(user);
          } catch (err) {
            res.status(500).json({ msg: err });
          }
    },
    loginWeb: async function(req, res){
        try {
            const email = req.body.email.replace(/\s/g, "");
            const password = req.body.password.replace(/\s/g, "");
    
            const user = await studentModel.findOne({ isActive:true, email: email, password: password });
    
            if (user) {
              res.status(200).json({ status: "ok", user: {"id":user._id}, msg: "succesfully logged in" });
            } else {
              res.status(200).json({status: "ok", msg: "User not found" });
            }
    
            // res.json(user);
          } catch (err) {
            res.status(500).json({ msg: err });
          }
    },
    getCourseByIdV2: async function (req, res) {
        try{
            const {id:stuId} = req.params;
    
            const course = await courseModel.findOne({_id:stuId});
    
            if(!course){
              return res.status(200).json({msg:`No course with Id ${stuId}`});
            }
            res.status(200).json({course});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    getValidation: async function (req, res) {
        // console.log(req.body);
        try{
            const id = req.body.userId;
    
            const checkUser = await studentModel.countDocuments({ course:id});

            if(checkUser > 0){
                res.status(200).json({status:"ok"});
            }
            else{
                res.status(200).json({status:"error"});

            }
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },

    createFeedback: async function (req, res) {
        {
            
            // try{
                if(req.body._id){
                    const blog = await feedbackModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`feedback updated Successfully`});
                }else{
                    let mailOptions;
                    let course = await courseModel.findOne({_id:req.body.courseId});
                    let student = await studentModel.findOne({_id:req.body.studentId});
                    let replacements = {};
                    let template;
                    if(course.coursetitle == "Breath Detox Course Online"){
                        const filePath = path.join(__dirname, '/emailTemplate/breathDetox.html');
                        const source = fs.readFileSync(filePath, 'utf-8').toString();
                        template = handlebars.compile(source);
                        replacements = {
                            "course":course.coursetitle,
                            "student":student.firstName,
                            "questionList":req.body.questionList,
                            "answerList":req.body.answerList,
                            "video":req.body.videoReview,
                            "day":req.body.day
                        };
                    }
                    else{
                        const filePath = path.join(__dirname, '/emailTemplate/feedbackMail.html');
                        const source = fs.readFileSync(filePath, 'utf-8').toString();
                        template = handlebars.compile(source);
                        replacements = {
                            "course":course.coursetitle,
                            "student":student.firstName,
                            "question1":req.body.question1,
                            "question2":req.body.question2,
                            "question3":req.body.question3,
                            "video":req.body.videoReview,
                            "day":req.body.day
                        };
                    }
                    // const filePath = path.join(__dirname, '/emailTemplate/feedbackMail.html');
                    // const source = fs.readFileSync(filePath, 'utf-8').toString();
                    // const template = handlebars.compile(source);
                    // const replacements = {
                    //     "course":course.coursetitle,
                    //     "student":student.firstName,
                    //     "question1":req.body.question1,
                    //     "question2":req.body.question2,
                    //     "question3":req.body.question3,
                    // };
                    const htmlToSend = template(replacements);
            
                    mailOptions = {
                        from: "Yoga Vidya School info@yogavidyaschool.com",
                        to: "info@yogavidyaschool.com",
                        subject: `You have a course Feedback - ${course.coursetitle} Day - ${req.body.day}`,
                        // text: body,
                        replyTo: student.email,
                        html: htmlToSend
                    }

                    transporter.sendMail(mailOptions, async (err, result) => {
                        if (err) {
                            res.status(400).json('Opps error occured')
                        } else {
                            const blog = await feedbackModel.create(req.body);
                            res.status(200).json({'status':"ok","msg":"Feedback has been sent!"});
                        }
                    })
                }
             
            // }
            // catch(err) {
            //  res.status(400).json({err});
            // }
            
        }
    },
    getFeedbackByCourse: async function (req, res) {
        try{  
            const feedback = await feedbackModel.countDocuments({courseId:req.body.courseId,studentId:req.body.studentId,day:req.body.day});
            if(feedback > 0){
                // const feedbackdata = await feedbackModel.findOne({hashed_id:req.body.hash,studentId:req.body.studentId});
                res.status(200).json({count:1});
            }
            else{
                res.status(200).json({count:0});
            }
    

        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    createAccessLog: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const user = await accesslogModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`success`});
                }else{
                    const user = await accesslogModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
    
            
        }
    },
    getAccessLog: async function (req, res) {
        try{  
            const access = await accesslogModel.countDocuments({courseId:req.body.courseId,studentId:req.body.studentId});
            const accesslog = await accesslogModel.findOne({courseId:req.body.courseId,studentId:req.body.studentId});
            if(access > 0){
                 res.status(200).json({count:1,data:accesslog});
            }
            else{
                res.status(200).json({count:0});
            }
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    getcheckCourseStudent: async function (req, res) {
        // console.log(req.body);
        let check = await studentModel.countDocuments({_id:req.body.student,course:{$in:req.body.course}});
        // console.log(check);
    if(check > 0){
        res.status(200).json({count:1});
    }
    else{
        res.status(200).json({count:0});
     }
    },

    getAllVideoReviews: async function (req, res) {
        let size = req.body.size || 10;
        let pageNo = req.body.pageNo || 1; 
        const query={};
        query.skip = Number(size * (pageNo - 1));
        query.limit = Number(size) || 0;
        const sort = { _id: -1 };
        const totalFeedback = await feedbackModel.countDocuments({day:"5",videoReview:{$exists:true,$ne:''}});

        const feedback = await feedbackModel.aggregate([
            {
                $match: {day:"5",videoReview:{$exists:true,$ne:''}}
            },
            {
                $lookup: {
                    from: 'courses',
                    let: { localFieldId: '$courseId' },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ['$_id', { $toObjectId: '$$localFieldId' }] }
                        }
                      },
                      {
                        $project: {
                          coursetitle: 1,
                        }
                      }
                    ],
                    as: 'courseData'
                  }
              },
              {
                $lookup: {
                    from: 'students',
                    let: { localFieldId: '$studentId' },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ['$_id', { $toObjectId: '$$localFieldId' }] }
                        }
                      },
                      {
                        $project: {
                          firstName: 1,
                        }
                      }
                    ],
                    as: 'studentData'
                  }
              },
              {
                $skip: query.skip // Number of documents to skip
              },
              {
                $limit: query.limit // Number of documents to limit
              }
        ])
        // const feedback = await feedbackModel.find({day:5,videoReview:{$exists:true,$ne:''}}).skip(query.skip).limit(query.limit);
        res.status(200).json({data:feedback,total:totalFeedback});
    },

    getAllInquiry: async function (req, res) {
        let size = req.body.size || 10;
        let pageNo = req.body.pageNo || 1; 
        const query={};
        query.skip = Number(size * (pageNo - 1));
        query.limit = Number(size) || 0;
        const sort = { _id: -1 };
        const totalCourse = await inquiryModel.countDocuments({isActive:true});
        const course = await inquiryModel.find({isActive:true}).sort(sort).skip(query.skip).limit(query.limit);
        res.status(200).json({data:course,total:totalCourse});
    },
    getAllPayment: async function (req, res) {
        let size = req.body.size || 10;
        let pageNo = req.body.pageNo || 1; 
        const query={};
        query.skip = Number(size * (pageNo - 1));
        query.limit = Number(size) || 0;
        const sort = { _id: -1 };
        const totalPayment = await paymentModel.countDocuments({paymentStatus:"paid"});
        const payment = await paymentModel.find({paymentStatus:"paid"}).populate({path:"studentId",select:"firstName"}).populate({path:"courseId",select:"coursetitle"}).sort(sort).skip(query.skip).limit(query.limit);
        res.status(200).json({data:payment,total:totalPayment});
    },
    getAllOnlinePayment: async function (req, res) {
        let size = req.body.size || 10;
        let pageNo = req.body.pageNo || 1; 
        const query={};
        query.skip = Number(size * (pageNo - 1));
        query.limit = Number(size) || 0;
        const sort = { _id: -1 };
        const totalPayment = await onlinepaymentModel.countDocuments({});
        const payment = await onlinepaymentModel.find({}).sort(sort).skip(query.skip).limit(query.limit);
        res.status(200).json({data:payment,total:totalPayment});
    },
      exportInquiry: async function(req, res) {
        let data = [];
          let inquiry = await inquiryModel.find({});
          for (const ap of inquiry) {
          let val = {
            "Name":ap.name ? ap.name : "-",
            "Email":ap.email ? ap.email : "-",
            "Contact":ap.contact? ap.contact : "-",
            "Message":ap.message ? ap.message : "-",
            "Course":ap.course ? ap.course : "-",
            "Course Date":ap.courseDate ? ap.courseDate : "-",
            "Type":ap.type == 1 ? "Course Form" : "Contact Form",
          }
          data.push(val)
         }
        const worksheet = XLSX.utils.json_to_sheet(data);
    
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      
        res.set('Content-Disposition', 'attachment; filename=inquiryExcel.xlsx');
        res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    
      },
      checkoutStripe: async function(req, res) {
        try {
            let paymentData= {
                courseId:req.body.courseId,
                studentId:req.body.studentId,
                paymentStatus:req.body.paymentStatus,
                paymentBy:req.body.paymentBy
            }
            const pay =  await paymentModel.create(paymentData);
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              line_items: [
                {
                  price:req.body.priceId,
                  quantity: 1,
                },
              ],
              mode: 'payment',
              success_url: 'https://www.yogavidyaschool.com/confirmation',
              cancel_url: 'https://www.yogavidyaschool.com/confirmation',
              customer_email: req.body.custEmail
            });
        
            res.status(200).json({ sessionId: session.id,payDbId:pay._id,url:session.url});
          } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
          }

        //    success_url: 'https://www.yogavidyaschool.com/confirmation',
        // cancel_url: 'https://www.yogavidyaschool.com/confirmation',
        // success_url: 'http://localhost:4200/confirmation',
        // cancel_url: 'http://localhost:4200/confirmation',
      },
      checkoutStripeWithoutProduct: async function(req, res) {
            let paymentData= {
                name:req.body.name,
                email:req.body.email,
                paymentStatus:"unpaid",
                price:req.body.price,
                currency:req.body.currency
            }
            const pay =  await onlinepaymentModel.create(paymentData);
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              line_items: [
                {
                    price_data: {
                        currency: req.body.currency,
                        unit_amount: req.body.price * 100, // Amount in cents
                        product_data: {
                          name: 'Custom Payment',
                        },
                      },
                  quantity: 1,
                },
              ],
              mode: 'payment',
              success_url: 'https://www.yogavidyaschool.com/confirmation',
              cancel_url: 'https://www.yogavidyaschool.com/confirmation',
              customer_email: req.body.email
            });
        
            res.status(200).json({ sessionId: session.id,payDbId:pay._id,url:session.url});
      },
      checkoutStripeNewPranaarabha: async function(req, res) {
        try{

            let paymentData= {
                courseId:req.body.courseId,
                studentId:req.body.studentId,
                paymentStatus:req.body.paymentStatus,
                paymentBy:req.body.paymentBy
            }
            const pay =  await paymentModel.create(paymentData);
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              line_items: [
                {
                    price_data: {
                        currency: req.body.currency,
                        unit_amount: req.body.price * 100, // Amount in cents
                        product_data: {
                          name: 'PRANA ARAMBHA Yoga Course',
                        },
                      },
                  quantity: 1,
                },
              ],
              mode: 'payment',
              success_url: 'https://pranaarambha.yogavidyaschool.com/success.html',
              cancel_url: 'https://pranaarambha.yogavidyaschool.com/failed.html',
              customer_email: req.body.email
            });
        
            res.status(200).json({ sessionId: session.id,payDbId:pay._id,url:session.url});

        }
        catch(err){
            res.status(500).send('Internal Server Error');
        }
 
      },
      getPaymentResult:async function (req, res){
        try {
            const session = await stripe.checkout.sessions.retrieve(req.body.sessionId);
             if(session.payment_status == "paid"){
               let val = {
                student:req.body.student,
                course:req.body.course,
                price:`${(session.amount_total / 100)} ${session.currency}`,
                paymentId:session.payment_intent,
                amount: (session.amount_total / 100),
                currency: session.currency,
                paymentStatus: "paid",
                payDbId:req.body.dbPay,
                date:req.body.date
               }
               try{
                try{

                    const pay = await paymentModel.findOneAndUpdate({_id:val.payDbId},{paymentId: val.paymentId, amount: val.amount, currency: val.currency, paymentStatus:val.paymentStatus});
                } catch(e){
                   console.log('paymnet update error');
                }
                try{
                    let student = await studentModel.findOne({_id:val.student});
                    let coursebody = [];
                 if(val.course){
                     if(student.course.length > 0){
                         coursebody = [...student.course,val.course];
                        }
                        else{
                         coursebody = [val.course];
                        } 
                 }
                 let uniqueArray = coursebody.filter((value, index, self) => {
                     return self.indexOf(value) === index;
                   });
             
                   let bodyUp = {
                     course:uniqueArray
                   }
                    let up = await studentModel.findOneAndUpdate({_id:val.student},bodyUp);
                }
                catch(e){
              console.log('student course update failed');
                }

                try{
 
                    const {coursetitle} = await courseModel.findOne({_id:val.course});
                    const {firstName,email,password} = await studentModel.findOne({_id:val.student});
                  let mailOptions;
                
                  // let student = await studentModel.findOne({_id:req.body.studentId});
                  const filePath = path.join(__dirname, '/emailTemplate/OrderConfirmation.html');
                  const source = fs.readFileSync(filePath, 'utf-8').toString();
                  const template = handlebars.compile(source);
                  const replacements = {
                     
                      "name":firstName,
                      "course":coursetitle,
                      "email":email,
                      "price":val.price,
                      "date": val.date,
                      "password":password
                  };
                  const htmlToSend = template(replacements);
                
                  mailOptions = {
                      from: "Yoga Vidya School info@yogavidyaschool.com",
                      to: email,
                      subject: `Purchase Confirmation - ${coursetitle}`,
                      // text: body,
                      replyTo: 'info@yogavidyaschool.com',
                      html: htmlToSend
                  }
                
                  transporter.sendMail(mailOptions, async (err, result) => {
                      if (err) {
                        //  res.status(400).json('Opps error occured')
                        // console.log('oo');
                      } else {
                          // const blog = await feedbackModel.create(req.body);
                        //   res.status(200).json({'status':"ok","msg":"Mail has been sent!"});
                      }
                  })

                }
                catch(e){
                    console.log('email send error!');
                }

                try{
 
                    const {coursetitle} = await courseModel.findOne({_id:val.course});
                    const {firstName,email} = await studentModel.findOne({_id:val.student});
                    const {paymentId,amount,currency} = await paymentModel.findOne({studentId:val.student})
                  let mailOptions;
                
                  // let student = await studentModel.findOne({_id:req.body.studentId});
                  const filePath = path.join(__dirname, '/emailTemplate/adminOrders.html');
                  const source = fs.readFileSync(filePath, 'utf-8').toString();
                  const template = handlebars.compile(source);
                  const replacements = {
                     
                      "name":firstName,
                      "course":coursetitle,
                      "email":email,
                      "price":amount,
                      "payId":paymentId,
                      "currency":currency
                  };
                  const htmlToSend = template(replacements);
                
                  mailOptions = {
                      from: "Yoga Vidya School info@yogavidyaschool.com",
                      to: 'info@yogavidyaschool.com',
                      subject: `Admin Purchase Confirmation - ${coursetitle}`,
                      // text: body,
                      replyTo: 'info@yogavidyaschool.com',
                      html: htmlToSend
                  }
                
                  transporter.sendMail(mailOptions, async (err, result) => {
                      if (err) {
                        //  res.status(400).json('Opps error occured')
                        // console.log('oo');
                      } else {
                          // const blog = await feedbackModel.create(req.body);
                        //   res.status(200).json({'status':"ok","msg":"Mail has been sent!"});
                      }
                  })

                }
                catch(e){
                    console.log('admin email send error!');
                }

           
               }
               catch(err){
                  console.log('internal error');
               }
               res.status(200).json({'status':"success",sessionId:req.body.sessionId,paymtId:session.payment_intent,amount: (session.amount_total / 100),currency: session.currency,});

             }
             else {
                res.status(200).json({"status":"failed",sessionId:req.body.sessionId});
             }
          } catch (error) {
            res.status(500).json("Internal server error");
          }
      },
      getPaymentResultV2:async function (req, res){
        try {
            const session = await stripe.checkout.sessions.retrieve(req.body.sessionId);
             if(session.payment_status == "paid"){
               let val = {
                paymentStatus: "paid",
                payDbId:req.body.dbPay
               }

               try{
                updatePaymentV2(val);
                res.status(200).json({"status":"success",sessionId:req.body.sessionId,paymtId:session.payment_intent,amount: (session.amount_total / 100),currency: session.currency,});
               }
               catch(err){
                  console.log('internal error');
               }
   

             }
             else {
                res.status(200).json({"status":"failed",sessionId:req.body.sessionId});
             }
          } catch (error) {
            res.status(500).json("Internal server error");
          }
      },
      createOnlineVideo: async function (req, res) {
        {
            
            try{
                if(req.body._id){
                    const onlineVideo = await onlineVideoModel.findOneAndUpdate({_id:req.body._id},req.body);
                    res.status(200).json({status:"ok",msg:`video updated Successfully`});
                }else{
                    const onlineVideo = await onlineVideoModel.create(req.body);
                    res.status(201).json({status:"ok", msg:"video Upload Success"});
                }
             
            }
            catch(err) {
             res.status(400).json({err});
            }
            
        }
    },
    getCourseVideoDataById: async function (req, res) {
        try{
            const {id:cId} = req.params;
    
            const courseVideo = await onlineVideoModel.findOne({_id:cId});
    
            if(!courseVideo){
              return res.status(404).json({msg:`No Video with Id ${cId}`});
            }
            res.status(200).json({"data":courseVideo});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    getEventsById: async function (req, res) {
        try{
            const {id:eveId} = req.params;
    
            const event = await eventModel.findOne({_id:eveId});
    
            if(!event){
              return res.status(404).json({msg:`No Event with Id ${eveId}`});
            }
            res.status(200).json({data:event});
    
        } catch(err){
            res.status(500).json({ msg:err }) 
        }
    },
    createAnalytics: async function (req, res) {
        {
            
            try{
                // if(req.body._id){
                //     const analytics = await analyticsModel.findOneAndUpdate({_id:req.body._id},req.body);
                //     res.status(200).json({status:"ok",msg:`video updated Successfully`});
                // }else{
                //     const analytics = await analyticsModel.create(req.body);
                //     res.status(201).json({status:"ok", msg:"video Upload Success"});
                // }
                const getAnalytics = await analyticsModel.countDocuments({videoId:req.body.videoId,studentId:req.body.studentId});
                if(getAnalytics > 0){
                    res.status(200).json({status:"ok"});                   
                }
                else{
                    const analytics = await analyticsModel.create(req.body);
                    res.status(201).json({status:"ok"});
                }

             
            }
            catch(err) {
             res.status(400).json({err});
            }
            
        }
    },
    getAnalyticsByDate: async function(req, res) {
        let initialValue = 0;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // console.log(sevenDaysAgo,thirtyDaysAgo,ninetyDaysAgo,oneYearAgo);

        if(req.body.days == 7){
           const inrRevenue = await paymentModel.find({currency:"inr",created: { $lt: sevenDaysAgo } });
           const usdRevenue = await paymentModel.find({currency:"usd",created: { $lt: sevenDaysAgo } });
           const totalSignup = await studentModel.countDocuments({created: { $lt: sevenDaysAgo } });

           const inrSum = inrRevenue.reduce(function (accumulator, curValue) {

            return accumulator + Number(curValue.amount);
        
        }, initialValue)
        const usdSum = usdRevenue.reduce(function (accumulator, curValue) {

            return accumulator + Number(curValue.amount);
        
        }, initialValue)

        res.status(200).json({rInr:inrSum,rUsd:usdSum,tStudent:totalSignup});

        }
        else if(req.body.days == 30){

            const inrRevenue = await paymentModel.find({currency:"inr",created: { $lt: thirtyDaysAgo } });
            const usdRevenue = await paymentModel.find({currency:"usd",created: { $lt: thirtyDaysAgo } });
            const totalSignup = await studentModel.countDocuments({created: { $lt: thirtyDaysAgo } });
 
            const inrSum = inrRevenue.reduce(function (accumulator, curValue) {
 
             return accumulator + Number(curValue.amount);
         
         }, initialValue)
         const usdSum = usdRevenue.reduce(function (accumulator, curValue) {
 
             return accumulator + Number(curValue.amount);
         
         }, initialValue)
 
         res.status(200).json({rInr:inrSum,rUsd:usdSum,tStudent:totalSignup});
            
        }
        else if(req.body.days == 90){

            const inrRevenue = await paymentModel.find({currency:"inr",created: { $lt: ninetyDaysAgo } });
            const usdRevenue = await paymentModel.find({currency:"usd",created: { $lt: ninetyDaysAgo } });
            const totalSignup = await studentModel.countDocuments({created: { $lt: ninetyDaysAgo } });
 
            const inrSum = inrRevenue.reduce(function (accumulator, curValue) {
 
             return accumulator + Number(curValue.amount);
         
         }, initialValue)
         const usdSum = usdRevenue.reduce(function (accumulator, curValue) {
 
             return accumulator + Number(curValue.amount);
         
         }, initialValue)
 
         res.status(200).json({rInr:inrSum,rUsd:usdSum,tStudent:totalSignup});
            
        }
        else if(req.body.days == 1){

            const inrRevenue = await paymentModel.find({currency:"inr",created: { $lt: oneYearAgo } });
            const usdRevenue = await paymentModel.find({currency:"usd",created: { $lt: oneYearAgo } });
            const totalSignup = await studentModel.countDocuments({created: { $lt: oneYearAgo } });
 
            const inrSum = inrRevenue.reduce(function (accumulator, curValue) {
 
             return accumulator + Number(curValue.amount);
         
         }, initialValue)
         const usdSum = usdRevenue.reduce(function (accumulator, curValue) {
 
             return accumulator + Number(curValue.amount);
         
         }, initialValue)
 
         res.status(200).json({rInr:inrSum,rUsd:usdSum,tStudent:totalSignup});
            
        }
        else{
            res.json({"msg":"Internal Server error"})
        }
    },
    createSubscriber: async function (req, res) {
        {
            
         try{
            const checkEmail = await subscribeModel.countDocuments({email:req.body.email});
            if(checkEmail > 0){
            res.status(200).json({status:"ok",msg:`Email Already registered`});
            }
            else{
                const subs = await subscribeModel.create(req.body);
                res.status(200).json({status:"ok",msg:`Subscriber Inserted Success`});
            }
            }
            catch(err) {
             res.status(400).json({msg:"Internal Server error"});
            }
    
            
        }
    },

    }

let updatePayment = async function (data){
    try{
     const pay = await paymentModel.findOneAndUpdate({_id:data.payDbId},{paymentId: data.paymentId, amount: data.amount, currency: data.currency, paymentStatus:data.paymentStatus});
     res.status(200).json({status:'ok'})
    }
    catch(error) {
        // res.staus(500).json("Internal server error");
    }
  }

  let updatePaymentV2 = async function (data){
    try{
     const pay = await onlinepaymentModel.findOneAndUpdate({_id:data.payDbId},{paymentId: data.paymentId,paymentStatus:data.paymentStatus});
    }
    catch(error) {
        // res.staus(500).json("Internal server error");
    }
  }

 let  updateStudentCourse = async function (data){
    try{
       let student = await studentModel.findOne({_id:data.student});
       let coursebody = [];
    if(data.course){
        if(student.course.length > 0){
            coursebody = [...student.course,data.course];
           }
           else{
            coursebody = [data.course];
           } 
    }
    let uniqueArray = coursebody.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });

      let bodyUp = {
        course:uniqueArray
      }
       let up = await studentModel.findOneAndUpdate({_id:data.student},bodyUp);
       res.status(200).json({"status":"ok"});
        // console.log(up,'--');
    }
    catch(error) {
        res.status(500).json("Internal server error");
    }
  }

  let sendOrderConfirmation = async function (data) {

          
    const {coursetitle} = await courseModel.findOne({_id:data.course});
    const {firstName,email} = await studentModel.findOne({_id:data.student})
  let mailOptions;

  // let student = await studentModel.findOne({_id:req.body.studentId});
  const filePath = path.join(__dirname, '/emailTemplate/orderConfirmation.html');
  const source = fs.readFileSync(filePath, 'utf-8').toString();
  const template = handlebars.compile(source);
  const replacements = {
     
      "name":firstName,
      "course":coursetitle,
      "email":email,
      "price":data.price,
      "date": data.date
  };
  const htmlToSend = template(replacements);

  mailOptions = {
      from: "Yoga Vidya School info@yogavidyaschool.com",
      to: email,
      subject: `Purchase Confirmation - ${coursetitle}`,
      // text: body,
      replyTo: 'info@yogavidyaschool.com',
      html: htmlToSend
  }

  transporter.sendMail(mailOptions, async (err, result) => {
      if (err) {
        //  res.status(400).json('Opps error occured')
        // console.log('oo');
      } else {
          // const blog = await feedbackModel.create(req.body);
          res.status(200).json({'status':"ok","msg":"Mail has been sent!"});
      }
  })
}