// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { Component } from "react";
import { Switch, Route, BrowserRouter as Router } from "react-router-dom";
import { withOidcSecure } from "@axa-fr/react-oidc-context";
import { Home, Vote, Create, Result } from "./index";
import PageContainer from "../containers/PageContainer";

class App extends Component {
  render(): JSX.Element {
    return (
      <Router>
        <PageContainer>
          <Switch>
            <Route exact path="/" component={withOidcSecure(Home)} />
            <Route
              exact
              path="/vote/:voteId"
              component={withOidcSecure(Vote)}
            />
            <Route exact path="/create" component={withOidcSecure(Create)} />
            <Route
              exact
              path="/result/:voteId"
              component={withOidcSecure(Result)}
            />
          </Switch>
        </PageContainer>
      </Router>
    );
  }
}

export default App;
