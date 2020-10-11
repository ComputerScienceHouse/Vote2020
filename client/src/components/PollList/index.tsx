import React from "react";
import "./polllist.css";

type PollListProps = {
    currentPolls: Array<any>
};

const PollList : React.FunctionComponent<PollListProps> = (props, { children }) => {
    const {currentPolls} = props;
    return(      
    <div className="poll-list">
        <div className="poll-list-title-panel">Current Ongoing Votes</div>
        <div className="poll-list-items">
            {currentPolls.length > 0 ?         
                <ul>
                    {currentPolls.map(currentPoll => (
                        <li key={currentPoll.name}>
                            {currentPoll.name} 
                            <button className="btn btn-primary poll-list-button">Join Vote</button>
                            <hr />
                        </li>
                    ))}
            </ul> 
            : <div className="poll-list-no-votes"> No Current Votes</div>
            }
      </div>
    </div>
    )
}

export default PollList;