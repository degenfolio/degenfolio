import { appAddresses } from "@degenfolio/adapters";
import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import { makeStyles } from "@material-ui/core/styles";
import TabContext from "@material-ui/lab/TabContext";
import TabPanel from "@material-ui/lab/TabPanel";
// Icons
import AccountIcon from "@material-ui/icons/AccountCircle";
import BarChartIcon from "@material-ui/icons/BarChart";
// ValueMachine
import { getLogger, getLocalStore } from "@valuemachine/utils";
import { StoreKeys } from "@valuemachine/types";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { getAddressBook, getTransactions } from "valuemachine";

import { AccountContext } from "./AccountManager";
import { NavBar } from "./NavBar";
import { AccountFAB } from "./AccountFAB";

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
const { AddressBook: AddressBookStore, Transactions: TransactionsStore } = StoreKeys;

export const Home = () => {
  const classes = useStyles();
  const [tab, setTab] = useState("portfolio");
  // Load stored JSON data from localstorage
  const [addressBookJson, setAddressBookJson] = useState(store.load(AddressBookStore));

  // Parse JSON data into utilities
  const [addressBook, setAddressBook] = useState(getAddressBook({
    json: addressBookJson,
    hardcoded: appAddresses,
    logger,
  }));
  const [transactions, setTransactions] = useState(getTransactions({
    json: store.load(TransactionsStore),
    logger,
  }));

  const updateSelection = (event: React.ChangeEvent<{}>, selectedTab: string) => {
    setTab(selectedTab);
  };

  const syncAddressBook = async () => {
    if (addressBookJson?.length) {
      while (true) {
        try {
          console.log(`Attempting to fetch for addressBook`, addressBookJson);
          const res = await axios.post("/api/transactions/eth", { addressBook: addressBookJson });
          if (res.status === 200 && typeof(res.data) === "object") {
            const newTransactions = getTransactions({
              json: res.data,
              logger,
            });
            // If csv merge it to transactions
            setTransactions(newTransactions);
            return;
          }
          console.log(res);
        } catch (e) {
          console.warn(e);
        }
        await new Promise((res) => setTimeout(res, 10000));
      }
    }
  };

  useEffect(() => {
    if (!addressBookJson) return;
    console.log(`Refreshing ${addressBookJson.length} address book entries`);
    const newAddressBook = getAddressBook({
      json: addressBookJson,
      hardcoded: appAddresses,
      logger
    });
    store.save(AddressBookStore, newAddressBook.json);
    setAddressBook(newAddressBook);
    syncAddressBook();
  }, [addressBookJson]);

  useEffect(() => {
    if (!transactions?.json?.length) return;
    store.save(TransactionsStore, transactions.json);
  }, [transactions]);

  return (
    <AccountContext.Provider value={{ addressBook, setAddressBookJson, syncAddressBook }}>
      <NavBar />
      <TabContext value={tab}>
        <TabPanel value="portfolio" className={classes.panel}>
          Portfolio
        </TabPanel>
        <TabPanel value="addressBook" className={classes.panel}>
          <AccountFAB />
        </TabPanel>

        <AppBar color="inherit" position="fixed" className={classes.appbar}>
          <Tabs
            value={tab}
            onChange={updateSelection}
            indicatorColor="primary"
            variant="fullWidth"
          >
            <Tab value="portfolio" icon={<BarChartIcon />} aria-label="addressBook" />
            <Tab value="addressBook" icon={<AccountIcon />} aria-label="account" />
          </Tabs>
        </AppBar>
      </TabContext>
    </AccountContext.Provider>
  );
};
