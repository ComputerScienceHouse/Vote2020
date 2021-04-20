/**
 * This file contains useful utility functions and interfaces for use across the server code
 */

interface Poll {
  title: string;
  choices: string[];
  type: string;
  _id: string;
  time: Date;
}

interface User {
  username: string;
  isEboard: boolean;
  groups: string[];
}

function userCanVote(user: User, poll: Poll) {
  //TODO - add functionality
}
