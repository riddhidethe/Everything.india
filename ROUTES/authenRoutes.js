const express = require('express');
const dbgetter = require('../DATABASE/dbGetter.js');
const connection = require('../DATABASE/dbSetup.js');
const mailFunc = require('../FUNCTION/mailSetup.js');
const session = require('express-session');
const md5 = require('md5');
const path = require('path');
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

router.get('/role_select', (req, res) => {
    res.render('form/role_select', {
      title: 'Select Your Role',
      formId: 'role_select'
    });
  });
  
  router.post('/role_select', (req, res) => {
    const userRole = req.body.role;
  
    console.log('User role saved in session:', userRole);
  
    // Redirect based on the selected role
    switch (userRole) {
      case 'applicant':
        res.render('form/applicant_registration', { userRole: userRole , errorMsg: '' });
        break;
      case 'recruiter':
        res.render('recruiter/recruiter_forms/recruiter_registration', { userRole: userRole , errorMsg: '' });
        break;
      case 'buyer':
        res.render('form/applicant_registration', { userRole: userRole , errorMsg: '' });
        break;
      default:
        res.redirect('/jobSeeker/role_select');
    }
  });
  

// route to open the login form
router.get('/login', (req, res) => {
    res.render('form/login_via_password', { errorMsg: null, display: null });
});


// route to get data from the login form for login process
// router.post('/login', (req, res) => {
//     const email = req.body.email;
//     const password = req.body.password;
//     const encPass = md5(password);

//     const query = `SELECT * FROM applicant_credentials WHERE emailID = '${email}' and password = '${encPass}' LIMIT 1`;

//     conn.query(query, (err, result) => {
//         if (err) {
//             console.log(err)
//             return;
//         }
//         if (result.length > 0) {
//             if(result[0].isActive == 1){
//                 req.session.loggedIn = true;
//                 req.session.applicantId = result[0].applicant_id;
//                 res.redirect('/jobSeeker?toastNotification=Logged In Successfully!');
//             }else{
//                 res.render('form/login_via_password', { errorMsg: null, display: true });
//             }
//         } else {
//             res.render('form/login_via_password', { errorMsg: 'Invalid credentials', display: null });
//         }
//     });
// });

// Modify the login POST handler to generate JWT tokens
router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const encPass = md5(password);

    const query = `SELECT * FROM applicant_credentials WHERE emailID = '${email}' and password = '${encPass}' LIMIT 1`;

    conn.query(query, (err, result) => {
        if (err) {
            console.log(err)
            return;
        }
        if (result.length > 0) {
            if(result[0].isActive == 1){
                // Set session data
                req.session.loggedIn = true;
                req.session.applicantId = result[0].applicant_id;
                req.session.username = result[0].username; // Add this if it exists in your DB
                req.session.userId = result[0].applicant_id;
                req.session.email = result[0].emailID;
                
                // Generate JWT token for cross-subdomain auth
                const token = jwt.sign({
                    userId: result[0].applicant_id,
                    username: result[0].username || email, // Use username if available, otherwise email
                    email: result[0].emailID
                }, JWT_SECRET, { expiresIn: '2h' });
                
                // Store token in session for later use in redirects
                req.session.authToken = token;
                
                res.redirect('/jobSeeker?toastNotification=Logged In Successfully!');
            }else{
                res.render('form/login_via_password', { errorMsg: null, display: true });
            }
        } else {
            res.render('form/login_via_password', { errorMsg: 'Invalid credentials', display: null });
        }
    });
});

// route to open the login via otp form
router.get('/login_via_otp', (req, res) => {
    res.render('form/login_via_otp', { errorMsg: null });
})


router.post('/login_via_otp', (req, res) => {
    const emailID = req.body.emailID;
    conn.query(`SELECT * FROM applicant_credentials WHERE emailID = '${emailID}'`, async (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.length > 0) {
                if(result[0].isActive == 1){
                    try {
                        const mailResult = await mailFunc.sendOtp(emailID);
                        if (mailResult.success) {
                            console.log(mailResult.otp);
                            req.session.otp = mailResult.otp;
                            req.session.applicantId = result[0].applicant_id;
                            res.render('form/verify_otp')
                        }
                    } catch (error) {
                        console.log(error);
                        res.send('Error sending email');
                    }
                }else{
                    res.render('form/login_via_otp', { errorMsg: null, display: true });
                }
            } else {
                res.render('form/login_via_otp', { errorMsg: 'Email not Found', display:null });
            }
        }
    });
})

// router.post('/verify_otp', (req, res) => {
//     const otp = req.session.otp;
//     const enteredOtp = req.body.otp;

//     console.log('verify_otp_route_main_part');

//     if (otp === enteredOtp) {
//         console.log('verify_otp_route_if_part');
//         req.session.loggedIn = true;
//         res.redirect('/jobSeeker?toastNotification=Logged In Successfully!');
//     } else {
//         console.log('verify_otp_route_else_part');
//         res.render('form/login_via_otp', { errorMsg: 'Invalid OTP' });
//     }
// });

