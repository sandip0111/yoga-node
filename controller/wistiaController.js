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

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars')
const transporter = require('../helpers/nodemail');
const mongoose = require('mongoose');
const axios = require('axios');


module.exports ={
    getCourseVideo: async function (req, res) {
        {
            // console.log(req.body);
            // try{
               
                
            //     var auth = "Bearer 0c893dffe68f8f6e964d4c6496a5bed6a3a891b00861587763a94d082a6535cd";
            //     var request = require('request');
            //     var query = req.body.projectId
            //     const options = {
            //     url: `https://api.wistia.com/v1/projects/${query}.json`,
            //     method: 'GET',
            //     json: true,
            //     headers: {
            //         "Authorization" : auth,
            //         "content-type": "application/json",
            //         'Accept': 'application/json'
            //     },
            //     body: ''
            //     };
            //     // console.log(options.url,'testing');
            //     var request = require('request').defaults({ encoding: null });
            //     const reqdata = request(options, (error, response, body) => {
            //     //    console.log('testing',body.toString('utf-8'));
            //     if (response) {
            //     //  return resolve(JSON.parse(body).data);
            //         //return body
            //         res.json(body);
            //     }
            //     if (error) {
            //         res.json(error) ;
            //     }
            //     });
             
            // }
            // catch(err) {
            //  res.status(400).json({err});
            // }

            try {
                let query = req.body.projectId
                // Define the API endpoint URL
                const apiUrl = `https://api.wistia.com/v1/projects/${query}.json`;
            
                // Set the bearer token
                const bearerToken = '0c893dffe68f8f6e964d4c6496a5bed6a3a891b00861587763a94d082a6535cd';
            
                // Create the Axios instance with default headers
                const axiosInstance = axios.create({
                  headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'Content-Type': 'application/json' // You can modify or add more headers as needed
                  }
                });
            
                // Make the API call
                const response = await axiosInstance.get(apiUrl);
                res.status(200).json(response.data); // Process the response data here
              } catch (error) {
                res.status(404).json(error); // Handle any errors here
              }
    
            
        }
    },
    getAllProject: async function (req, res) {
        {
            // console.log(req.body);
            try{
               
                
                var auth = "Bearer 0c893dffe68f8f6e964d4c6496a5bed6a3a891b00861587763a94d082a6535cd";
                var request = require('request');
                var query = req.body.projectId
                const options = {
                url: `https://api.wistia.com/v1/projects.json`,
                method: 'GET',
                json: true,
                headers: {
                    "Authorization" : auth,
                    "content-type": "application/json",
                    'Accept': 'application/json'
                },
                body: ''
                };
                // console.log(options.url,'testing');
                var request = require('request').defaults({ encoding: null });
                const reqdata = request(options, (error, response, body) => {
                //    console.log('testing',body);
                if (response) {
                //  return resolve(JSON.parse(body).data);
                    //return body
                    res.json(body);
                }
                if (error) {
                    res.json(error) ;
                }
                });
             
            }
            catch(err) {
             res.status(400).json({err});
            }
    
            
        }
    },

}