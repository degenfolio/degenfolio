import React, { useState, useEffect } from "react";
import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import { makeStyles } from "@material-ui/core/styles";
import TabContext from "@material-ui/lab/TabContext";
import TabPanel from "@material-ui/lab/TabPanel";
import AccountIcon from "@material-ui/icons/AccountCircle";
import BarChartIcon from "@material-ui/icons/BarChart";
import { getLogger, getLocalStore } from "@valuemachine/utils";
import { getAddressBook } from "@valuemachine/transactions";
import { StoreKeys } from "@valuemachine/types";

import { mergeAppAddresses } from "../utils";

import { AccountContext, AccountManager } from "./AccountManager";

const useStyles = makeStyles( theme => ({
  appbar: {
    flex: 1,
    bottom: 0,
    top: "auto",
  },
  panel: {
    marginTop: theme.spacing(8),
  },
}));

const store = getLocalStore(localStorage);

const logger = getLogger("warn");

// localstorage keys
const { AddressBook: AddressBookStore } = StoreKeys;

export const Home = () => {
  const classes = useStyles();
  const [tab, setTab] = useState("addressBook");

  // Load stored JSON data from localstorage
  const [addressBookJson, setAddressBookJson] = useState(store.load(AddressBookStore));

  // Parse JSON data into utilities
  const [addressBook, setAddressBook] = useState(getAddressBook({
    json: addressBookJson,
    logger,
  }));

  useEffect(() => {
    if (!addressBookJson) return;
    console.log(`Refreshing ${addressBookJson.length} address book entries`);
    const newAddressBookJson = mergeAppAddresses(addressBookJson);
    setAddressBook(getAddressBook({
      json: newAddressBookJson,
      logger
    }));
  }, [addressBookJson]);

  const updateSelection = (event: React.ChangeEvent<{}>, selectedTab: string) => {
    setTab(selectedTab);
  };

  return (
    <AccountContext.Provider value={{ addressBook, setAddressBookJson }}>
      <TabContext value={tab}>
        <TabPanel value="account" className={classes.panel}>
          <AccountManager />
        </TabPanel>
        <TabPanel value="addressBook" className={classes.panel}> Portfolio </TabPanel>

        <AppBar color="inherit" position="fixed" className={classes.appbar}>
          <Tabs
            value={tab}
            onChange={updateSelection}
            indicatorColor="primary"
            variant="fullWidth"
          >
            <Tab value="addressBook" icon={<BarChartIcon />} aria-label="addressBook" />
            <Tab value="account" icon={<AccountIcon />} aria-label="account" />

          </Tabs>
        </AppBar>
      </TabContext>
    </AccountContext.Provider>
  );
};