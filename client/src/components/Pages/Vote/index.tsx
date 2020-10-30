import React, { useEffect, useState } from "react";
import { useParams, useHistory } from 'react-router-dom';
import Spinner from "../../Spinner";
import "./vote.css";
import { useReactOidc } from "@axa-fr/react-oidc-context";

type RouteParams = {
  voteId: string
}
type Poll = {
  _id: string,
  title: string,
  choices: Array<string>,
}

export const Vote: React.FunctionComponent = () =>{
  const { voteId } = useParams<RouteParams>();
  const [poll, setPoll] = useState<Poll|undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selected, setSelected] = useState<number|null>(null);
  const { oidcUser } = useReactOidc();

  let history = useHistory();

  useEffect(() => {
    fetch("http://localhost:5000/api/getPollDetails", {
      headers: new Headers({
        'Authorization': 'Bearer ' + oidcUser.access_token,
        "content-type": "application/json"
      }),
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
  }, [voteId])

      function buttonClick(idx:number|null) {
        if (idx !== null) {
          fetch("http://localhost:5000/api/sendVote", {
            headers: new Headers({
              'Authorization': 'Bearer ' + oidcUser.access_token,
              "content-type": "application/json"
            }),
            method: "POST",
            body: JSON.stringify({"voteId": voteId, "voteChoice": idx})
          })
              .then((res) => {
                switch(res.status) {
                  case 204:
                      history.push("/result/" + voteId)
                      return;
                  default:
                    throw new Error("Error Voting");
                }
              })
              .catch((error) => {
                history.push("/result/" + voteId)

                // setLoading(false);
                // setError(true);
                // console.log(error);
              });
        } 
      }
  return(
    loading ? <Spinner className="vote"></Spinner> :
      error ? <div>Something went wrong : (</div> :
        poll === undefined ? 
      <div>Poll not found : (</div> :
        <div>
        <div className="poll-option-list">
          <div className="poll-name-title-panel">{poll.title}</div>
          <div className="poll-options-items">
          {poll.choices.map(function(option, idx){
            return (<li key={idx}><button onClick={() => setSelected(idx)} className="btn btn-primary poll-option-button">{option}</button></li>)
            })}
          </div>
        </div>
        <div>
          <div className="option-selected-box">
          <div className="option-selected-text"> You have selected: <b>{ selected !== null ? poll.choices[selected] : null}</b> </div>
          <button 
            onClick={() => buttonClick(selected)} 
            className="btn btn-primary submit-button"
            disabled={selected===null}>Submit Vote</button>
          </div>
        </div>
        </div>
  )
}

export default Vote;
