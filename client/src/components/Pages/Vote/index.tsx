import React, { useEffect, useState } from "react";
import { useParams, useHistory } from 'react-router-dom';
import Spinner from "../../Spinner";

type RouteParams = {
  voteId: string
}
type Poll = {
  id: string,
  name: string,
  voteOptions: Array<string>,
}

export const Vote: React.FunctionComponent = () =>{
  const { voteId } = useParams<RouteParams>();
  const [poll, setPoll] = useState<Poll|undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  let history = useHistory();
  useEffect(() => {
    fetch("http://localhost:5000/api/getPollDetails", {
      headers: {"content-type": "application/json"},
      method: "POST",
      body: JSON.stringify({"voteId": voteId})
    })
        .then((res) => {
          switch(res.status) {
            case 200:
                return res.json()
            case 404:
                return undefined
            default:
              throw new Error("Error Getting Poll Details");
          }
        })
        .then((result) => {
          setLoading(false);
          setPoll(result);
        },
        (error) => {
          setLoading(false);
          setError(true);
          console.log(error);
        });
  }, [])


      function buttonClick(idx:number) {
        //TODO- have a vote confirmation page
        console.log(idx);
        fetch("http://localhost:5000/api/sendVote", {
          headers: {"content-type": "application/json"},
          method: "POST",
          body: JSON.stringify({"voteId": voteId, "voteChoice": idx})
        })
            .then((res) => {
              switch(res.status) {
                case 204:
                    //TODO- probably better to route to a "voted" screen than home
                    //but this is prob okay for mvp
                    history.push("/")
                    return;
                default:
                  throw new Error("Error Voting");
              }
            })
            .catch((error) => {
              setLoading(false);
              setError(true);
              console.log(error);
            });
      }
  return(
    loading ? <Spinner className="vote"></Spinner> :
      error ? <div>Something went wrong : (</div> :
        poll === undefined ? 
      <div>Poll not found : (</div> :
        <div>
          <div className="poll-name-title-panel">{poll.name}</div>
          <div className="poll-options-items">
          {poll.voteOptions.map(function(option, idx){
            return (<li key={idx}><button onClick={() => buttonClick(idx)} className="btn btn-primary">{option}</button></li>)
            })}
          </div>
        </div>
  )
}

export default Vote;
