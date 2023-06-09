const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const moment = require("moment");

// Set up the MongoDB connection string
mongoose
  .connect(
    "mongodb+srv://pkrhtdm:987654321.0@hypermovegame.loejrx2.mongodb.net/HypermoveGame"
  )
  .then(() => {
    console.log("Mongoose connected");
  });
function sameDay(d1, d2) {
  if (!d1 || !d2) {
    return false;
  }

  d1 = new Date(d1);
  d2 = new Date(d2);
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
  numCoins: { type: Number, default: 0 },
  matchCount: { type: Number, default: 0 },
  matchesCompleted: Boolean,
  todayPlayMinutes: { type: Number, default: 0 },
  totalPlayMinutes: { type: Number, default: 0 },
  totalKills: { type: Number, default: 0 },
  totalHeadshots: { type: Number, default: 0 },
  killCount: { type: Number, default: 0 },
  headShotCount: { type: Number, default: 0 },
  fiveMatchesCompleted: Boolean,
  sixtyMinitComplete: Boolean,
  isWinner: Boolean,
  lastKillsRewardTime: Date,
  lastHeadshotsRewardTime: Date,
  last60MinuteReward: Date,
  todayDate: { type: Date, default: new Date() },
  todayDate2: { type: Date, default: new Date() },
  todayDate3: { type: Date, default: new Date() },
  headshotClaimStatus: {
    type: String,
    enum: ["true", "false", "complete"],
    default: "false",
  },
  totalKillClaimStatus: {
    type: String,
    enum: ["true", "false", "complete"],
    default: "false",
  },
  totalTimeClaimStatus: {
    type: String,
    enum: ["true", "false", "complete"],
    default: "false",
  },
  rewardDate: {
    type: Date,
    default: new Date(),
  },
});

// Create a model for the GameStats collection
const GameStats = mongoose.model("GameStats", gameStatsSchema, "PlayersData");
// Set up the API endpoints
const app = express();
app.use(bodyParser.json());

// Endpoint for saving wallet address
app.post("/saveWalletAddress", async (req, res) => {
  // console.log(req.body);
  // const { userId, walletAddress } = req.body;

  // try {
  //   // Check if the userId is already in the database
  //   const existingUser = await GameStats.findOne({ userId });
  //   const existingWallet = await GameStats.findOne({ walletAddress });
  //   if (existingUser || existingWallet) {
  //     res.status(200).json({
  //       message: "User/Wallet already exists",
  //       walletAddress: walletAddress,
  //     });
  //   }

  //   // Check if the wallet address is already in the database
  //   /* const existingWallet = await GameStats.findOne({ walletAddress });
  //   if (existingWallet) {
  //     return res.status(403).json({ message: "Wallet address already exists" });
  //   } */

  //   // Create a new game stats document for the user
  //   const newGameStats = new GameStats({
  //     userId,
  //     walletAddress,
  //     coinRewarded: false,
  //     numCoins: 0,
  //     matchCount: 0,
  //     matchesCompleted: false,
  //     todayPlayMinutes: 0,
  //     killCount: 0,
  //     headShotCount: 0,
  //     totalHeadshots: 0,
  //     todayDate: new Date(),
  //   });

  //   // Save the new game stats document to the database
  //   await newGameStats.save();

  //   // Reward the player with 150 coins and set the coinRewarded flag to true on the server
  //   newGameStats.numCoins += 150;
  //   newGameStats.coinRewarded = true;
  //   await newGameStats.save();

  //   // Return a success message and the updated game stats
  //   return res.status(200).json({
  //     message: "Wallet address saved successfully",
  //     numCoins: newGameStats.numCoins,
  //     coinRewarded: newGameStats.coinRewarded,
  //   });
  // } catch (error) {
  //   console.error(error);
  //   return res.status(500).json({ message: "Internal server error" });
  // }
  try {
    const { userId, walletAddress } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: "failed",
        message: "Please provide  User ID",
      });
    }

    // User Exist or Not
    const existingUser = await GameStats.findOne({ userId });

    if (existingUser) {
      return res.status(200).json({
        message: "Wallet Address Found",
        walletAddress: existingUser.walletAddress,
      });
    } else {
      if (!walletAddress) {
        return res.status(400).json({
          status: "failed",
          message: "Please provide wallet address",
        });
      }
      const checkWalletAddress = await GameStats.findOne({ walletAddress });
      if (checkWalletAddress) {
        return res.status(200).json({
          message: "This wallet Address is used by another user",
          walletAddress: checkWalletAddress.walletAddress,
        });
      }
      const newGameStats = new GameStats({
        userId: userId,
        walletAddress: walletAddress,
        coinRewarded: false,
        numCoins: 0,
        matchCount: 0,
        matchesCompleted: false,
        todayPlayMinutes: 0,
        killCount: 0,
        headShotCount: 0,
        totalHeadshots: 0,
        todayDate: new Date(),
      });
      // Save the new game stats document to the database
      // await newPlayersData.save();

      // Reward the player with 150 coins and set the coinRewarded flag to true on the server
      newGameStats.numCoins += 150;
      newGameStats.coinRewarded = true;

      // console.log("newPlayersData", newPlayersData);

      await newGameStats.save();

      return res.status(200).json({
        message: "Wallet address saved successfully",
        numCoins: newGameStats.numCoins,
        coinRewarded: newGameStats.coinRewarded,
        walletAddress: walletAddress,
        userId: userId,
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", err: err });
  }
});