// Also modify verify_otp to generate tokens
router.post('/verify_otp', (req, res) => {
    const otp = req.session.otp;
    const enteredOtp = req.body.otp;

    console.log('verify_otp_route_main_part');

    if (otp === enteredOtp) {
        console.log('verify_otp_route_if_part');
        req.session.loggedIn = true;
        
        // Generate JWT token here too
        conn.query(`SELECT * FROM applicant_credentials WHERE applicant_id = ?`, [req.session.applicantId], (err, result) => {
            if (err || result.length === 0) {
                console.log(err || 'User not found');
                return res.redirect('/jobSeeker/login');
            }
            
            // Generate JWT token for cross-subdomain auth
            const token = jwt.sign({
                userId: result[0].applicant_id,
                username: result[0].username || result[0].emailID,
                email: result[0].emailID
            }, JWT_SECRET, { expiresIn: '2h' });
            
            // Store token in session
            req.session.authToken = token;
            
            res.redirect('/jobSeeker?toastNotification=Logged In Successfully!');
        });
    } else {
        console.log('verify_otp_route_else_part');
        res.render('form/login_via_otp', { errorMsg: 'Invalid OTP' });
    }
});

// Add routes for redirecting to subdomains with authentication
router.get('/redirect-to-blog', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/jobSeeker/login');
    }
    
    // Use existing token or generate new one
    let token = req.session.authToken;
    if (!token) {
        token = jwt.sign({
            userId: req.session.applicantId,
            username: req.session.username || req.session.email,
            email: req.session.email
        }, JWT_SECRET, { expiresIn: '2h' });
        req.session.authToken = token;
    }
    
    // Redirect to blog subdomain with token
    res.redirect(`https://blog.everythingstore.in?token=${token}`);
});

router.get('/redirect-to-seller', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/jobSeeker/login');
    }
    
    // Use existing token or generate new one
    let token = req.session.authToken;
    if (!token) {
        token = jwt.sign({
            userId: req.session.applicantId,
            username: req.session.username || req.session.email,
            email: req.session.email
        }, JWT_SECRET, { expiresIn: '2h' });
        req.session.authToken = token;
    }
    
    // Redirect to seller subdomain with token
    res.redirect(`https://seller.everythingstore.in?token=${token}`);
});

router.get('/registration', (req, res) => {
    res.render('Form/applicant_registration', { errorMsg: null });
});

// router.post('/registration', (req, res) => {
//     const emailID = req.body.emailID;
//     const username = req.body.username;
//     const password = req.body.password;
//     const con_password = req.body.con_password;
//     const encPass = md5(password);

//     // First, check if the emailID is in the ex_applicants table
//     conn.query(`SELECT * FROM ex_applicants WHERE emailID = ?`, [emailID], (err, exResults) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).send('Internal server error');
//         }

//         if (exResults.length > 0) {
//             // Email is blocked
//             return res.render('Form/applicant_registration', { errorMsg: 'EmailID blocked' });
//         } else {
//             // Check if the emailID already exists in the applicant_credentials table
//             conn.query(`SELECT * FROM applicant_credentials WHERE emailID = ?`, [emailID], (err, results) => {
//                 if (err) {
//                     console.log(err);
//                     return res.status(500).send('Internal server error');
//                 }

//                 if (results.length > 0) {
//                     res.render('Form/applicant_registration', { errorMsg: 'Email already exists' });
//                 } else {
//                     if (password === con_password) {
//                         const query = `INSERT INTO applicant_credentials (username, emailID, password) VALUES (?, ?, ?)`;
//                         conn.query(query, [username, emailID, encPass], (err, result) => {
//                             if (err) {
//                                 console.log(err);
//                                 return res.status(500).send('Internal server error');
//                             } else {
//                                 const query = `SELECT * FROM applicant_credentials WHERE emailID = ? AND password = ? LIMIT 1`;
//                                 conn.query(query, [emailID, encPass], (err, result) => {
//                                     if (err) {
//                                         console.log(err);
//                                         return res.status(500).send('Internal server error');
//                                     }

//                                     if (result.length > 0) {
//                                         req.session.applicantId = result[0].applicant_id;
//                                         req.session.email = result[0].emailID;
//                                         res.render('form/complete_form');
//                                     }
//                                 });
//                             }
//                         });
//                     } else {
//                         res.render('Form/applicant_registration', { errorMsg: 'Password and Confirm Password do not match' });
//                     }
//                 }
//             });
//         }
//     });
// });

