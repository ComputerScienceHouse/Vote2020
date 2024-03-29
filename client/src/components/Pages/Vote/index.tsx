import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import Spinner from "../../Spinner";
import "./vote.css";
import { useReactOidc } from "@axa-fr/react-oidc-context";

declare let process: {
  env: {
    REACT_APP_BASE_API_URL: string;
  };
};

type RouteParams = {
  voteId: string;
};

type Poll = {
  _id: string;
  title: string;
  choices: Array<string>;
  type: string;
};

class AuthError extends Error {
  public readonly name: string = "AuthError";
}

export const Vote: React.FunctionComponent = () => {
  const { voteId } = useParams<RouteParams>();
  const [poll, setPoll] = useState<Poll | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selected, setSelected] = useState<number | null>(null);
  const { oidcUser } = useReactOidc();

  const history = useHistory();

  useEffect(() => {
    fetch(process.env.REACT_APP_BASE_API_URL + "/api/getPollDetails", {
      headers: new Headers({
        Authorization: "Bearer " + oidcUser.access_token,
        "content-type": "application/json",
      }),
      method: "POST",
      body: JSON.stringify({ voteId: voteId }),
    })
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.json();
          case 404:
            return undefined;
          default:
            throw new Error("Error Getting Poll Details");
        }
      })
      .then(
        (result) => {
          setLoading(false);
          setPoll(result);
        },
        () => {
          setLoading(false);
          setError(true);
        }
      );
  }, [voteId, oidcUser.access_token]);

  function buttonClick(idx: number | null): void {
    if (idx !== null) {
      fetch(process.env.REACT_APP_BASE_API_URL + "/api/sendVote", {
        headers: new Headers({
          Authorization: "Bearer " + oidcUser.access_token,
          "content-type": "application/json",
        }),
        method: "POST",
        body: JSON.stringify({
          voteId: voteId,
          voteChoice: poll?.choices[idx],
        }),
      })
        .then((res) => {
          switch (res.status) {
            case 204:
              return;
            case 403:
              throw new AuthError("Unauthorized");
            default:
              throw new Error("Error Voting");
          }
        })
        .catch((error) => {
          if (error instanceof AuthError) {
            window.alert(error.message);
          } else {
            window.alert("An error occurred (You may have already voted)");
          }
        })
        .then(() => {
          history.push("/result/" + voteId);
        });
    }
  }
  return loading ? (
    <Spinner className="vote"></Spinner>
  ) : error ? (
    <div>Something went wrong : (</div>
  ) : poll === undefined ? (
    <div>Poll not found : (</div>
  ) : (
    <div>
      <div className="poll-option-list">
        <div className="poll-name-title-panel">{poll.title}</div>
        <div className="poll-options-items">
          {poll.choices.map(function (option, idx) {
            if (poll.type === "Conditional") {
              return (
                <li key={idx}>
                  <button
                    onClick={(): void => setSelected(idx)}
                    className="btn btn-primary poll-option-button btn-warning"
                  >
                    {option}
                  </button>
                </li>
              );
            }

            let btnClass = "btn btn-primary poll-option-button ";
            switch (option) {
              case "Pass":
                btnClass += "btn-success";
                break;
              case "Conditional":
                btnClass += "btn-warning";
                break;
              case "Fail or Conditional":
                btnClass += "btn-warning";
                break;
              case "Fail":
                btnClass += "btn-danger";
                break;
              case "Abstain":
                btnClass += "btn-secondary";
                break;
            }

            return (
              <li key={idx}>
                <button
                  onClick={(): void => setSelected(idx)}
                  className={btnClass}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </div>
      </div>
      <div>
        <div className="option-selected-box">
          <div className="option-selected-text">
            {" "}
            You have selected:{" "}
            <b>{selected !== null ? poll.choices[selected] : null}</b>{" "}
          </div>
          <button
            onClick={(): void => buttonClick(selected)}
            className="btn btn-primary submit-button"
            disabled={selected === null}
          >
            Submit Vote
          </button>
        </div>
      </div>
    </div>
  );
};

export default Vote;
