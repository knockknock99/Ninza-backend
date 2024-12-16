require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const User = require('./models/User'); 
const Transaction = require('./models/Transaction');

// dotenv.config();
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());

// Apply body-parser JSON parsing to POST and PUT requests only
app.post('*', bodyParser.json({ limit: '1mb' }));
app.put('*', bodyParser.json({ limit: '1mb' }));

// MongoDB connection
const mongoURI = process.env.MONGO_URI; // MongoDB URI from the .env file

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    
    // Log database name
    console.log('Connected to DB:', mongoose.connection.name);

    // Log the collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(collection => collection.name));
  })
  .catch(err => console.error('Error connecting to MongoDB:', err));


// Temporary in-memory OTP store
const otpStore = {};

// app.use((err, req, res, next) => {
//   if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
//     console.error('Bad JSON:', err.message);
//     return res.status(400).json({ success: false, message: 'Invalid JSON format' });
//   }
//   next();
// });

// Nodemailer transporter setup for SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// API to send OTP
app.post('/api/send-otp', (req, res) => {
  console.log(req.body, "-------------------------------------");
  console.log(process.env.SMTP_PORT, "-------------------------------------");
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
    from: process.env.FROM_EMAIL,
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
  console.log(email, "----------------", otp);

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  const record = otpStore[email];
  console.log(record.otp, "record--------");
  console.log(otp, "otp--------");

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

// API to fetch User data by custom 'id'
app.get('/api/users/byId/:id', async (req, res) => {
  const { id } = req.params; 
  console.log('Requested User ID:', id);  

  try {
    // Log the query format to ensure correct data is being passed
    console.log('Querying Database for id:', id);  // Log the id being queried

    // Query the database using 'id' field from your schema
    const user = await User.findOne({ id: id });

    console.log('Query Result:', user);  // Log the result of the query

    if (user) {
      res.status(200).json({ success: true, data: user });
    } else {
      console.log('User not found for id:', id);
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    console.error('Error fetching user by id:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


app.get('/api/transactions', async (req, res) => {
  try {
    // Fetch the first document in the collection (assuming there's only one document)
    const transactions = await Transaction.findOne();

    // Log the fetched data for debugging
    console.log('Fetched data from database:', transactions);

    // Check if data exists and return it; otherwise, respond with "not found"
    if (transactions) {
      res.status(200).json(transactions);
    } else {
      console.log('No transactions found in the database.');
      res.status(404).json({ success: false, message: 'No transactions found' });
    }
  } catch (err) {
    // Log the error and respond with a 500 status code
    console.error('Error fetching transactions:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
