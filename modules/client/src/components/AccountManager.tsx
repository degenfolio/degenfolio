import React, { createContext, useContext } from "react";
import Typography from "@material-ui/core/Typography";
import {
  AddressBook,
  AddressBookJson,
} from "@valuemachine/types";
import Paper from "@material-ui/core/Paper";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContentText from "@material-ui/core/DialogContentText";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";

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
  // Get account context
  const { addressBook, setAddressBookJson } = useContext(AccountContext);

  return (
    <Dialog open={openDialog}>
      <DialogTitle id="form-dialog-title">Add new address</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Accounts Linked
          {`Our addressBook contains ${
            addressBook.addresses.length
          } addresses of which ${
            addressBook.addresses.filter(a => addressBook.isSelf(a)).length
          } are ours`}
          To subscribe to this website, please enter your email address here. We will send updates
          occasionally.

          {`We are ${
            typeof setAddressBookJson === "function" ? "" : "NOT "
          }able to update the addressBook`}
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Address"
          type="ethAddress"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)} color="primary">
          Cancel
        </Button>
        <Button onClick={() => setOpenDialog(false)} color="primary">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};
