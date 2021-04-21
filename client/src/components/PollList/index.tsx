import React from "react";
import "./polllist.css";
import { Link } from "react-router-dom";

type Poll = {
  _id: string;
  title: string;
  canVote: boolean;
};

type PollListProps = {
  currentPolls: Array<Poll>;
};

const PollButton: React.FunctionComponent<{ currentPoll: Poll }> = (props: {
  currentPoll: Poll;
}) => {
  const { currentPoll } = props;
  const link: string = currentPoll.canVote
    ? `/vote/${currentPoll._id}`
    : `/result/${currentPoll._id}`;
  const text: string = currentPoll.canVote ? "Join Vote" : "View Results";

  return (
    <li key={currentPoll.title}>
      {currentPoll.title}
      <Link to={link}>
        <button className="btn btn-primary poll-list-button">{text}</button>
      </Link>
      <hr />
    </li>
  );
};

const PollList: React.FunctionComponent<PollListProps> = (props) => {
  const { currentPolls } = props;
  return (
    <div className="poll-list">
      <div className="poll-list-title-panel">Current Ongoing Votes</div>
      <div className="poll-list-items">
        {currentPolls.length > 0 ? (
          <ul>
            {currentPolls.map((currentPoll) => (
              <PollButton currentPoll={currentPoll} />
            ))}
          </ul>
        ) : (
          <div className="poll-list-no-votes"> No Current Votes</div>
        )}
      </div>
    </div>
  );
};

export default PollList;
