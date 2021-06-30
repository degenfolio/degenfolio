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
import { Asset, Assets, PriceList, PricesJson, StoreKeys } from "@valuemachine/types";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { getAddressBook, getTransactions, getValueMachine, getPrices } from "valuemachine";

import { AccountContext } from "./AccountManager";
import { NavBar } from "./NavBar";
import { AccountFAB } from "./AccountFAB";
import { Portfolio } from "./Portfolio";
import { fetchPrice, fetchPriceForAssetsOnDate, fetchPricesForChunks } from "../utils";

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

const logger = getLogger("debug");

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
  const [syncing, setSyncing] = useState({
    state: false,
    msg: ""
  });
  const [tab, setTab] = useState("addressBook");
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
      setSyncing({ state: true, msg: `Syncing ${addressBookJson.length} addresses` });
      while (true) {
        try {
          console.log(`Attempting to fetch for addressBook`, addressBookJson);
          const res = await axios.post("/api/transactions/eth", { addressBook: addressBookJson });
          if (res.status === 200 && typeof(res.data) === "object") {
            const newTransactions = getTransactions({
              json: res.data,
              logger,
            });
            //TODO: If csv merge it to transactions
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
      setSyncing({ state: true, msg: "Syncing Prices" });
      // Fetch and merge prices for all chunks
      const chunkPrices = await fetchPricesForChunks(unit, vm.json.chunks);
      prices.merge(chunkPrices);

      // Fetch and merge today's prices for currently held assets
      const netWorth = vm.getNetWorth()
      const today = (new Date()).toISOString().split('T')[0];
      const currentPrices = await fetchPriceForAssetsOnDate(unit, Object.keys(netWorth), today);
      prices.merge(currentPrices);

      // Fetch and merge prices for assets on each event date
      vm.json.events.forEach(async (txEvent) => {
        prices.merge((await fetchPriceForAssetsOnDate(
          unit,
          Object.keys(txEvent.newBalances),
          txEvent.date
        )));
      });

      // Set prices state to trigger re-render
      setPrices(getPrices({
        json: prices.json,
        logger,
        store,
        unit,
      }));

      setSyncing({ state: false, msg: "" });
      return;
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
    setSyncing({ state: false, msg: "" });
    store.save(TransactionsStore, transactions.json);
    processTransactions();
  }, [transactions]);

  return (
    <AccountContext.Provider value={{ addressBook, setAddressBookJson, syncAddressBook, vm }}>
      <NavBar syncing={syncing} unit={unit} setUnit={setUnit} />
      <TabContext value={tab}>
        <TabPanel value="portfolio" className={classes.panel}>
          <Portfolio prices={prices} unit={unit} />
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
