const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Set up the MongoDB connection string
mongoose.connect('mongodb+srv://pkrhtdm:987654321.0@hypermovegame.loejrx2.mongodb.net/HypermoveGame');

// Create a schema for the GameStats collection
const gameStatsSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true
  },
  walletAddress: {
    type: String,
    unique: true
  },
  coinRewarded: Boolean,
  numCoins: Number,
  winCount: Number,
  matchesCompleted: Boolean,
  playMinit: Number,
  lastRewardTime: Date
});

// Create a model for the GameStats collection
const GameStats = mongoose.model('GameStats', gameStatsSchema, 'PlayersData');

// Set up the API endpoints
const app = express();
app.use(bodyParser.json());

// Endpoint for saving wallet address
app.post('/saveWalletAddress', async (req, res) => {
  console.log(req.body);
  const { userId, walletAddress, coinRewarded, numCoins } = req.body;

  try {
    // Check if the userId is already in the database
    const existingUser = await GameStats.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if the wallet address is already in the database
    const existingWallet = await GameStats.findOne({ walletAddress });
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet address already exists' });
    }

    // Create a new game stats document for the user
    const newGameStats = new GameStats({
      userId,
      walletAddress,
      coinRewarded,
      numCoins,
      winCount: 0,
      matchesCompleted: false,
      playMinit: 0,
      lastRewardTime: null
    });

    // Save the new game stats document to the database
    await newGameStats.save();

    // Return a success message
    return res.status(200).json({ message: 'Wallet address saved successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});




// Endpoint for tracking game stats
app.post('/trackGameStats', async (req, res) => {
  const { userId, playMinit } = req.body;

  try {
    // Find the existing game stats document for the user
    const gameStats = await GameStats.findOne({ userId });

    // If the user has no existing game stats document, return an error response
    if (!gameStats) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Increment the player's win count
    gameStats.winCount += 1;

    // Check if the player has completed 5 matches
    if (gameStats.winCount >= 5 && !gameStats.matchesCompleted) {
      // Update the matchesCompleted flag and send a success response
      gameStats.matchesCompleted = true;
      await gameStats.save();
      return res.status(200).json({ message: 'Matches completed', matchesCompleted: true });
    }

    // Update the player's playMinit variable
    gameStats.playMinit += playMinit;

    // Check if the player has played for at least 60 minutes since their last reward
    if (gameStats.playMinit >= 60 && (!gameStats.lastRewardTime || new Date() - gameStats.lastRewardTime >= 86400000)) {
      // Reward the player with 10 coins and update the lastRewardTime variable
      gameStats.lastRewardTime = new Date();
      gameStats.numCoins += 10;
      // Set the sixtyMinitComplete flag to true
      gameStats.sixtyMinitComplete = true;
    }

    // Save the updated game stats document to the database
    await gameStats.save();

    // Return a success message and the updated game stats
    return res.status(200).json({ message: 'Game stats updated successfully', sixtyMinitComplete: gameStats.sixtyMinitComplete });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


    
    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
    