import * as express from "express";
import * as path from "path";
import * as cors from "cors";

const app = express();
// let allowedOrigins = ['http://localhost:3000'];

app.use(cors());

let currentPolls = [{"id": 1, "name": "eat a whole cake conditional", "voteOptions": ["eat 1 cake","eat 2 cakes", "eat no cakes : ("]},
{"id": 2, "name": "fail chad", "voteOptions": ["fail", "conditional", "abstain"]}
];

app.use(express.static(path.join(__dirname, "/../build")));

// Returns list of all current polls
app.get("/api/getCurrentPolls", (req,res) => {
    res.json(currentPolls);
});

// Send in a client's vote, called from any voting screen
app.get("/api/sendVote", (req,res) => {
    res.status(204).send();
});

// Initialize a poll/vote, called from eval's init screen 
app.get("/api/initializePoll", (req,res) => {
    res.json({"pollId": "test"});
});

// get the count without ending the poll
app.get("/api/getCount", (req,res) => {
    res.json({"countYes": 1, "countNo": 2, "countAbstain": 0, "totalCount": 3});
});

// end the poll and get the final results, called from evals view  
app.get("/api/endPoll", (req,res) => {
    res.json({"countYes": 1, "countNo": 2, "countAbstain": 0, "totalCount": 3});
});
/**
 *  TODO - what other endpoints will we need? 
 * Will Evals need to get a list of all who voted (to poke people if they're slow)?
 */
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+"/../build/index.html"));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log("App is listening on port " + port);
