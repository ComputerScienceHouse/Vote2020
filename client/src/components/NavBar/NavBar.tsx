import React from "react";
import {
  Collapse,
  Container,
  Nav,
  Navbar,
  NavbarToggler,
  NavItem,
} from "reactstrap";
import { NavLink } from "react-router-dom";
import Profile from "./Profile";
import { useReactOidc } from "@axa-fr/react-oidc-context";

const NavBar: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const toggle = () => {
    setIsOpen(!isOpen);
  };
  const { oidcUser } = useReactOidc();
  let evals = false;
  if (oidcUser) {
    evals = oidcUser.profile.groups.includes("eboard-evaluations");

  }

  return (
    <div>
      <Navbar color="primary" dark expand="lg" fixed="top">
        <Container>
          <NavLink to="/" className={"navbar-brand"}>
            Vote
          </NavLink>
          <NavbarToggler onClick={toggle} />
          <Collapse isOpen={isOpen} navbar>
            <Nav navbar>
              <NavItem>
                <NavLink to="/" className={"nav-link"}>
                  Home
                </NavLink>
              </NavItem>
              {evals ? 
                <NavItem>
                <NavLink to="/create" className={"nav-link"}>
                  Create
                </NavLink>
              </NavItem>
              : null}
            </Nav>
            <Nav navbar className="ml-auto">
              <Profile />
            </Nav>
          </Collapse>
        </Container>
      </Navbar>
    </div>
  );
};

export default NavBar;
