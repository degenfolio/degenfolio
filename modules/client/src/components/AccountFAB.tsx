import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import SpeedDial from "@material-ui/lab/SpeedDial";
import SpeedDialAction from "@material-ui/lab/SpeedDialAction";
// Icons
import AccountIcon from "@material-ui/icons/AccountCircle";
import AddIcon from "@material-ui/icons/Add";
import ImportAddressBookIcon from "@material-ui/icons/ImportContacts";

import { getFabStyle } from "../style";

import { AccountManager } from "./AccountManager";

const useStyles = makeStyles( theme => ({
  navbar: {
    flex: 1,
    bottom: "auto",
    top: 0,
  },
  speedDial: getFabStyle(theme),
}));

export const AccountFAB = () => {
  const classes = useStyles();

  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openSpeedDial, setOpenSpeedDial] = useState<boolean>(false);
  const [addNewAddress, setAddNewAddress] = useState(false);

  return (<>
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
  </>);
};
