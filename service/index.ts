import * as express from "express";
import * as path from "path";
import * as cors from "cors";
import * as dotenv from "dotenv";
import { MongoClient, ObjectID } from "mongodb";
import * as passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import * as https from "https";
import * as url from "url";

import { getUserInfo, requireVoting, requireEvals } from "./middleware";
import { Poll, userCanVote } from "./util";

declare let process: {
  env: {
    NODE_ENV: string;
    DB_URL: string;
    PORT: number;
  };
};

declare let __dirname;

type NextFunc = () => void;

dotenv.config();

MongoClient.connect(process.env.DB_URL, function (err, client) {
  if (err) throw err;
  const db = client.db("vote");

  // Only use the prod collections if we're set for production
  const collPrefix = process.env.NODE_ENV === "production" ? "" : "dev-";
  const pollsCollection = db.collection(`${collPrefix}Polls`);
  const votesCollection = db.collection(`${collPrefix}Votes`);

  // Logging to clarify what collections are being accessed
  if (collPrefix === "") {
    console.log("Using prod db collections");
  } else {
    console.log(`Using collections with prefix '${collPrefix}'`);
  }

  const options = {
    hostname: "sso.csh.rit.edu",
    path: "/auth/realms/csh/.well-known/openid-configuration",
  };

  https.get(options, (res) => {
    res.setEncoding("utf8");
    res.on("data", function (chunk) {
      const jwksUri = JSON.parse(chunk).jwks_uri;
      https.get(
        {
          hostname: url.parse(jwksUri).hostname,
          path: url.parse(jwksUri).pathname,
        },
        (res) => {
          res.setEncoding("utf8");
          res.on("data", function (chunk) {
            let secretOrKey = JSON.parse(chunk).keys[0].x5c[0];
            secretOrKey = secretOrKey.match(/.{1,64}/g).join("\n");
            secretOrKey = `-----BEGIN CERTIFICATE-----\n${secretOrKey}\n-----END CERTIFICATE-----\n`;
            const opts = {
              jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
              secretOrKey: secretOrKey,
              issuer: "https://sso.csh.rit.edu/auth/realms/csh",
            };
            passport.use(
              new JwtStrategy(opts, function (jwtPayload, done) {
                return done(null, jwtPayload);
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

  const currentPolls: Poll[] = [
    {
      title: "test Poll",
      choices: ["Fail", "Conditional", "Abstain"],
      type: "FailConditional",
      _id: "5f9b2d5d601e1c6971430638",
      time: new Date(),
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
    res.json(
      currentPolls.map((poll: Poll) => {
        return {
          ...poll,
          canVote: userCanVote(res.locals.user, poll),
        } as Poll & { canVote: boolean };
      })
    );
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
  apiRouter.post(
    "/sendVote",
    (req, res, next: NextFunc) => {
      // Check there's a poll, and this user can vote on it
      res.locals.pollId = ObjectID.createFromHexString(req.body.voteId);

      pollsCollection.findOne({ _id: res.locals.pollId }).then((poll) => {
        if (!poll) {
          res.status(404).send();
          next();
        } else if (
          ["EboardOnly", "MajorProject"].includes(poll.type) &&
          !res.locals.user.isEboard
        ) {
          res.status(403).send();
        } else {
          // Only continue if the user can vote on this poll
          next();
        }
      });
    },
    (req, res) => {
      // Submit the vote
      const vote = {
        time: new Date(),
        userName: res.locals.user.userName,
        choice: req.body.voteChoice,
        poll: res.locals.pollId,
      };

      votesCollection
        .findOne({ userName: vote.userName, poll: vote.poll })
        .then((hasVoted) => {
          if (hasVoted) {
            res.status(400).send();
          } else {
            votesCollection.insert(vote, function (err) {
              if (err) {
                console.error(err);
                res.status(500).send();
              } else {
                res.status(204).send();
              }
            });
          }
        });
    }
  );

  // Initialize a poll/vote, called from eval's init screen
  apiRouter.post(
    "/initializePoll",
    requireEvals,
    (req, res, next: NextFunc) => {
      let newPoll = {
        _id: null,
        title: req.body.title,
        choices: req.body.options,
        type: req.body.type,
        time: new Date(),
      };
      pollsCollection.insert(newPoll, function (err, docsInserted) {
        if (err) {
          console.log(err);
          res.status(500).send();
          next();
        }
        console.log(`Poll inserted: ${docsInserted}`);
        newPoll._id = newPoll._id.toHexString();
        newPoll = newPoll as Poll;
        currentPolls.push(newPoll);
        res.json({ pollId: newPoll._id });
      });
    }
  );

  // get the count without ending the poll
  apiRouter.post("/getCount", (req, res) => {
    const count = { name: "", results: {} };
    pollsCollection
      .findOne({ _id: ObjectID.createFromHexString(req.body.voteId) })
      .then((poll) => {
        count.name = poll.title;
      });
    votesCollection
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
    const removeIndex = currentPolls
      .map((item) => item._id)
      .indexOf(req.body.voteId);
    ~removeIndex && currentPolls.splice(removeIndex, 1);

    const count = { name: "", results: {} };
    pollsCollection
      .findOne({ _id: ObjectID.createFromHexString(req.body.voteId) })
      .then((poll) => {
        count.name = poll.title;
      });
    votesCollection
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