router.post('/registration', (req, res) => {
    const emailID = req.body.emailID;
    const username = req.body.username;
    const password = req.body.password;
    const con_password = req.body.con_password;
    const userRole = req.body.userRole;
    console.log(userRole);
    const encPass = md5(password);
    
    // Get the role from session
    // const role = req.session.userRole; // Default to applicant if no role is found

    // First, check if the emailID is in the ex_applicants table
    conn.query(`SELECT * FROM ex_applicants WHERE emailID = ?`, [emailID], (err, exResults) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Internal server error');
        }

        if (exResults.length > 0) {
            // Email is blocked
            return res.render('Form/applicant_registration', { errorMsg: 'EmailID blocked' });
        } else {
            // Check if the emailID already exists in the applicant_credentials table
            conn.query(`SELECT * FROM applicant_credentials WHERE emailID = ?`, [emailID], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal server error');
                }

                if (results.length > 0) {
                    res.render('Form/applicant_registration', { errorMsg: 'Email already exists' });
                } else {
                    if (password === con_password) {
                        const query = `INSERT INTO applicant_credentials (username, emailID, password) VALUES (?, ?, ?)`;
                        conn.query(query, [username, emailID, encPass], (err, result) => {
                            if (err) {
                                console.log(err);
                                return res.status(500).send('Internal server error');
                            } else {
                                const query = `SELECT * FROM applicant_credentials WHERE emailID = ? AND password = ? LIMIT 1`;
                                conn.query(query, [emailID, encPass], (err, result) => {
                                    if (err) {
                                        console.log(err);
                                        return res.status(500).send('Internal server error');
                                    }

                                    if (result.length > 0) {
                                        req.session.applicantId = result[0].applicant_id;
                                        req.session.email = result[0].emailID;
                                        
                                        // Pass the role to the complete_form template
                                        console.log(`Redirecting to profile completion with role: ${userRole}`);
                                        res.render('form/complete_form', { userRole: userRole });
                                    }
                                });
                            }
                        });
                    } else {
                        res.render('Form/applicant_registration', { errorMsg: 'Password and Confirm Password do not match' });
                    }
                }
            });
        }
    });
});

router.get('/forgot_password', (req, res) => {
    res.render('form/forgetpassword', { errorMsg: null })
});

router.post('/forgot_password', (req, res) => {
    const emailID = req.body.emailID;
    console.log("Email: " + emailID);

    conn.query(`SELECT * FROM applicant_credentials WHERE emailID = '${emailID}'`, async (err, result) => {
        if (err) {
            console.log(err);
            res.redirect('/jobSeeker/login');
        } else {
            if (result.length > 0) {
                try {
                    const mailResult = await mailFunc.sendOtp(emailID);
                    if (mailResult.success) {
                        req.session.femailID = emailID;
                        req.session.fotp = mailResult.otp;
                        res.render('form/verify_otp2');
                    }
                } catch (error) {
                    console.log(error);
                    res.send('Error sending email');
                }
            } else {
                res.render('form/forgetpassword', { errorMsg: 'Email does not exist' });
            }
        }
    });
});

router.post('/verify_otp_2', (req, res) => {
    const fotp = req.session.fotp;
    const enteredOtp = req.body.otp;

    if (fotp === enteredOtp) {
        res.redirect('/jobSeeker/reset_password');
    } else {
        res.render('form/forgetpassword', { errorMsg: 'Invalid OTP' });
    }
});

router.get('/reset_password', (req, res) => {
    res.render('form/reset_password', { errorMsg: null });
});

router.post('/reset_password', (req, res) => {
    var email = req.session.femailID;
    var con_password = req.body.con_password;
    var password = req.body.password;
    var encPass = md5(password);
    if (password === con_password) {
        conn.query('update applicant_credentials SET password = ? where emailID = ?', [encPass, email], function (error, results, fields) {
            if (error) {
                console.error("Error in reseting password");
                res.redirect('/jobSeeker/forgot_password');
            } else {
                res.redirect('/jobSeeker/login');
            }
        });
    } else {
        res.render('form/reset_password', { errorMsg: 'Password and Confirm Password do not match' });
    }
});




// Applicant Change Password
router.get('/changePassword', (req, res) => {
    res.render('form/change_password_form', {errorMsg: null});
});

router.post('/changePassword', (req, res) => {
    let oldPass = md5(req.body.oldPassword);
    const checkOldPass = 'SELECT password FROM applicant_credentials WHERE applicant_id = ?';
    conn.query(checkOldPass, [req.session.applicantId], (error, results)=>{
        if(error){
            console.log(err);
            return;
        }else{
            if(oldPass === results[0].password){
                let newPass = md5(req.body.newPassword);
                let confirmPass = md5(req.body.con_password);
                if(newPass === confirmPass){
                    const updatePass = 'UPDATE applicant_credentials SET password = ? WHERE applicant_id = ?';
                    conn.query(updatePass, [newPass, req.session.applicantId], (error, result2)=>{
                        if(error){
                            console.log(error);
                            return;
                        }else{
                            res.redirect('/jobSeeker/login');
                        }
                    });
                }else{
                    res.render('form/change_password_form', {errorMsg: 'passwords doesnot match'})
                }
            }else{
                res.render('form/change_password_form', {errorMsg: 'current Password is incorrect'});
            }
        }
    });
});


// logout route
router.get('/logout', (req, res)=>{
    req.session.destroy();
    res.redirect('/homepage');
});


module.exports = router;
