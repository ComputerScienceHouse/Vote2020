import React from "react";
import { render } from "@testing-library/react";
import Home from ".";

test("renders main app page", () => {
  const { getByTestId } = render(<Home />);
  const divElement = getByTestId('spinner');
  expect(divElement).toBeDefined();
});
