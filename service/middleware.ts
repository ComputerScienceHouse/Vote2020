/**
 * This module contains middlewares that can be used to process requests, such
 * as adding data to res.locals, or limiting what users may access a route
 */

import { Request, Response } from "express";
import { get } from "https";
import { User } from "./util";

/**
 * A middleware function that adds user info to res.locals
 * Data added:
 * * res.locals.user: User
 */
export function getUserInfo(
  req: Request,
  res: Response,
  next: () => void
): void {
  get(
    {
      hostname: "sso.csh.rit.edu",
      path: "/auth/realms/csh/protocol/openid-connect/userinfo",
      headers: { Authorization: req.headers.authorization },
    },
    (infoRes) => {
      infoRes.setEncoding("utf8");
      infoRes.on("data", function (chunk) {
        const groups = JSON.parse(chunk).groups;
        const user: User = {
          userName: JSON.parse(chunk).preferred_username,
          isEboard: groups.some((group) => group.includes("eboard-")),
          groups: groups,
        };
        res.locals.user = user;
        next();
      });
    }
  );
}

// A middleware function that will return 403 if a member isn't voting
export function requireVoting(
  _: Request,
  res: Response,
  next: () => void
): void {
  // Must be active
  if (!res.locals.user.groups.includes("active")) {
    res.status(403).send();
  }

  // Need to have passed a 10 weeks
  if (
    res.locals.user.groups.includes("10weeks") ||
    res.locals.user.groups.includes("fall_coop")
  ) {
    res.status(403).send();
  }

  next();
}

// Middleware function that returns 403 if the current user is not evals
export function requireEvals(
  _: Request,
  res: Response,
  next: () => void
): void {
  if (!res.locals.user.groups.includes("eboard-evaluations")) {
    res.status(403).send();
  }

  next();
}
