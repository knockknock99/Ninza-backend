require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const User = require('./models/User'); 
const Transaction = require('./models/Transaction');
const Game = require('./models/games')
const Counter = require('./models/counter'); // Counter model for sequential IDs

// dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
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

app.post('/api/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    // Check if the user exists by phone number
    let user = await User.findOne({ phone });

    if (user) {
      // User exists, return the existing OTP
      const otp = user.activeOtp;
      console.log(`OTP sent to ${phone}: ${otp}`);
      return res.json({ success: true, message: 'OTP sent successfully', data: user });
    }

    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Fetch or increment the counter for sequential IDs
    let counter = await Counter.findOneAndUpdate(
      { collectionName: 'Users' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true } // Create the counter if it doesn't exist
    );

    const newId = counter.sequenceValue.toString().padStart(3, '0'); // Format ID as "001", "002", etc.

    // Create a new user record
    const newUser = new User({
      id: newId,        // Use the sequential ID
      phone,            // Save the phone number
      activeOtp: otp,   // Save the OTP
      user_type: 'Player', // Default values for new users
      wallet_balance: 0,
      hold_balance: 0,
      referral_code: 'REF' + Math.floor(Math.random() * 100000),
      referral_earning: 0,
      avatar: 'https://example.com/images/default-avatar.png',
      lastLogin: new Date(),
      userStatus: 'unblock',
      permissions: [
        "Create Game", "Join Tournament", "Withdraw Funds"
      ],
      totalDeposit: 0,
      totalWithdrawl: 0,
      misc_amount: 0
    });

    console.log("New user data before saving:", newUser);

    // Save the new user to the database
    await newUser.save();

    // Log the OTP for testing
    console.log(`OTP sent to ${phone}: ${otp}`);

    // Return success response
    res.json({ success: true, message: 'OTP sent successfully', data: { isNewUser: 1 } });
  } catch (err) {
    console.error('Error processing OTP request:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// API to verify OTP
app.post('/api/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  // Validate input
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
  }

  try {
    // Find the user by phone
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if the OTP matches
    if (user.activeOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP matches, update lastLogin and clear activeOtp
    user.lastLogin = new Date();
    // user.activeOtp = null; // Clear the OTP after successful verification
    await user.save();

    // Respond with success
    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: { userId: user.id }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

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

app.put('/api/update-user', async (req, res) => {
  const { id, name, email, user_type, avatar } = req.body;

  // Ensure the `id` is provided
  if (!id) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    // Find the user by ID
    let user = await User.findOne({ id });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user details
    user.name = name || user.name;           // Update if `name` is provided
    user.email = email || user.email;       // Update if `email` is provided
    user.user_type = user_type || user.user_type; // Update if `user_type` is provided
    user.avatar = avatar || user.avatar;   // Update if `avatar` is provided
    user.lastLogin = new Date();           // Update last login time

    // Save the updated user in the database
    await user.save();

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (err) {
    console.error('Error updating user:', err);
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


app.get('/api/games', async (req, res) => {
  try {
    const games = await Game.findOne(); // Fetch the first document in the collection
    console.log('Fetched games from database:', games);

    if (games) {
      res.status(200).json({ success: true, data: games.data });
    } else {
      res.status(404).json({ success: false, message: 'No games found' });
    }
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
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
