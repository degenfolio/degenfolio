import React, { createContext, useContext } from "react";
import Typography from "@material-ui/core/Typography";
import { AddressBook, AddressBookJson, } from "@valuemachine/types";
import Paper from "@material-ui/core/Paper";
import Dialog from "@material-ui/core/Dialog";
import Button from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
// Icons
import CancelIcon from "@material-ui/icons/Cancel";

import { AddNewAddress } from "./AddNewAddress";

const useStyles = makeStyles((theme) => ({
  closeDialog: {
    height: theme.spacing(8),
    marginBottom: theme.spacing(-6),
    marginLeft: "75%",
  },
}));

export const AccountContext = createContext({} as {
  addressBook: AddressBook,
  setAddressBookJson: (val: AddressBookJson) => void,
});

export const AccountManager = ({
  addNewAddress,
  openDialog,
  setOpenDialog,
}: {
  addNewAddress: boolean,
  openDialog: boolean,
  setOpenDialog: (val: boolean) => void
}) => {
  const { addressBook, setAddressBookJson } = useContext(AccountContext);
  const classes = useStyles();

  return (
    <Dialog open={openDialog}>
      <Button className={classes.closeDialog} onClick={() => setOpenDialog(false)} color="primary">
        <CancelIcon />
      </Button>
      {addNewAddress ? <AddNewAddress setOpenDialog={setOpenDialog} /> : <div> Import New Address</div>}
    </Dialog>
  );
};