// Endpoint for tracking Five Matches
app.post("/trackFiveMatches", async (req, res) => {
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
    gameStats.matchCount += 1;
    await gameStats.save();
    if (gameStats.matchCount >= 5 && !gameStats.fiveMatchesCompleted) {
      gameStats.fiveMatchesCompleted = true;
      gameStats.numCoins += 200;
      await gameStats.save();
      return res.status(200).json({
        message: "Five matches completed and rewarded with 200 coins",
        numCoins: 200,
        fiveMatchesCompleted: true,
      });
    }

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

// Endpoint for tracking Sixty Minutes GamePlay
app.post("/trackSixtyMinutes", async (req, res) => {
  const { userId, walletAddress, playMinit: todayPlayMinutes } = req.body;
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
    gameStats.totalPlayMinutes += todayPlayMinutes;
    if (sameDay(new Date(gameStats.todayDate), new Date())) {
      gameStats.todayPlayMinutes += todayPlayMinutes;
    } else {
      gameStats.todayPlayMinutes = todayPlayMinutes;
      gameStats.todayDate = new Date();
    }
    await gameStats.save();
    // If the player has played for 60 minutes today and hasnt been rewarded already,then reward them with 6 coins
    if (gameStats.todayPlayMinutes >= 60) {
      // Check if the player has already been rewarded for today
      if (
        gameStats.last60MinuteReward &&
        sameDay(gameStats.last60MinuteReward, new Date())
      ) {
        // for the case where 60 minute reward has been given but 5 matches completed
        return res.status(403).json({ message: "Already rewarded today" });
      }

      gameStats.last60MinuteReward = new Date();
      gameStats.numCoins += 6;
      gameStats.sixtyMinitComplete = true;
      await gameStats.save();

      return res.status(200).json({
        message: "Played for 60 minutes and rewarded with 6 coins",
        numCoins: 6,
        sixtyMinitComplete: true,
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
app.post("/trackHundredKills", async (req, res) => {
  const { userId, walletAddress, killCount } = req.body;

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
    gameStats.totalKills += killCount;
    // check if new days has started, if yes then reset the fields
    if (!sameDay(new Date(), gameStats.todayDate2)) {
      console.log("same day", { killCount });
      gameStats.todayDate2 = new Date();
      gameStats.killCount = killCount;
    } else {
      console.log("not sameday", { killCount });
      gameStats.killCount += killCount;
    }
    await gameStats.save();
    console.log(gameStats.killCount);
    // if user is not eligible for none of rewards,send 403
    if (gameStats.killCount < 100) {
      return res.status(403).json({
        message: "Less than 100 enemies killed!",
      });
    }
    if (sameDay(gameStats.lastKillsRewardTime, new Date())) {
      return res.status(403).json({
        message: "Already rewarded for today!",
      });
    }
    // if total kills for the day are 100+ and no reward was given today
    if (
      gameStats.killCount >= 100 &&
      !sameDay(gameStats.lastKillsRewardTime, new Date())
    ) {
      gameStats.lastKillsRewardTime = new Date();
      await gameStats.save();
      return res.status(200).json({
        message: "Rewarded with 10 coins",
        numCoins: 10,
        killedHundred: true,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
// Endpoint for tracking Enemies Killing
app.post("/trackTwentyFiveHeadshots", async (req, res) => {
  const { userId, walletAddress, headShotCount } = req.body;

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
    gameStats.totalHeadshots += headShotCount;
    // check if new days has started, if yes then reset the fields
    if (!sameDay(new Date(), gameStats.todayDate3)) {
      (gameStats.todayDate3 = new Date()),
        (gameStats.headShotCount = headShotCount);
    } else {
      gameStats.headShotCount += headShotCount;
    }
    await gameStats.save();
    // if user is not eligible for none of rewards,send 403
    if (gameStats.headShotCount < 25) {
      return res.status(403).json({
        message: "Less than 25 headshots!",
      });
    }
    if (sameDay(gameStats.lastHeadshotsRewardTime, new Date())) {
      return res.status(403).json({
        message: "Already rewarded for today!",
      });
    }
    // if total kills for the day are 100+ and no reward was given today
    gameStats.lastHeadshotsRewardTime = new Date();
    await gameStats.save();
    return res.status(200).json({
      message: "Rewarded with 5 coins",
      numCoins: 5,
      headShotKilled: true,
    });
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
app.get("/", async (req, res) => {
  res.send(await GameStats.find({}));
});
app.get("/date", async (req, res) => {
  res.send(
    await GameStats.updateMany({
      todayDate: "2023-04-20T16:34:35.582Z",
      todayDate2: "2023-04-20T16:34:35.582Z",
      todayDate3: "2023-04-20T16:34:35.582Z",
      lastHeadshotsRewardTime: "2023-04-20T16:32:19.034Z",
      lastKillsRewardTime: "2023-04-20T16:34:36.150Z",
      last60MinuteReward: "2023-04-20T16:33:40.887Z",
    })
  );
});

// app.get("/getWalletAddress", async (req, res) => {
//   try {
//     // const data = req.body;
//     const data = await GameStats.findOne(req.body);
//     console.log(data);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       message: "Internal Server Error",
//     });
//   }
// });
app.delete("/", async (req, res) => {
  res.send(await GameStats.deleteMany({}));
});

app.post("/today-reward", async (req, res) => {
  try {
    if (!req.body.userId) {
      return res.status(404).json({ message: "please provide UserID" });
    }
    let data = await GameStats.findOne({ userId: req.body.userId });
    let existingRewardDate = moment(data.rewardDate);
    let dif = moment().diff(existingRewardDate, "hours");
    console.log(dif);
    if (dif >= 24) {
      await GameStats.updateOne(
        { userId: req.body.userId },
        {
          $set: {
            totalKillClaimStatus: "false",
            headshotClaimStatus: "false",
            totalTimeClaimStatus: "false",
            killCount: 0,
            todayPlayMinutes: 0,
            headShotCount: 0,
            rewardDate: new Date(),
          },
        }
      );
    }
    let rewardData = await GameStats.aggregate([
      {
        $match: { userId: req.body.userId },
      },
      {
        $facet: {
          hundredKill: [
            {
              $addFields: {
                taskId: 1,
                coins: 10,
                task_name: "100 Kills",
                status: "$totalKillClaimStatus",
              },
            },
            {
              $project: {
                taskId: 1,
                task_name: 1,
                _id: 1,
                userId: 1,
                walletAddress: 1,
                status: 1,
                coins: 1,
              },
            },
          ],
          twentyFiveHeadShots: [
            {
              $addFields: {
                taskId: 2,
                coins: 5,
                task_name: "25 Head Shots",
                status: "$headshotClaimStatus",
              },
            },
            {
              $project: {
                taskId: 1,
                _id: 1,
                task_name: 1,
                userId: 1,
                walletAddress: 1,
                status: 1,
                coins: 1,
              },
            },
          ],
          totalSpendTime: [
            {
              $addFields: {
                taskId: 3,
                coins: 6,
                task_name: "Play For 1 Hour",
                status: "$totalTimeClaimStatus",
              },
            },
            {
              $project: {
                taskId: 1,
                _id: 1,
                userId: 1,
                walletAddress: 1,
                coins: 1,
                status: 1,
                task_name: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          data: {
            $concatArrays: [
              "$hundredKill",
              "$twentyFiveHeadShots",
              "$totalSpendTime",
            ],
          },
        },
      },
    ]);

    res.status(200).json({
      data: rewardData[0].data,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
      err: err,
    });
  }
});

app.post("/update-reward-status", async (req, res) => {
  try {
    let { userId, taskId, status } = req.body;
    console.log(req.body);
    if (!userId || !taskId) {
      return res.status(400).json({
        status: "failed",
        message: "Please provide User Id and Task Id",
      });
    }

    let data = await GameStats.findOne({ userId: userId });
    let taskStatus = "false";
    if (taskId === 1) {
      taskStatus = data.killCount >= 100 ? "complete" : "true";
      await GameStats.updateOne(
        { userId: userId },
        { $set: { totalKillClaimStatus: taskStatus } }
      );
    } else if (taskId === 2) {
      taskStatus = data.headShotCount >= 25 ? "complete" : "true";
      await GameStats.updateOne(
        { userId: userId },
        { $set: { headshotClaimStatus: taskStatus } } // headshotClaimStatus
      );
    } else {
      // let existingRewardDate = moment(data.rewardDate);
      // let dif = moment().diff(existingRewardDate, "hours");

      taskStatus = data.sixtyMinitComplete == true ? "complete" : "true";
      await GameStats.updateOne(
        { userId: userId },
        { $set: { totalTimeClaimStatus: taskStatus } }
      );
    }
    res.status(200).json({
      status: "success",
      message: "Reward Status Change Successfully.",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: "failed", message: "Internal Server Error" });
  }
});
// app.post("/")
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
