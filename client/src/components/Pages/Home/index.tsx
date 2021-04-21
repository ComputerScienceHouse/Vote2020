import React, { useEffect, useState } from "react";
import Spinner from "../../Spinner";
import PollList from "../../PollList";
import { useReactOidc } from "@axa-fr/react-oidc-context";

declare let process: { env: { REACT_APP_BASE_API_URL: string } };

export const Home: React.FunctionComponent = () => {
  const [error, setError] = useState(null);
  const [isLoaded, setLoaded] = useState(false);
  const [currentPolls, setCurrentPolls] = useState([]);
  const { oidcUser } = useReactOidc();

  useEffect(() => {
    fetch(process.env.REACT_APP_BASE_API_URL + "/api/getCurrentPolls", {
      headers: new Headers({
        Authorization: "Bearer " + oidcUser.access_token,
      }),
    })
      .then((res) => res.json())
      .then(
        (result) => {
          setLoaded(true);
          setCurrentPolls(result);
        },
        (error) => {
          setLoaded(true);
          setError(error);
        }
      );
  }, [oidcUser.access_token]);

  return error ? (
    <div>Something went wrong! Please Try again</div>
  ) : !isLoaded ? (
    <Spinner className="home" />
  ) : (
    <PollList currentPolls={currentPolls} />
  );
};

export default Home;
