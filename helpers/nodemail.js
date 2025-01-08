const nodemailer = require('nodemailer');
require('dotenv').config()

const transporter = nodemailer.createTransport({
    //service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,  // Port for STARTTLS
    secure: false,   
    auth: {
        user: "Info@yogavidyaschool.com",
        pass: "Y0g@31!0"

    }
})

module.exports = transporter