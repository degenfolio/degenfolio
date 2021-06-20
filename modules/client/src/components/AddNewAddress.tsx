import React, { useContext } from "react";
import { AddressCategories } from "@valuemachine/types/dist/addressBook";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import { Autocomplete } from "@material-ui/lab";

import { AccountContext } from "./AccountManager";

export const AddNewAddress = () => {
  // const { addressBook, setAddressBookJson } = useContext(AccountContext);

  return (<>
    <DialogTitle id="form-dialog-title">Add new address</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        id="name"
        label="Account name (optional)"
        type="string"
        fullWidth
      />
      <TextField
        autoFocus
        margin="dense"
        id="address"
        label="Address"
        type="string"
        fullWidth
      />
      <Autocomplete
        options={Object.keys(AddressCategories)}
        renderInput={(params) => (
          <TextField
            {...params}
            margin="dense"
            id="category"
            label="Category"
            type="string"
          />
        )}
      />
    </DialogContent>
  </>);
};

/*
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
*/
