import * as express from "express";
import * as path from "path";
import * as cors from "cors";
import * as dotenv from "dotenv";

import { getUserInfo, requireVoting, requireEvals } from "./middleware";

var MongoClient = require("mongodb").MongoClient;

var ObjectID = require("mongodb").ObjectID;

dotenv.config();

MongoClient.connect(process.env.DB_URL, function (err, client) {
  if (err) throw err;
  const db = client.db("vote");

  // Only use the prod collections if we're set for production
  const coll_prefix = process.env.NODE_ENV === "production" ? "" : "dev-";
  const polls_collection = db.collection(`${coll_prefix}Polls`);
  const votes_collection = db.collection(`${coll_prefix}Votes`);

  // Logging to clarify what collections are being accessed
  if (coll_prefix === "") {
    console.log("Using prod db collections");
  } else {
    console.log(`Using collections with prefix '${coll_prefix}'`);
  }

  const passport = require("passport");

  const https = require("https");
  var url = require("url");

  var JwtStrategy = require("passport-jwt").Strategy,
    ExtractJwt = require("passport-jwt").ExtractJwt;

  const options = {
    hostname: "sso.csh.rit.edu",
    path: "/auth/realms/csh/.well-known/openid-configuration",
  };

  https.get(options, (res) => {
    res.setEncoding("utf8");
    res.on("data", function (chunk) {
      const jwks_uri = JSON.parse(chunk).jwks_uri;
      https.get(
        {
          hostname: url.parse(jwks_uri).hostname,
          path: url.parse(jwks_uri).pathname,
        },
        (res) => {
          res.setEncoding("utf8");
          res.on("data", function (chunk) {
            let secretOrKey = JSON.parse(chunk).keys[0].x5c[0];
            secretOrKey = secretOrKey.match(/.{1,64}/g).join("\n");
            secretOrKey = `-----BEGIN CERTIFICATE-----\n${secretOrKey}\n-----END CERTIFICATE-----\n`;
            var opts = {
              jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
              secretOrKey: secretOrKey,
              issuer: "https://sso.csh.rit.edu/auth/realms/csh",
            };
            passport.use(
              new JwtStrategy(opts, function (jwt_payload, done) {
                return done(null, jwt_payload);
              })
            );
          });
        }
      );
    });
  });

  // Configure Passport authenticated session persistence.
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });

  passport.deserializeUser((obj, cb) => {
    cb(null, obj);
  });

  const app = express();

  app.use(passport.initialize());

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "/../build")));
  app.use(cors());

  let currentPolls = [
    {
      title: "test Poll",
      choices: ["Fail", "Conditional", "Abstain"],
      type: "FailConditional",
      _id: "5f9b2d5d601e1c6971430638",
    },
  ];

  app.use("/", express.static(path.join(__dirname, "/../client/build/")));

  // Use apiRouter to apply common middleware across all the api routes
  const apiRouter = express.Router();
  apiRouter.use(passport.authenticate("jwt"));
  apiRouter.use(getUserInfo);
  apiRouter.use(requireVoting);

  // Returns list of all current polls
  apiRouter.get("/getCurrentPolls", (req, res) => {
    res.json(currentPolls);
  });

  apiRouter.post("/getPollDetails", (req, res) => {
    const poll = currentPolls.find((x) => x._id === req.body.voteId);
    if (poll) {
      res.json(poll);
    } else {
      res.status(404).send();
    }
  });

  // Send in a client's vote, called from any voting screen
  apiRouter.post("/sendVote", (req, res) => {
    const vote = {
      time: new Date(),
      userName: res.locals.userName,
      choice: req.body.voteChoice,
      poll: ObjectID.createFromHexString(req.body.voteId),
    };
    const findData = {
      userName: vote.userName,
      poll: vote.poll,
    };

    votes_collection.findOne(findData).then((hasVoted) => {
      if (hasVoted) {
        res.status(400).send();
      } else {
        votes_collection.insert(vote, function (err, docsInserted) {
          res.status(204).send();
        });
      }
    });
  });

  // Initialize a poll/vote, called from eval's init screen
  apiRouter.post("/initializePoll", requireEvals, (req, res) => {
    const newPoll = {
      _id: null,
      title: req.body.title,
      choices: req.body.options,
      type: req.body.type,
      time: new Date(),
    };
    polls_collection.insert(newPoll, function (err, docsInserted) {
      newPoll._id = newPoll._id.toHexString();
      currentPolls.push(newPoll);
      res.json({ pollId: newPoll._id });
    });
  });

  // get the count without ending the poll
  apiRouter.post("/getCount", (req, res) => {
    const count = { name: "", results: {} };
    polls_collection
      .findOne({ _id: ObjectID.createFromHexString(req.body.voteId) })
      .then((poll) => {
        count.name = poll.title;
      });
    votes_collection
      .find({ poll: ObjectID.createFromHexString(req.body.voteId) })
      .toArray(function (err, result) {
        if (err) throw err;
        result.forEach((element) => {
          const choice = element.choice;
          if (count.results[choice]) {
            count.results[choice] += 1;
          } else {
            count.results[choice] = 1;
          }
        });
        res.json(count);
      });
  });

  // end the poll and get the final results, called from evals view
  apiRouter.post("/endPoll", requireEvals, (req, res) => {
    let removeIndex = currentPolls
      .map((item) => item._id)
      .indexOf(req.body.voteId);
    ~removeIndex && currentPolls.splice(removeIndex, 1);

    const count = { name: "", results: {} };
    polls_collection
      .findOne({ _id: ObjectID.createFromHexString(req.body.voteId) })
      .then((poll) => {
        count.name = poll.title;
      });
    votes_collection
      .find({ poll: ObjectID.createFromHexString(req.body.voteId) })
      .toArray(function (err, result) {
        if (err) throw err;
        result.forEach((element) => {
          const choice = element.choice;
          if (count.results[choice]) {
            count.results[choice] += 1;
          } else {
            count.results[choice] = 1;
          }
        });
        res.json(count);
      });
  });

  app.use("/api", apiRouter);

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + "/../client/build/index.html"));
  });

  const port = process.env.PORT || 8080;
  app.listen(port);

  console.log("App is listening on port " + port);
});
