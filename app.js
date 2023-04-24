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
  matchCount: Number,
  matchesCompleted: Boolean,
  playMinit: Number,
  lastRewardTime: Date,
  killCount: Number,
  headShotCount: Number,
  fiveMatchesCompleted: Boolean,
  sixtyMinitComplete: Boolean,
  isWinner: Boolean
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
      matchCount: 0,
      matchesCompleted: false,
      playMinit: 0,
      lastRewardTime: null,
      killCount: 0,
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
  const { userId, walletAddress, playMinit } = req.body;

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

    // Update the match count for the player
    gameStats.matchCount += 1;
    gameStats.playMinit += playMinit;

    // If the player has completed 5 matches, reward them with 200 numCoins and set fiveMatchesCompleted to true
    if (gameStats.matchCount >= 5 && !gameStats.fiveMatchesCompleted) {
      gameStats.fiveMatchesCompleted = true;
      gameStats.numCoins += 200;
      await gameStats.save();

      return res.status(200).json({ message: 'Five matches completed and rewarded with 200 coins', numCoins: 200, fiveMatchesCompleted: true });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If the player has played for 60 minutes since their last reward, reward them with 6 coins, update the lastRewardTime variable, and set sixtyMinitComplete to true
    if (playMinit >= 60) {

      // Check if the player has already been rewarded for today      
      if (gameStats.lastRewardTime && gameStats.lastRewardTime >= today) {
        return res.status(403).json({ message: 'Already rewarded today' });
      }

      gameStats.lastRewardTime = new Date();
      gameStats.numCoins += 6;
      gameStats.sixtyMinitComplete = true;
      await gameStats.save();

      return res.status(200).json({ message: 'Played for 60 minutes and rewarded with 6 coins', numCoins: 6, sixtyMinitComplete: true, fiveMatchesCompleted: gameStats.fiveMatchesCompleted });
    }

    await gameStats.save();
    // If neither condition is met, send a 403 error response
    return res.status(403).json({ message: 'Complete at least 5 matches or play for at least 60 minutes to receive rewards.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});





// Endpoint for tracking Enemies Killing
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


// Endpoint for rewarding winning team players
app.post('/rewardWinningPlayers', async (req, res) => {
  const { userId, walletAddress } = req.body;

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

    // If the player is on the winning team, reward them with 5 coins
      gameStats.numCoins += 5;
      await gameStats.save();
      // Send a success response
      return res.status(200).json({ message: 'Rewarded with 5 coins for winning', numCoins: gameStats.numCoins });
    

    // If the player is not on the winning team, send a 403 error response
    return res.status(403).json({ message: 'Not on the winning team' });
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
    