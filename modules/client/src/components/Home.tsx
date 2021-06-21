import React, { useState, useEffect } from "react";
import axios from "axios";
import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import { makeStyles } from "@material-ui/core/styles";
import TabContext from "@material-ui/lab/TabContext";
import SpeedDial from "@material-ui/lab/SpeedDial";
import SpeedDialAction from "@material-ui/lab/SpeedDialAction";
import TabPanel from "@material-ui/lab/TabPanel";
// Icons
import AccountIcon from "@material-ui/icons/AccountCircle";
import BarChartIcon from "@material-ui/icons/BarChart";
import AddIcon from "@material-ui/icons/Add";
import ImportAddressBookIcon from "@material-ui/icons/ImportContacts";
// ValueMachine
import { getLogger, getLocalStore } from "@valuemachine/utils";
import { StoreKeys } from "@valuemachine/types";
import { getAddressBook } from "valuemachine";

import { getExternalAddress, mergeAppAddresses } from "../utils";
import { getFabStyle } from "../style";

import { AccountContext, AccountManager } from "./AccountManager";
import { NavBar } from "./NavBar";

const useStyles = makeStyles( theme => ({
  appbar: {
    flex: 1,
    bottom: 0,
    top: "auto",
  },
  navbar: {
    flex: 1,
    bottom: "auto",
    top: 0,
  },
  panel: {
    marginTop: theme.spacing(8),
  },
  speedDial: getFabStyle(theme),
}));

const store = getLocalStore(localStorage);

const logger = getLogger("warn");

// localstorage keys
const { AddressBook: AddressBookStore } = StoreKeys;

export const Home = () => {
  const classes = useStyles();
  const [tab, setTab] = useState("addressBook");
  const [openSpeedDial, setOpenSpeedDial] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [addNewAddress, setAddNewAddress] = useState(false);

  const syncAddressBook = async () => {
    while (true) {
      try {
        console.log(`Attempting to fetch for addressBook`, addressBookJson);
        const res = await axios.post("/api/transactions/eth", { addressBook: addressBookJson });
        if (res.status === 200 && typeof(res.data) === "object") {
          return res.data;
        }
        console.log(res);
      } catch (e) {
        console.warn(e);
      }
      await new Promise((res) => setTimeout(res, 10000));
    }
  };

  // Load stored JSON data from localstorage
  const [addressBookJson, setAddressBookJson] = useState(store.load(AddressBookStore));

  // Parse JSON data into utilities
  const [addressBook, setAddressBook] = useState(getAddressBook({
    json: addressBookJson,
    logger,
  }));

  useEffect(() => {
    if (!addressBookJson) return;
    // syncAddressBook();
    console.log(`Refreshing ${addressBookJson.length} address book entries`);
    const newAddressBookJson = mergeAppAddresses(addressBookJson);
    const newAddressBook = getAddressBook({
      json: newAddressBookJson,
      logger
    });
    const externalAddresses = getExternalAddress(newAddressBook);
    store.save(AddressBookStore, externalAddresses);
    setAddressBook(newAddressBook);

  }, [addressBookJson]);

  const updateSelection = (event: React.ChangeEvent<{}>, selectedTab: string) => {
    setTab(selectedTab);
  };

  return (
    <AccountContext.Provider value={{ addressBook, setAddressBookJson, syncAddressBook }}>
      <NavBar />
      <TabContext value={tab}>
        <TabPanel value="account" className={classes.panel}>
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
      <SpeedDial
        FabProps={ { id: "fab" } }
        ariaLabel="fab"
        icon={<AddIcon />}
        onClose={() => setOpenSpeedDial(false)}
        onOpen={() => setOpenSpeedDial(true)}
        open={openSpeedDial}
        key="fab-add-address"
        className={classes.speedDial}
      >
        <SpeedDialAction
          FabProps={ { id: "fab-add-address" } }
          icon={<AccountIcon />}
          key="fab-add-address"
          onClick={() => {
            setAddNewAddress(true);
            setOpenDialog(true);
          }}
          tooltipTitle="Add address"
        />
        <SpeedDialAction
          FabProps={ { id: "fab-import-addressBook" } }
          icon={<ImportAddressBookIcon />}
          key="fab-import-addressBook"
          onClick={() => {
            setAddNewAddress(false);
            setOpenDialog(true);
          }}
          tooltipTitle="Import address book"
        />
      </SpeedDial>
      <AccountManager
        addNewAddress={addNewAddress}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
      />
    </AccountContext.Provider>
  );
};
