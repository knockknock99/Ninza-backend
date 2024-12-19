const mongoose = require('mongoose');

// Define the schema for individual games
const gameItemSchema = new mongoose.Schema({
  id: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  genre: { 
    type: String, 
    required: true 
  },
  releaseDate: { 
    type: String, // You can use Date if you prefer working with dates
    required: true 
  },
  developer: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true 
  },
  platforms: { 
    type: [String], // Array of strings for platforms
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  }
});

// Define the schema for the Games document
const gameSchema = new mongoose.Schema({
  success: { 
    type: Boolean, 
    required: true 
  },
  data: { 
    type: [gameItemSchema], // Array of game items
    required: true 
  }
}, { collection: 'Games' }); // Ensure this matches your actual collection name

// Export the model
module.exports = mongoose.model('Game', gameSchema);
