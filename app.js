const express = require('express');
const mongoose = require('mongoose');
const app = express();
const adminRoutes = require('./routes/adminRoutes');
require('dotenv').config()
var cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');


//middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended:true}));
app.use("/public", express.static(path.join(__dirname, 'public')));
// mongoose.connect('mongodb://44.211.96.198:27016/yogavidyaschool', { useNewUrlParser: true, useUnifiedTopology: true })
//     .then((result) => {
//         console.log("Database connected");
//         app.listen(3000);
//     })
//     .catch((error) => {
//         console.log(error);
//     })

const username = 'yogavidyaschooldb';
const password = 'yogavidya4321qwerty';
const host = '44.211.96.198';
const port = '27014'; 
const dbName = 'yogavidyaschool'; 

    mongoose.connect(`mongodb://${username}:${password}@${host}:${port}/${dbName}`, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        console.log("Database connected");
        app.listen(3000);
    })
    .catch((error) => {
        console.log(error);
    })


// app.post('/api/sendTestMail', (req, res) => {
//     const { to, subject, body } = req.body;
//     try {
//         if (to) {
//             if (to.trim() === "") throw new Error("Invalid recipent email");
//         } else throw new Error("Invalid receipt email")
//         if (subject) {
//             if (subject.trim() === "") throw new Error("Kindly enter subject");
//         } else throw new Error("Kindly enter subject");
//         if (body) {
//             if (body.trim() === "") throw new Error("Kindly add message");
//         } else throw new Error("Kindly add message");


//         const filePath = path.join(__dirname, '/emailTemplate/testEmail.html');
//         const source = fs.readFileSync(filePath, 'utf-8').toString();
//         const template = handlebars.compile(source);
//         const replacements = {
//             user: "admin"
//         };
//         const htmlToSend = template(replacements);

//         const mailOptions = {
//             from: process.env.EMAIL,
//             to: to,
//             subject: subject,
//             text: body,
//             replyTo: to,
//             html: htmlToSend
//         }
//         transporter.sendMail(mailOptions, (err, result) => {
//             if (err) {
//                 res.status(400).json('Opps error occured')
//             } else {
//                 res.status(200).json('thanks for e-mailing me');
//             }
//         })
//     } catch (error) {
//         console.log(error);
//         res.status(400).json(error.message)
//     }
// })

//routes
app.use('/api/v1', adminRoutes);

// const express = require('express');
// const mongoose = require('mongoose');
// const app = express();
// const adminRoutes = require('./routes/adminRoutes');
// require('dotenv').config()
// var cors = require('cors');
// const bodyParser = require('body-parser');
// const path = require('path');
// const https = require("https");
// const fs = require("fs");

// //middleware
// app.use(express.json());
// app.use(cors());
// app.use(bodyParser.urlencoded({ extended:true}));
// app.use("/public", express.static(path.join(__dirname, 'public')));


// mongoose.connect('mongodb://18.212.35.81:27018/yogavidyaschool', { useNewUrlParser: true, useUnifiedTopology: true })
//     .then((result) => {
//         console.log("Database connected");
//         // app.listen(3000);
//     })
//     .catch((error) => {
//         console.log(error);
//     })


// // app.post('/api/sendTestMail', (req, res) => {
// //     const { to, subject, body } = req.body;
// //     try {
// //         if (to) {
// //             if (to.trim() === "") throw new Error("Invalid recipent email");
// //         } else throw new Error("Invalid receipt email")
// //         if (subject) {
// //             if (subject.trim() === "") throw new Error("Kindly enter subject");
// //         } else throw new Error("Kindly enter subject");
// //         if (body) {
// //             if (body.trim() === "") throw new Error("Kindly add message");
// //         } else throw new Error("Kindly add message");


// //         const filePath = path.join(__dirname, '/emailTemplate/testEmail.html');
// //         const source = fs.readFileSync(filePath, 'utf-8').toString();
// //         const template = handlebars.compile(source);
// //         const replacements = {
// //             user: "admin"
// //         };
// //         const htmlToSend = template(replacements);

// //         const mailOptions = {
// //             from: process.env.EMAIL,
// //             to: to,
// //             subject: subject,
// //             text: body,
// //             replyTo: to,
// //             html: htmlToSend
// //         }
// //         transporter.sendMail(mailOptions, (err, result) => {
// //             if (err) {
// //                 res.status(400).json('Opps error occured')
// //             } else {
// //                 res.status(200).json('thanks for e-mailing me');
// //             }
// //         })
// //     } catch (error) {
// //         console.log(error);
// //         res.status(400).json(error.message)
// //     }
// // })

// //routes
// app.use('/api/v1', adminRoutes);
// // console.log('before-------------------------------');
// // app.use('/', function(req,res){
// //     console.log('---------------');
// //     res.send('hellosbfkjdnfsnfj');
// // });
// const certPath = '/etc/letsencrypt/live/indiayogashala.com';
// https.createServer( {
//     key: fs.readFileSync(`${certPath}/privkey.pem`),
//     cert: fs.readFileSync(`${certPath}/fullchain.pem`),
//   },app)
//   .listen(3000, ()=>{
//     console.log('server is runing at port 3000')
//   });
// // app.listen(3000);
