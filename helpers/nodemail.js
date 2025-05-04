const nodemailer = require('nodemailer');
require('dotenv').config()

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,               // Use 587 for STARTTLS
    secure: false,           // Must be false for STARTTLS
    auth: {
        user: 'Info@yogavidyaschool.com',
        pass: 'gbpdiztkoofmivha' //Y0g@31!0 // Your app password, no spaces
    },
    logger: true,            // Log info for debugging
    debug: true 
})

module.exports = transporter