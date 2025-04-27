const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const md5 = require('md5');
const session = require('express-session');

const connection = require('./DATABASE/dbSetup.js');
const conn = connection();

//CORS middleware to allow cross-subdomain requests
app.use(cors({
    origin: ['https://blog.everythingstore.in', 'https://seller.everythingstore.in'],
    credentials: true
  }));

  const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

  function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(403).json({ error: 'No token provided' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      req.user = decoded;
      next();
    });
  }
  
  // Example protected route using the middleware
  app.get('/api/protected-resource', verifyToken, (req, res) => {
    // Access user data via req.user
    res.json({ message: 'Protected data', user: req.user });
  });

// Token exchange endpoints
app.get('/api/get-blog-token', (req, res) => {
    if (!req.session.loggedIn) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Create JWT with user data from session
    const payload = {
      userId: req.session.userId,
      username: req.session.username,
      // Include other relevant user data
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
});
  
app.get('/api/get-seller-token', (req, res) => {
    if (!req.session.loggedIn) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Maybe check if user has seller role or permissions
    // Example: if (!req.session.isSeller) return res.status(403).json({error: 'Not a seller'});
    
    const payload = {
      userId: req.session.userId,
      username: req.session.username,
      // Include seller-specific data
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
});

// Import routes
const jobAuth = require('./ROUTES/authenRoutes.js');
const jobSeeker = require('./ROUTES/jobSeekerRoutes.js');
const jobCreator = require('./ROUTES/jobCreatorRoutes.js');
const jobProfile = require('./ROUTES/profileRoutes.js');
const admin = require('./ROUTES/adminRoutes.js');
const creatorAuth = require('./ROUTES/recruiterAuthenRoutes.js');


// setup middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// setup static files  /views/
app.use('/function', express.static(path.join(__dirname, 'FUNCTION')));
app.use('/public', express.static(path.join(__dirname, 'PUBLIC')));

// setup viewing engine
app.set('views', path.join(__dirname, 'VIEWS'));
app.set('view engine', 'ejs');

// setup session
// app.use(session({
//     secret: 'your-secret-key',
//     resave: false,
//     saveUninitialized: false
// }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 7200000 // 2 hours to match JWT expiration
  }
}));

// setup routes
app.use('/jobSeeker', jobAuth);
app.use('/jobSeeker', jobSeeker);
app.use('/jobSeeker', jobProfile);

app.use('/jobCreator', creatorAuth);
app.use('/jobCreator', jobCreator);

app.use('/admin', admin);


// Serve dummy.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'VIEWS', 'applicant', 'openningPage.html'));
});

// Serve the homepage on a different route
app.get('/homepage', (req, res) => {
    const popularJobs = `SELECT jd.*
                        FROM job_details jd
                            JOIN (
                                SELECT job_id, COUNT(application_id) AS application_count
                                    FROM job_applications
                                GROUP BY job_id
                                    ORDER 
                                        BY application_count DESC
                                    LIMIT 6
                        ) top_jobs ON jd.job_id = top_jobs.job_id;`;

    conn.query(popularJobs, (err, result) => {
        if (err) {
            console.log(err);
            return;
        }
        
        res.render('applicant/applicant_homepage', { r2: result, isLogged: req.session.loggedIn, toastNotification: null });
    });
});



// app.listen(3200);
const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`Main server running on port ${PORT}`);
});


