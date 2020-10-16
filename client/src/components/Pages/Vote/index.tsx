import React from "react";
import { useParams } from 'react-router-dom';

type RouteParams = {
  voteId: string
}


export const Vote: React.FunctionComponent = () =>{
  const { voteId } = useParams<RouteParams>();
  fetch("http://localhost:5000/api/getPollDetails", {
    headers: {"content-type": "application/json"},
    method: "POST",
    body: JSON.stringify({"voteId": "1"})
  })
      .then(res => res.json())
      .then((result) => {
        console.log(result)
      },
      (error) => {
        console.log(error);
      });
  return <div>{`Vote page! ${voteId}`}</div>
}

export default Vote;
