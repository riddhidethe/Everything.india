// uploadSetup.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const app = express();

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'prof-image') {
            cb(null, 'PUBLIC/ASSETS/UPLOADS/profile_images/');
        } else if (file.fieldname === 'prof-pdf') {
            cb(null, 'PUBLIC/ASSETS/UPLOADS/cv_pdfs/');
        } else {
            cb(new Error('Invalid file field name'), false);
        }
    },
    filename: function (req, file, cb) {
        const applicantId = req.session.applicantId;
        console.log(applicantId);
        // if (!applicantId) {
        //     return cb(new Error('Applicant ID is missing'), false);
        // }
        const originalName = path.parse(file.originalname).name;
        const fileExtension = path.extname(file.originalname);
        const newFileName = `${originalName}-${applicantId}${fileExtension}`;
        cb(null, newFileName);
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
