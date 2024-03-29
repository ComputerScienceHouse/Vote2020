import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import Spinner from "../../Spinner";
import "./create.css";
import { useReactOidc } from "@axa-fr/react-oidc-context";

declare let process: { env: { REACT_APP_BASE_API_URL: string } };

type PollType = { body: string; options: string[] };

export const Create: React.FunctionComponent = () => {
  const [pollType, setPollType] = useState("PassFail");
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState([
    "Pass",
    "Fail or Conditional",
    "Abstain",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { oidcUser } = useReactOidc();
  const evals = oidcUser.profile.groups.includes("eboard-evaluations");

  // List of poll types with custom options
  const customPolls = ["Conditional", "EboardOnly"];

  // Mapping of pollType to the display string and options
  const pollTypes: Record<string, PollType> = {
    PassFail: {
      body: "Pass / Fail",
      options: ["Pass", "Fail or Conditional", "Abstain"],
    },
    FailConditional: {
      body: "Fail / Conditional",
      options: ["Conditional", "Fail", "Abstain"],
    },
    Conditional: { body: "Conditional Poll", options: [""] },
    MajorProject: {
      body: "Major Project",
      options: ["Pass", "Fail", "Abstain"],
    },
    EboardOnly: { body: "Eboard Only Poll", options: [""] },
  };

  const history = useHistory();

  function handleChangePollTitle(
    changeEvent: React.FormEvent<HTMLInputElement>
  ): void {
    setPollTitle(changeEvent.currentTarget.value);
  }

  function handleSelectPollType(
    changeEvent: React.FormEvent<HTMLInputElement>
  ): void {
    setPollType(changeEvent.currentTarget.value);
    setPollOptions(pollTypes[changeEvent.currentTarget.value].options);
  }

  // The poll title form. This isn't a component function to avoid issues
  // with rerendering while typing
  const PollTitleForm = (
    <form>
      <label>Title:</label>
      <input
        className="title-input"
        type="text"
        onChange={handleChangePollTitle}
        placeholder="Vote Title"
      ></input>
    </form>
  );

  function PollTypeForm(props: {
    pollTypes: Record<string, PollType>;
  }): JSX.Element {
    return (
      <form className="type-form">
        <label>Type:</label>
        {Object.keys(props.pollTypes).map((typeName) => (
          <RadioButton
            key={typeName}
            value={typeName}
            body={props.pollTypes[typeName].body}
            changeFunc={handleSelectPollType}
            checkedFunc={(): boolean => pollType === typeName}
          />
        ))}
      </form>
    );
  }

  function RadioButton(props: {
    value: string;
    body: string;
    changeFunc: (event: React.FormEvent<HTMLInputElement>) => void;
    checkedFunc: () => boolean;
  }): JSX.Element {
    return (
      <div className="radio">
        <label>
          <input
            type="radio"
            value={props.value}
            onChange={props.changeFunc}
            checked={props.checkedFunc()}
          />
          {props.body}
        </label>
      </div>
    );
  }

  function handleChangeOption(
    changeEvent: React.FormEvent<HTMLInputElement>,
    idx: number
  ): void {
    const newPollOptions = [...pollOptions];
    newPollOptions[idx] = changeEvent.currentTarget.value;
    setPollOptions(newPollOptions);
  }

  function addOption(): void {
    const newPollOptions = [...pollOptions];
    newPollOptions.push("");
    setPollOptions(newPollOptions);
  }

  function removeOption(idx: number): void {
    const newPollOptions = [...pollOptions];
    newPollOptions.splice(idx, 1);
    setPollOptions(newPollOptions);
  }

  function buttonClick(): void {
    setLoading(true);
    const body = {
      title: pollTitle,
      options: pollOptions,
      type: pollType,
    };
    fetch(process.env.REACT_APP_BASE_API_URL + "/api/initializePoll", {
      headers: new Headers({
        Authorization: "Bearer " + oidcUser.access_token,
        "content-type": "application/json",
      }),
      method: "POST",
      body: JSON.stringify(body),
    })
      .then((res) => {
        switch (res.status) {
          case 200:
            return res.json();
          default:
            throw new Error("Error Creating Poll");
        }
      })
      .then((result) => {
        setLoading(false);
        history.push("/vote/" + result.pollId);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  }

  return loading ? (
    <Spinner className="vote"></Spinner>
  ) : error || !evals ? (
    <div>Something went wrong : (</div>
  ) : (
    <div>
      <div className="create-poll-box">
        <div className="create-poll-title-panel">Create Vote</div>
        <div className="poll-creation-items">
          {PollTitleForm}
          <PollTypeForm pollTypes={pollTypes} />
          {customPolls.includes(pollType) ? (
            <div>
              <form>
                <label>Enter Options:</label>
                {pollOptions.map(function (option, idx) {
                  return (
                    <li key={idx}>
                      <input
                        className="conditional-input"
                        type="text"
                        value={option}
                        onChange={(e): void => handleChangeOption(e, idx)}
                        placeholder="Conditional Option"
                      ></input>{" "}
                      <button
                        className="btn btn-danger delete-option-button"
                        type="button"
                        onClick={(): void => removeOption(idx)}
                      >
                        x
                      </button>
                    </li>
                  );
                })}
              </form>
              <button
                className="btn btn-secondary add-option-button"
                onClick={addOption}
              >
                Add Another Option
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="confirmation-box">
        <div className="confirmation-title">
          You are creating: <b>{pollTitle}</b>
        </div>
        <div className="confirmation-items">
          With options:{" "}
          {pollOptions.map(function (option, idx) {
            return (
              <li key={idx}>
                <b>{option}</b>
              </li>
            );
          })}
        </div>
        <button
          onClick={buttonClick}
          className="btn btn-primary submit-button"
          disabled={
            pollTitle === "" ||
            pollOptions.length === 0 ||
            pollOptions[0] === ""
          }
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default Create;
