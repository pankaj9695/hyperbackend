const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// Set up the MongoDB connection string
mongoose.connect(
  "mongodb+srv://pkrhtdm:987654321.0@hypermovegame.loejrx2.mongodb.net/HypermoveGame"
).then(()=>{console.log("Mongoose connected")});
function sameDay(d1, d2) {
  return false
  if(!d1 || !d2){
    return false;
  }
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
// Create a schema for the GameStats collection
const gameStatsSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
  },
  walletAddress: {
    type: String,
    unique: true,
  },
  coinRewarded: Boolean,
  numCoins: Number,
  matchCount: Number,
  matchesCompleted: Boolean,
  todayPlayMinutes: {type:Number,default:0},
  totalPlayMinutes: {type:Number,default:0},
  totalKills: {type:Number,default:0},
  totalHeadshots: {type:Number,default:0},
  killCount: Number,
  headShotCount: Number,
  fiveMatchesCompleted: Boolean,
  sixtyMinitComplete: Boolean,
  isWinner: Boolean,
  lastKillsRewardTime: Date,
  lastHeadshotsRewardTime: Date,
  last60MinuteReward:Date,
  todayDate: { type: Date, default: new Date() },
});

// Create a model for the GameStats collection
const GameStats = mongoose.model("GameStats", gameStatsSchema, "PlayersData");
// GameStats.deleteMany({}).then(console.log)
// Set up the API endpoints
const app = express();
app.use(bodyParser.json());

