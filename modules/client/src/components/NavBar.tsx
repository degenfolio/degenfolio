import React, { useState, useContext } from "react";
import AppBar from "@material-ui/core/AppBar";
import { makeStyles } from "@material-ui/core/styles";

import { AccountContext } from "./AccountManager";

const useStyles = makeStyles( theme => ({
  navbar: {
    flex: 1,
    bottom: "auto",
    top: 0,
  },
}));

export const NavBar = () => {

  const classes = useStyles();
  const [syncing, setSyncing] = useState(false);
  const { addressBook, setAddressBookJson } = useContext(AccountContext);

  return (
    <AppBar color="inherit" position="fixed" className={classes.navbar}>
      Sync
    </AppBar>
  );
};