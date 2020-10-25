import React, { Component } from "react";
import { Switch, Route, BrowserRouter as Router } from "react-router-dom";
import { withOidcSecure } from "@axa-fr/react-oidc-context";
import { Home, Vote, Create } from "./index";
import PageContainer from "../containers/PageContainer";

class App extends Component {
  render() {
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
          </Switch>
        </PageContainer>
      </Router>
    );
  }
}

export default App;
