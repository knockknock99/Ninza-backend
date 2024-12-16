const mongoose = require('mongoose');

// Define the schema for individual transactions
const transactionItemSchema = new mongoose.Schema({
  id: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  date: { 
    type: String, // You can use Date if you prefer working with dates
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['Credit', 'Debit'], // Restrict to 'Credit' or 'Debit'
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  }
});

// Define the schema for the Transaction document
const transactionSchema = new mongoose.Schema({
  success: { 
    type: Boolean, 
    required: true 
  },
  data: { 
    type: [transactionItemSchema], // Array of transaction items
    required: true 
  }
}, { collection: 'Transaction' }); // Ensure this matches your actual collection name

// Export the model
module.exports = mongoose.model('Transaction', transactionSchema);
