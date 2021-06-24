import React, { useState, useContext } from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";

// Icons
import SyncIcon from '@material-ui/icons/Sync';

import { AccountContext } from "./AccountManager";
import { Typography } from "@material-ui/core";

const useStyles = makeStyles( theme => ({
  navbar: {
    flex: 1,
    bottom: "auto",
    top: 0,
  },
}));

export const NavBar = ({
  syncing,
}: { syncing: boolean, }) => {

  const { addressBook, syncAddressBook } = useContext(AccountContext);
  const classes = useStyles();

  return (
    <AppBar color="inherit" position="fixed" className={classes.navbar}>
      <Toolbar variant="dense">
        <Typography>
          {syncing
            ? `Syncing ${addressBook?.json?.length} addresses`
            : `Synced`
          }
        </Typography>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="sync"
          disabled={syncing}
          onClick={syncAddressBook}
        >
          <SyncIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};