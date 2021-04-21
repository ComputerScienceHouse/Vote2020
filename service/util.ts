/**
 * This file contains useful utility functions and interfaces for use across the server code
 */

export interface Poll {
  title: string;
  choices: string[];
  type: string;
  _id: string;
  time: Date;
}

export interface User {
  userName: string;
  isEboard: boolean;
  groups: string[];
}

/**
 * Determine whether a user can vote in a poll
 *
 * At present, the only restricted polls are EboardOnly and MajorProject
 */
export function userCanVote(
  user: Pick<User, "isEboard">,
  poll: Pick<Poll, "type">
): boolean {
  if (["EboardOnly", "MajorProject"].includes(poll.type) && !user.isEboard) {
    return false;
  }

  return true;
}
