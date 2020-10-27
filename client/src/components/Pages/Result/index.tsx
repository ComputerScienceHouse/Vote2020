import React, { useEffect, useState } from "react";
import { useParams, useHistory } from 'react-router-dom';
import Spinner from "../../Spinner";
import "./result.css";

type RouteParams = {
  voteId: string
}

type Poll = {
  name: string,
  results: Object
}

export const Result: React.FunctionComponent = () =>{
  const { voteId } = useParams<RouteParams>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [poll, setPoll] = useState<Poll|undefined>(undefined);
  const [ended, setEnded] = useState(false);
  const evals = true;
  let history = useHistory();

  useEffect(() => {
    const interval = setInterval(() => {
        if(!ended) {
        fetch("http://localhost:5000/api/getCount", {
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
                setPoll(result)
                console.log(result)
              },
              (error) => {
                setLoading(false);
                setError(true);
                console.log(error);
              });
            }
    }, 10000);
    return () => clearInterval(interval);
  }, [voteId, ended]);

  useEffect(() => {
    fetch("http://localhost:5000/api/getCount", {
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
          setPoll(result)
          console.log(result)
        },
        (error) => {
          setLoading(false);
          setError(true);
          console.log(error);
        });
  }, [voteId])

  function endVoting() {
    if(window.confirm("End Voting?")){
      setLoading(true)
      fetch("http://localhost:5000/api/endPoll", {
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
          setPoll(result)
          setEnded(true)
          console.log(result)
        },
        (error) => {
          setLoading(false);
          setError(true);
          console.log(error);
        });
    }
  }

  return(
    loading ? <Spinner className="vote"></Spinner> :
      error ? <div>Something went wrong : (</div> :
        poll === undefined ? 
      <div>Poll not found : (</div> :
        <div>
        <div className="result-list">
            <div className="result-title-panel">{poll.name} {ended ? "Final" : null} Results </div>
            <div>
            {ended? null :<div className="refresh-message">These are refreshed every 10 seconds</div>}
            <div className="result-list-items">
            {Object.entries(poll.results).map(function(option, idx){
                return (<li key={idx}>{option[0]} : {option[1]}</li>)
            })}
            </div>
            </div>
            </div>
            <div className="exit-button">
            {evals && !ended ? <button className="btn btn-danger" onClick={() => endVoting()}>End Voting</button> : <button 
            onClick={() => history.push("/")} 
            className="btn btn-primary submit-button"
            >Exit</button>}
            </div>
        
        </div>
  )
}

export default Result;
