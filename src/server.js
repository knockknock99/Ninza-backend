require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
// app.use(bodyParser.json()); // Global JSON parser for all routes
// Apply body-parser JSON parsing to POST and PUT requests only
app.post('*', bodyParser.json({ limit: '1mb' }));
app.put('*', bodyParser.json({ limit: '1mb' }));


// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error.message);
});

// Temporary in-memory OTP store
const otpStore = {};

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      console.error('Bad JSON:', err.message);
      return res.status(400).json({ success: false, message: 'Invalid JSON format' });
  }
  next();
});

// Nodemailer transporter setup for SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  
// API to send OTP
app.post('/api/send-otp', (req, res) => {
    console.log(req.body,"-------------------------------------");
    console.log(process.env.SMTP_PORT,"-------------------------------------");

    
  let email = req.body.email;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store the OTP and expiration time (5 minutes)
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
    console.log("otpStore-------------", otpStore);

  // Email content
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}. This code is valid for 5 minutes.`,
  };
  console.log("mailoptions", mailOptions);
  

// Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ success: false, message: 'Failed to send OTP' });
        }
        console.log(`OTP sent to ${email}: ${otp}`);
        res.json({ success: true, message: 'OTP sent successfully' });
    });
});

// API to verify OTP
app.post('/api/verify-otp', (req, res) => {
    console.log(req.body, "body--------------");
    
  let { email, otp } = req.body;
    console.log(email,"----------------", otp);
    
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  const record = otpStore[email];
  console.log(record.otp,"record--------");
  console.log(otp,"otp--------");

  
  if (!record) {
    return res.status(400).json({ success: false, message: 'OTP not requested for this email' });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: 'OTP has expired' });
  }

  if (record.otp == otp) {
    console.log('otp matched-----------------------');
    
    delete otpStore[email];
    return res.json({ success: true, message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
});

app.get('/api/profile/:userId', (req, res) => {
  const { userId } = req.params;

  // Hardcoded profile data
  const profileData = {
      id: userId,
      Name: 'John Doe',
      Email: 'johndoe@example.com',
      Phone: '1234567890',
      user_type: 'Player',
      Wallet_balance: 150.75,
      hold_balance: 20.50,
      referral_code: 'REF12345',
      referral_earning: 50.00,
      avatar: 'https://example.com/images/avatar1.png',
      lastLogin: '2024-12-05T10:15:30Z',
      userStatus: 'unblock',
      Permissions: [
          { Permission: 'Create Game', Status: true },
          { Permission: 'Join Tournament', Status: true },
          { Permission: 'Withdraw Funds', Status: false },
      ],
      totalDeposit: 500.00,
      totalWithdrawl: 200.00,
      misc_amount: 5.00,
  };

  // Send response with hardcoded profile data
  res.json({
      success: true,
      data: profileData
  });
});

app.get('/api/getTransactionHistory', (req, res) => {
  // Dummy transaction history data
  const transactionHistory = [
    {
      id: 101,
      date: '2024-12-01',
      amount: 150.5,
      type: 'Credit',
      description: 'Salary Payment',
    },
    {
      id: 102,
      date: '2024-12-03',
      amount: -50.0,
      type: 'Debit',
      description: 'Grocery Shopping',
    },
    {
      id: 103,
      date: '2024-12-05',
      amount: 200.0,
      type: 'Credit',
      description: 'Freelance Project Payment',
    },
    {
      id: 104,
      date: '2024-12-06',
      amount: -20.0,
      type: 'Debit',
      description: 'Coffee Shop',
    },
  ];

  // Send response with dummy data
  res.json({ success: true, data: transactionHistory });
});

app.get('/api/getGame', (req, res) => {
  // Dummy game data
  const gameData = {
    id: 1,
    name: 'Space Adventure',
    genre: 'Action',
    releaseDate: '2024-01-15',
    developer: 'Galactic Studios',
    rating: 4.8,
    platforms: ['PC', 'PlayStation', 'Xbox'],
    description: 'Explore the galaxy, battle aliens, and conquer new worlds in this action-packed space adventure game.',
  };

  // Send response with dummy data
  res.json({ success: true, data: gameData });
});

app.get('/api/getTournament', (req, res) => {
  // Dummy tournament data
  const tournamentData = {
    id: 1,
    name: 'Champions League Finals',
    game: 'Soccer',
    startDate: '2024-12-15',
    endDate: '2024-12-20',
    location: 'London, UK',
    teams: [
      { id: 101, name: 'Team A' },
      { id: 102, name: 'Team B' },
      { id: 103, name: 'Team C' },
      { id: 104, name: 'Team D' },
    ],
    prizePool: 1000000,
    description: 'The ultimate soccer showdown featuring the best teams from around the globe. Compete for glory and a million-dollar prize pool!',
  };

  // Send response with dummy data
  res.json({ success: true, data: tournamentData });
});
   




const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
