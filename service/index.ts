import * as express from "express";
import * as path from "path";
import * as cors from "cors";
import {insertPoll, insertVote} from "./database";
var MongoClient = require('mongodb').MongoClient
import * as dotenv from 'dotenv';
var ObjectID = require('mongodb').ObjectID;

dotenv.config();

let db = null;

MongoClient.connect(process.env.DB_URL, function (err, client) {
    if (err) throw(err)
    db = client.db("vote")
})

const app = express();

app.use(cors());
app.use(express.json());

let currentPolls = [
    {   title: 'test Poll',
        choices: ["fail", "conditional", "abstain"],
        type: 'FailConditional',
        _id: "5f9b2d5d601e1c6971430638" }
];

const sampleCount = {
    "name": "Potate's Vote",
    "results": {"option1": 1, "option2": 2, "option3": 0} 
}

app.use(express.static(path.join(__dirname, "/../build")));

// Returns list of all current polls
app.get("/api/getCurrentPolls", (req,res) => {
    res.json(currentPolls);
});

app.post("/api/getPollDetails", (req,res) => {
    const poll = currentPolls.find(x => x._id === req.body.voteId);
    if (poll) {
        res.json(poll)
    } else {
        res.status(404).send();
    }
});

// Send in a client's vote, called from any voting screen
app.post("/api/sendVote", (req,res) => {
    //TODO - replace this with the actual vote request
    //need to get the userName from oidc
    const vote = {
        time: new Date(),
        userName: "rebeccas",
        choice: "abstain",
        poll: ObjectID.createFromHexString("5f9b2d5d601e1c6971430638")
    }
    const findData = {
        userName: "rebeccas",
        poll: ObjectID.createFromHexString("5f9b2d5d601e1c6971430638")
    }


    const collection = db.collection("Votes");

    collection.findOne(findData).then(hasVoted => {
        if(hasVoted) {
            res.status(400).send();
        } else { 
            collection.insert(vote, function(err,docsInserted){
            res.status(204).send();
            });
        }
    })
});

// Initialize a poll/vote, called from eval's init screen 
app.post("/api/initializePoll", (req,res) => {
    const newPoll = {
        "_id": null,
        "title": req.body.title,
        "choices": req.body.options,
        "type": req.body.type,
        "time": new Date()
    }
    const collection = db.collection("Polls")
        collection.insert(newPoll, function(err,docsInserted){
            newPoll._id = newPoll._id.toHexString();
        });
    currentPolls.push(newPoll);
    res.json({"pollId": newPoll._id});
});

// get the count without ending the poll
app.post("/api/getCount", (req,res) => {
    const count = {name: "", results:{}}
    const pollCollection = db.collection("Polls")
    pollCollection.findOne({"_id": ObjectID.createFromHexString(req.body.voteId)}).then(poll => {
        count.name = poll.title;
    });
    const collection = db.collection("Votes")
    collection.find({"poll": ObjectID.createFromHexString(req.body.voteId)}).toArray(function(err, result) {
        if (err) throw err;
        result.forEach(element => {
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
app.post("/api/endPoll", (req,res) => {
    var removeIndex = currentPolls.map(item => item._id)
                       .indexOf(req.body.voteId);
    ~removeIndex && currentPolls.splice(removeIndex, 1);

    const count = {name: "", results:{}}
    const pollCollection = db.collection("Polls")
    pollCollection.findOne({"_id": ObjectID.createFromHexString(req.body.voteId)}).then(poll => {
        count.name = poll.title;
    });
    const collection = db.collection("Votes")
    collection.find({"poll": ObjectID.createFromHexString(req.body.voteId)}).toArray(function(err, result) {
        if (err) throw err;
        result.forEach(element => {
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

app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+"/../build/index.html"));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log("App is listening on port " + port);