// Endpoint for saving wallet address
app.post("/saveWalletAddress", async (req, res) => {
  console.log(req.body);
  const { userId, walletAddress } = req.body;

  try {
    // Check if the userId is already in the database
    const existingUser = await GameStats.findOne({ userId });
    if (existingUser) {
      return res.status(403).json({ message: "User already exists" });
    }

    // Check if the wallet address is already in the database
    const existingWallet = await GameStats.findOne({ walletAddress });
    if (existingWallet) {
      return res.status(403).json({ message: "Wallet address already exists" });
    }

    // Create a new game stats document for the user
    const newGameStats = new GameStats({
      userId,
      walletAddress,
      coinRewarded: false,
      numCoins: 0,
      matchCount: 0,
      matchesCompleted: false,
      todayPlayMinutes: 0,
      killCount: 0,
      headShotCount: 0,

      todayDate: new Date(),
    });

    // Save the new game stats document to the database
    await newGameStats.save();

    // Reward the player with 150 coins and set the coinRewarded flag to true on the server
    newGameStats.numCoins += 150;
    newGameStats.coinRewarded = true;
    await newGameStats.save();

    // Return a success message and the updated game stats
    return res.status(200).json({
      message: "Wallet address saved successfully",
      numCoins: newGameStats.numCoins,
      coinRewarded: newGameStats.coinRewarded,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint for tracking game stats
app.post("/trackGameStats", async (req, res) => {
  const { userId, walletAddress, playMinit:todayPlayMinutes } = req.body;
  // Validate that userId and walletAddress are both provided
  if (!userId || !walletAddress) {
    return res.status(400).json({ message: "userId or walletAddress missing" });
  }

  try {
    // Find the existing game stats document for the user
    const gameStats = await GameStats.findOne({ walletAddress });

    // If the user has no existing game stats document, return an error response
    if (!gameStats) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    gameStats.matchCount += 1;
    gameStats.totalPlayMinutes += todayPlayMinutes
// if not same day,then reset fields
    if (sameDay(new Date(gameStats.todayDate), new Date())) {
      gameStats.todayPlayMinutes += todayPlayMinutes;
    } else {
      gameStats.todayPlayMinutes = todayPlayMinutes;
      gameStats.todayDate = new Date();
    }
    await gameStats.save();
    let numCoinsToBeRewarded = 0;
    if (gameStats.matchCount >= 5 && !gameStats.fiveMatchesCompleted) {
      gameStats.fiveMatchesCompleted = true;
      gameStats.numCoins += 200;
      await gameStats.save();
      numCoinsToBeRewarded += 200;
    }
    // If the player has played for 60 minutes today and hasnt been rewarded already,then reward them with 6 coins
    if (gameStats.todayPlayMinutes >= 60) {
      // Check if the player has already been rewarded for today
      if (gameStats.last60MinuteReward && sameDay(gameStats.last60MinuteReward,new Date()) ) {
        // for the case where 60 minute reward has been given but 5 matches completed
        if (numCoinsToBeRewarded) {
          return res.status(200).json({
            message: "Five matches completed and rewarded with 200 coins",
            numCoins: 200,
            fiveMatchesCompleted: true,
          });
        }
        return res.status(403).json({ message: "Already rewarded today" });
      }

      gameStats.last60MinuteReward = new Date();
      gameStats.numCoins += 6;
      gameStats.sixtyMinitComplete = true;
      numCoinsToBeRewarded += 6;
      await gameStats.save();

      if (numCoinsToBeRewarded === 206) {
        return res.status(200).json({
          message:
            "Played for 60 minutes & completed 5 matches.Rewarded with 206 coins",
          numCoins: 206,
          sixtyMinitComplete: true,
        });
      }
      return res.status(200).json({
        message: "Played for 60 minutes and rewarded with 6 coins",
        numCoins: 6,
        sixtyMinitComplete: true,
      });
    }
    else if (numCoinsToBeRewarded===200) {
      return res.status(200).json({
        message: "Five matches completed and rewarded with 200 coins",
        numCoins: 200,
        fiveMatchesCompleted: true,
      });
    }

    await gameStats.save();
    // If neither condition is met, send a 403 error response
    return res.status(403).json({
      message:
        "Complete at least 5 matches or play for at least 60 minutes to receive rewards.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint for tracking Enemies Killing
app.post("/trackEnemiesKilled", async (req, res) => {
  const { userId, walletAddress, killCount, headShotCount } = req.body;

  // Validate that userId and walletAddress are both provided
  if (!userId || !walletAddress) {
    return res.status(400).json({ message: "userId or walletAddress missing" });
  }

  try {
    // Find the existing game stats document for the user
    const gameStats = await GameStats.findOne({ walletAddress });

    // If the user has no existing game stats document, return an error response
    if (!gameStats) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    gameStats.totalHeadshots += headShotCount
    gameStats.totalKills += killCount
    // check if new days has started, if yes then reset the fields
    if(!sameDay(new Date(),gameStats.todayDate)){
        gameStats.todayDate = new Date(),
        gameStats.headShotCount = headShotCount
        gameStats.killCount = killCount
    }
    else{
      gameStats.headShotCount += headShotCount;
      gameStats.killCount += killCount;
    }
    await gameStats.save()
    // if user is not eligible for none of rewards,send 403 
    if (gameStats.killCount <= 100 && gameStats.headShotCount <= 25) {
      return res.status(403).json({
        message: "Less than 100 enemies killed or Less than 25 headshots",
      });
    }

    numCoinsToBeRewarded=0
    // if total headshots for the day are 25+ and no reward was given today
    if(gameStats.headShotCount >= 25 && !sameDay(gameStats.lastHeadshotsRewardTime , new Date())){
      numCoinsToBeRewarded+=5
      gameStats.lastHeadshotsRewardTime = new Date()
    }
    // if total kills for the day are 100+ and no reward was given today

    if(gameStats.killCount >= 100 && !sameDay(gameStats.lastKillsRewardTime , new Date())){
      numCoinsToBeRewarded+=10
      gameStats.lastKillsRewardTime = new Date()
    }
    // if both rewards are rewarded already for the day
    if (numCoinsToBeRewarded ===0) {
      return res.status(200).json({ message: "Already rewarded today" });
    }

    gameStats.numCoins += numCoinsToBeRewarded;
    await gameStats.save();

    // Send a success response
    return res
      .status(200)
      .json({ message: "Rewarded with "+numCoinsToBeRewarded+" coins", numCoins: numCoinsToBeRewarded });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint for rewarding winning team players
app.post("/rewardWinningPlayers", async (req, res) => {
  const { userId, walletAddress } = req.body;

  // Validate that userId and walletAddress are both provided
  if (!userId || !walletAddress) {
    return res.status(403).json({ message: "userId or walletAddress missing" });
  }

  try {
    // Find the existing game stats document for the user
    const gameStats = await GameStats.findOne({ walletAddress });

    // If the user has no existing game stats document, return an error response
    if (!gameStats) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // If the player is on the winning team, reward them with 5 coins
    gameStats.numCoins += 5;
    await gameStats.save();
    // Send a success response
    return res
      .status(200)
      .json({ message: "Rewarded with 5 coins for winning", numCoins: 5 });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/",async(req,res)=>{
  res.send(await GameStats.find({}))
})
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
