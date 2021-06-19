import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { AddressBookJson, StoreKeys } from "@valuemachine/types";
import React, { useState, useEffect, useMemo } from "react";

import "./App.css";
import { AccountManager } from "./components/AccountManager";
import { Home } from "./components/Home";

const App: React.FC = () => {

  // Set theme to user preferred mode
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Home />
      <div className="App">
        <AccountManager />
      </div>
    </ThemeProvider>
  );
};

export default App;
