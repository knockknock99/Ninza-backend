const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  activeOtp: {type: String, required: false },
  user_type: { type: String },
  wallet_balance: { type: Number },
  hold_balance: { type: Number },
  referral_code: { type: String },
  referral_earning: { type: Number },
  avatar: { type: String },
  lastLogin: { type: Date },
  userStatus: { type: String },
  permissions: { type: [String] },
  totalDeposit: { type: Number },
  totalWithdrawl: { type: Number },
  misc_amount: { type: Number }
}, { collection: 'Users' });  // Ensure this matches your actual collection name

module.exports = mongoose.model('User', userSchema);
