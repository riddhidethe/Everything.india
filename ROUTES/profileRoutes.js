const express = require('express');
const dbgetter = require('../DATABASE/dbGetter.js')
const upload = require('../FUNCTION/uploadSetup.js')
var router = express.Router();
const path = require('path')
const connection = require('../DATABASE/dbSetup.js');
const conn = connection();
const session = require('express-session');

router.use(session({
    secret: 'your-secret-key', // Replace with a strong secret
    resave: false,
    saveUninitialized: false
}));

// router.post('/profileComplete', upload.single('prof-image'), (req, res) => {
//     const applicant_id = req.session.applicantId;
//     const email_id = req.session.email;
//     console.log(applicant_id)
//     const first_name = req.body.fname;
//     const last_name = req.body.lname;
//     const age = req.body.age;
//     const mobile_no = req.body.phoneno;
//     const exp = req.body.exp;
//     const gender = req.body.gender;
//     const profile_pic_code = req.file.filename;

//     const profileData = {
//         applicant_id: applicant_id,
//         first_name: first_name,
//         last_name: last_name,
//         age: age,
//         mobile_no: mobile_no,
//         email_id: email_id, 
//         exp: exp,
//         gender: gender,
//         profile_pic_code: profile_pic_code
//     }
//     res.render('form/uploadForm', { pd: profileData })
// });

// router.post('/profileComplete', upload.single('prof-image'), (req, res) => {
//     // Get the role from the request
//     const role = req.body.role || req.session.role;
    
//     // If the role is buyer, redirect to login page
//     if (role === 'buyer') {
//         const applicant_id = req.session.applicantId;
//         const email_id = req.session.email;
//         console.log(applicant_id);
//         const first_name = req.body.fname;
//         const last_name = req.body.lname;
//         const age = req.body.age;
//         const mobile_no = req.body.phoneno;
//         const exp = req.body.exp;
//         const gender = req.body.gender;
//         const profile_pic_code = req.file ? req.file.filename : null;

//         const query = `
//         INSERT INTO job_applicant (applicant_id, first_name, last_name, age, mobile_no, email_id, exp_level, gender, profile_pic_code, skills, cv)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;


//         conn.query(query, [applicant_id, first_name, last_name, age, mobile_no, email_id, exp, gender, profile_pic_code, skills, file.originalname], (err, result)=>{
//             if(err){
//                 console.log(err);
//                 return;
//             }else{
//                 res.redirect("/jobSeeker/login")
//             }
//         });
//     }
    
//     // Only continue with the applicant flow if the role is applicant
//     if (role === 'applicant') {
//         const applicant_id = req.session.applicantId;
//         const email_id = req.session.email;
//         console.log(applicant_id);
//         const first_name = req.body.fname;
//         const last_name = req.body.lname;
//         const age = req.body.age;
//         const mobile_no = req.body.phoneno;
//         const exp = req.body.exp;
//         const gender = req.body.gender;
//         const profile_pic_code = req.file ? req.file.filename : null;

//         const profileData = {
//             applicant_id: applicant_id,
//             first_name: first_name,
//             last_name: last_name,
//             age: age,
//             mobile_no: mobile_no,
//             email_id: email_id, 
//             exp: exp,
//             gender: gender,
//             profile_pic_code: profile_pic_code
//         };
        
//         // Redirect to uploadForm for applicants
//         return res.render('form/uploadForm', { pd: profileData });
//     }
    
//     // // Default fallback if role is neither buyer nor applicant
//     // // This could be for the recruiter role or if no role is provided
//     // res.redirect('/role_select');
// });

router.post('/profileComplete', upload.single('prof-image'), (req, res) => {
    // Get the role from the session that we saved in the role_select route
    const userRole = req.body.userRole;
    console.log(userRole);
    // If the role is buyer, handle buyer data and redirect to login page
    if (userRole === 'buyer') {
        console.log("User role: Buyer");
        const applicant_id = req.session.applicantId;
        const email_id = req.session.email;
        const first_name = req.body.fname;
        const last_name = req.body.lname;
        const age = req.body.age;
        const mobile_no = req.body.phoneno;
        const exp = req.body.exp;
        const gender = req.body.gender;
        // Optional profile pic for buyer
        const profile_pic_code = req.file ? req.file.filename : null;

        // For buyer, we'll save to the same table but with null values for applicant-specific fields
        const query = `
        INSERT INTO job_applicant (applicant_id, first_name, last_name, age, mobile_no, email_id, exp_level, gender, profile_pic_code, skills, cv)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // For buyer, set age, exp_level, skills, and cv to null
        conn.query(query, [applicant_id, first_name, last_name, age, mobile_no, email_id, exp, gender, profile_pic_code, null, null], (err, result) => {
            if(err){
                console.log(err);
                return;
            } else {
                res.redirect("/jobSeeker/login");
            }
        });
    }
    
    // Only continue with the applicant flow if the role is applicant
    else if (userRole === 'applicant') {
        console.log("User role: Applicant");
        const applicant_id = req.session.applicantId;
        const email_id = req.session.email;
        console.log(applicant_id);
        const first_name = req.body.fname;
        const last_name = req.body.lname;
        const age = req.body.age;
        const mobile_no = req.body.phoneno;
        const exp = req.body.exp;
        const gender = req.body.gender;
        const profile_pic_code = req.file ? req.file.filename : null;

        const profileData = {
            applicant_id: applicant_id,
            first_name: first_name,
            last_name: last_name,
            age: age,
            mobile_no: mobile_no,
            email_id: email_id, 
            exp: exp,
            gender: gender,
            profile_pic_code: profile_pic_code
        };
        
        // Redirect to uploadForm for applicants
        return res.render('form/uploadForm', { pd: profileData });
    }

    // Default fallback if role is not found in session
    else {
        console.log("No role found in session");
        res.redirect('/jobSeeker/role_select');
    }
});

router.post('/updateProfile', upload.fields([{ name: 'prof-image', maxCount: 1 }, { name: 'prof-pdf', maxCount: 1 }]), (req, res) => {
    const applicant_id = req.body.applicant_id;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const age = req.body.age;
    const mobile_no = req.body.mobile_no;
    const email_id = req.body.email_id;
    const exp = req.body.exp;
    const gender = req.body.gender;
    const skills = req.body.skills;
    const profilePic = req.body.profilePic;
    let profile_pic_code;
    if(profilePic === "uploaded"){
        profile_pic_code = req.files['prof-image'][0].filename;
    }else{
        profile_pic_code = profilePic;
    }

    const cv = req.files['prof-pdf'][0].filename;

    const query = 'UPDATE job_applicant SET first_name = ?, last_name = ?, age = ?, mobile_no = ?, email_id = ?, skills = ?, exp_level = ?, gender = ?, cv = ?, profile_pic_code = ? WHERE applicant_id = ?';
    const values = [first_name, last_name, age, mobile_no, email_id, skills, exp, gender, cv, profile_pic_code, applicant_id];

    conn.query(query, values, (err, results) => {
        if (err) return res.send(err);
        res.redirect('/jobSeeker/applicant-dashboard');
    });
});


module.exports = router;