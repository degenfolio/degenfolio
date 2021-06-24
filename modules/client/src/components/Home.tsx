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
import { Asset, Assets, Prices, StoreKey, StoreKeys } from "@valuemachine/types";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { getAddressBook, getTransactions, getValueMachine, getPrices } from "valuemachine";

import { AccountContext } from "./AccountManager";
import { NavBar } from "./NavBar";
import { AccountFAB } from "./AccountFAB";
import { Portfolio } from "./Portfolio";

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
const {
  AddressBook: AddressBookStore,
  Transactions: TransactionsStore,
  ValueMachine: ValueMachineStore,
  Prices: PricesStore,
} = StoreKeys;

const unitStore = "Unit";

export const Home = () => {
  const classes = useStyles();
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState("portfolio");
  const [unit, setUnit] = useState(localStorage.getItem(unitStore) as Asset || Assets.ETH as Asset)
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

  const [vm, setVM] = useState(getValueMachine({
    addressBook,
    json: store.load(ValueMachineStore),
    logger,
  }));
  const [prices, setPrices] = useState(getPrices({
    json: store.load(PricesStore),
    unit,
    logger,
    store,
  })
  );

  const updateSelection = (event: React.ChangeEvent<{}>, selectedTab: string) => {
    setTab(selectedTab);
  };

  const syncAddressBook = async () => {
    if (addressBookJson?.length) {
      setSyncing(true);
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

  const syncPrices = async () => {
    if (!vm || !unit || !prices) return;
    try {
      console.log(`Attempting to fetch for addressBook`, addressBookJson);
      const res = await axios.post(`/api/prices/chunks/${unit}`, { chunks: vm.json.chunks });
      if (res.status === 200 && typeof(res.data) === "object") {
        prices.merge(res.data)
        console.log(prices)
        // If csv merge it to transactions
        setPrices(getPrices({
          json: prices.json,
          logger,
          store,
          unit,
         }));
        return;
      }
      console.log(res);
    } catch (e) {
      console.warn(e);
    }
  }

  const processTransactions = async () => {
    const newVM = getValueMachine({
      addressBook,
      logger,
    });
   
    for (const tx of transactions.json) {
      newVM.execute(tx);
      await new Promise(res => setTimeout(res, 1));
    }
    store.save(ValueMachineStore, newVM.json)
    console.log(newVM.json.chunks);
    setVM(newVM);
  }

  useEffect(() => {
    syncPrices();
  }, [unit, vm.json]);

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
    localStorage.setItem(unitStore, unit);
  }, [unit]);

  useEffect(() => {
    if (!transactions?.json?.length) return;
    setSyncing(false);
    store.save(TransactionsStore, transactions.json);
    processTransactions();
  }, [transactions]);

  return (
    <AccountContext.Provider value={{ addressBook, setAddressBookJson, syncAddressBook, vm }}>
      <NavBar syncing={syncing} unit={unit} setUnit={setUnit} />
      <TabContext value={tab}>
        <TabPanel value="portfolio" className={classes.panel}>
          <Portfolio prices={prices} />
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
