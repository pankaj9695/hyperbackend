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
  lastRewardTime: Date,
  killCount : Number,
});

// Create a model for the GameStats collection
const GameStats = mongoose.model('GameStats', gameStatsSchema, 'PlayersData');

// Set up the API endpoints
const app = express();
app.use(bodyParser.json());

// Endpoint for saving wallet address

app.post('/saveWalletAddress', async (req, res) => {
  console.log(req.body);
  const { userId, walletAddress } = req.body;

  try {
    // Check if the userId is already in the database
    const existingUser = await GameStats.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if the wallet address is already in the database
    const existingWallet = await GameStats.findOne({ walletAddress });
    if (existingWallet) {
      return res.status(400).json({ message: 'Wallet address already exists' });
    }

    // Create a new game stats document for the user
    const newGameStats = new GameStats({
      userId,
      walletAddress,
      coinRewarded: false,
      numCoins: 0,
      killCount: 0,
      winCount: 0,
      matchesCompleted: false,
      playMinit: 0,
      lastRewardTime: null
    });

    // Save the new game stats document to the database
    await newGameStats.save();

    // Reward the player with 150 coins and set the coinRewarded flag to true on the server
    newGameStats.numCoins += 150;
    newGameStats.coinRewarded = true;
    await newGameStats.save();

    // Return a success message and the updated game stats
    return res.status(200).json({ message: 'Wallet address saved successfully', numCoins: newGameStats.numCoins, coinRewarded: newGameStats.coinRewarded });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


// Endpoint for tracking game stats
app.post('/trackGameStats', async (req, res) => {
  const { userId, walletAddress, playMinit, killCount } = req.body;

   // Validate that userId and walletAddress are both provided
   if (!userId || !walletAddress) {
    return res.status(400).json({ message: 'userId or walletAddress missing' });
  }

  try {
    // Find the existing game stats document for the user
    const gameStats = await GameStats.findOne({ walletAddress });

    // If the user has no existing game stats document, return an error response
    if (!gameStats) {
      return res.status(404).json({ message: 'Wallet not found' });
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

    // Save the player's kill count
    gameStats.killCount = killCount;

    // Check if the player has played for at least 60 minutes since their last reward
    if (gameStats.playMinit >= 60 && (!gameStats.lastRewardTime || new Date() - gameStats.lastRewardTime >= 86400000)) {
      // Reward the player with 10 coins and update the lastRewardTime variable
      gameStats.lastRewardTime = new Date();
      gameStats.numCoins += 10;
      // Set the sixtyMinitComplete flag to true
      gameStats.sixtyMinitComplete = true;
    }

    // Check if the player has killed at least 100 enemies
    if (killCount < 100) {
      await gameStats.save();
      // Return a 403 error response if the player's kill count is less than 100      
      return res.status(403).json({ message: 'Kill count is less than 100' });
    } else {
      // Set the killedHundred flag to true if the player's kill count is 100 or greater
      gameStats.killedHundred = true;
    }

    // Save the updated game stats document to the database
    await gameStats.save();

    // Return a success message and the updated game stats
    return res.status(200).json({ message: 'Game stats updated successfully', sixtyMinitComplete: gameStats.sixtyMinitComplete, killedHundred: gameStats.killedHundred, numCoins: gameStats.numCoins });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



app.post('/trackEnemiesKilled', async (req, res) => {
  const { userId, walletAddress, killCount, headShotCount } = req.body;

  // Validate that userId and walletAddress are both provided
  if (!userId || !walletAddress) {
    return res.status(400).json({ message: 'userId or walletAddress missing' });
  }

  try {
    // Find the existing game stats document for the user
    const gameStats = await GameStats.findOne({ walletAddress });

    // If the user has no existing game stats document, return an error response
    if (!gameStats) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // If the player's kill count is less than 100, send a 403 error response
    if (killCount < 100) {
      return res.status(403).json({ message: 'Less than 100 enemies killed' });
    }

    // If the player's headshot count is less than 25, send a 403 error response
    if (headShotCount < 25) {
      return res.status(403).json({ message: 'Less than 25 headshots' });
    }

    // Check if the player has already been rewarded for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (gameStats.lastRewardTime && gameStats.lastRewardTime >= today) {
      return res.status(200).json({ message: 'Already rewarded today' });
    }

    // Reward the player with 5 coins and update the lastRewardTime variable
    gameStats.lastRewardTime = new Date();
    gameStats.numCoins += 5;
    await gameStats.save();

    // Send a success response
    return res.status(200).json({ message: 'Rewarded with 5 coins', numCoins: gameStats.numCoins });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});




    
    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
    