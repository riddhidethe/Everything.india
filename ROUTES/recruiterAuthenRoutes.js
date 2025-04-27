const express = require('express');
const dbgetter = require('../DATABASE/dbGetter.js');
const connection = require('../DATABASE/dbSetup.js');
const mailFunc = require('../FUNCTION/mailSetup.js');
const session = require('express-session');
const md5 = require('md5');
const router = express.Router();
const conn = connection();

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Session middleware
router.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: false
}));

// login route for recruiter coming from the login button clicked
router.get('/login', (req, res) => {
    res.render('recruiter/recruiter_forms/recruiter_login', { errorMsg: null, display: null });
});

// login route for recruiter coming from form
router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const encPass = md5(password);

    const query = `SELECT * FROM job_creator WHERE emailID = '${email}' LIMIT 1`;

    conn.query(query, (err, result) => {
        if (err) {
            res.status(500).send('Server error');
            return;
        }else{
            if (result.length > 0) {
                if(result[0].isActive == 1){
                    if(encPass === result[0].password){
                        req.session.loggedIn = true;
                        req.session.creator_id = result[0].creator_id;
                        req.session.creator_username = result[0].creator_fname + ' ' + result[0].creator_lname;
                        req.session.profilePic = result[0].profile_photo;
                        req.session.company_name = result[0].company;
                        res.redirect('/jobCreator?toastNotification=Logged In Successfully!');
                    }else{
                        res.render('recruiter/recruiter_forms/recruiter_login', {errorMsg: 'Wrong Password', display: null});
                    }
                }else{
                    res.render('recruiter/recruiter_forms/recruiter_login', {errorMsg: null, display:true});
                }
            } else {
                res.redirect('/jobCreator/login');
            }
        }
    });
});


// registration route from button
router.get('/register', (req, res)=>{
    res.render('recruiter/recruiter_forms/recruiter_registration', {errorMsg: null});
});


// registration route from form
router.post('/register', (req, res) => {
    const fname = req.body.fname,
          lname = req.body.lname,
          email = req.body.email,
          password = req.body.password,
          company = req.body.company,
          phno = req.body.phno,
          confirmPassword = req.body.confirmpassword;

    const profilePic = `${company}.png`;
    const encPassword = md5(password);


    if (password === confirmPassword) {
        const addCreator = `INSERT INTO job_creator (creator_fname, creator_lname, company, emailID, contact_number, password, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [fname, lname, company, email, phno, encPassword, profilePic];

        conn.query(addCreator, values, (err, result) => {
            if (err) {
                res.status(500).send('Server error');
                console.log(err);
                return;
            } else {
                res.redirect('/jobCreator/login');
            }
        });
    } else {
        res.render('recruiter/recruiter_forms/recruiter_registration', { errorMsg: 'Passwords do not match' });
    }
});

// route to render the forget password form
router.get('/forgotPassword', (req, res)=>{
    res.render('recruiter/recruiter_forms/recruiter_forgot_password', {errorMsg: null});
});


// route to perform forget password operations
router.post('/forgotPassword', (req, res)=>{
    const email = req.body.email;
    const query = 'SELECT * FROM job_creator WHERE emailID = ?';
    conn.query(query, [email], async (err, result)=>{
        if(err){
            console.log(err);
            res.redirect('/jobCreator/login');
        }else{
            if(result.length > 0){
                try{
                    const mailResult = await mailFunc.sendOtp(email);
                    if(mailResult.success){
                        req.session.creator_email = email;
                        req.session.creator_otp = mailResult.otp;
                        res.redirect('/jobCreator/verifyotp');
                    }
                }catch(error){
                    res.send('Error while sending email');
                }
            }else{
                res.render('recruiter/recruiter_forms/recruiter_forgot_password', {errorMsg: 'Email doesnot exists'});
            }
        }
    });
});


// route for resending the otp
router.get('/resend_otp', async(req, res)=>{
    const email = req.session.creator_email;
    try{
        const mailResult = await mailFunc.sendOtp(email);
        if(mailResult.success){
            req.session.creator_otp = mailResult.otp;
            res.render('recruiter/recruiter_forms/recruiter_verify_otp', {errorMsg: null});
        }
    }catch(error){
        res.send('Error while sending email');
    }
});


// verify otp 
router.get('/verifyotp', (req, res)=>{
    res.render('recruiter/recruiter_forms/recruiter_verify_otp', {errorMsg: null});
});


// route to verify otp
router.post('/verifyotp', (req, res)=>{
    const otp = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;
    if(otp == req.session.creator_otp){
        res.render('recruiter/recruiter_forms/recruiter_reset_password', {errorMsg: null});
    }else{
        res.render('recruiter/recruiter_forms/recruiter_verify_otp', {errorMsg: 'Invalid OTP'});
    }
});

// route to perform reset password operations
router.post('/reset_password', (req, res)=>{
    const newPass = md5(req.body.new_password);
    const confirmPass = md5(req.body.confirm_password);

    if(newPass === confirmPass){
        const query = 'UPDATE job_creator SET password = ? WHERE emailID = ?';
        conn.query(query, [newPass, req.session.creator_email], (err, result)=>{
            if(err){
                console.log(err);
               return;
            }else{
                res.redirect('/jobCreator/login');
            }
        });
    }else{
        res.render('recruiter/recruiter_forms/recruiter_reset_password', {errorMsg: 'Password Does not Match'});
    }
});


// route to logout from the site
router.get('/logout', (req, res)=>{
    req.session.destroy();
    res.redirect('/homepage');
});

module.exports = router;