var ObjectID = require('mongodb').ObjectID;

export function insertPoll(db, poll) {
    Promise.resolve(db).then((res) =>{
        const collection = res.collection("Polls")
        collection.insert(poll, function(err,docsInserted){
            console.log(poll._id);
            return(poll._id)
        });
    })
    }


export async function insertVote(db) {
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
    await Promise.resolve(db);
    const collection = db.collection("Votes")
    collection.findOne(findData).then(res => {
        if(res) {
            throw new Error("Already Voted");
        } else { 
            collection.insert(vote, function(err,docsInserted){
            console.log(docsInserted);
            });
        }
    }).catch(() => {
        return false;
    });
    return true;
}
