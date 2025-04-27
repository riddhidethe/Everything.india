const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

function sendOtp(emailID) {
    return new Promise((resolve, reject) => {
        const otp = randomstring.generate({
            length: 4,
            charset: 'numeric'
        });

        console.log(otp);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'amk.bhk@gmail.com',
                pass: 'usqt mwhe uqed kuyl'
            }
        });

        const mailOptions = {
            from: 'amk.bhk@gmail.com',
            to: emailID,
            subject: 'Password Reset',
            text: 'Your 4-digit OTP for password reset is: ' + otp
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
                reject('Error sending email');
            } else {
                console.log('Email sent: ' + info.response);
                resolve({success: true, otp: otp});
            }
        });
    });
}

// function to send status emails to the applicant
function statusMailFunc(emailID, status, job_role, company) {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'amk.bhk@gmail.com',
                pass: 'usqt mwhe uqed kuyl'
            }
        });

        const mailOptions = {
            from: 'amk.bhk@gmail.com',
            to: emailID,
            subject: 'Application Status Notification',
            text: `Status of your application for the job role ${job_role}, in the company ${company} is: ${status}`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
                reject('Error sending email');
            } else {
                console.log('Email sent: ' + info.response);
                resolve({success: true});
            }
        });
    });
}

module.exports = {sendOtp, statusMailFunc};
