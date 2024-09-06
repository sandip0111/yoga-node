const nodemailer = require('nodemailer');
require('dotenv').config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "Info@yogavidyaschool.com",
        pass: "yvs@PK$12345"

    }
})

module.exports = transporter