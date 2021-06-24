import React, { useContext, useState } from "react";
import { AddressCategories, AddressCategory, AddressEntry } from "@valuemachine/types";
import Button from "@material-ui/core/Button";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import { Autocomplete } from "@material-ui/lab";
// Icons
import AddIcon from "@material-ui/icons/Add";

import { mergeAddresses } from "../utils";

import { AccountContext } from "./AccountManager";

export const AddNewAddress = ({
  setOpenDialog
}: {setOpenDialog: (val: boolean) => void}) => {
  const { addressBook, setAddressBookJson } = useContext(AccountContext);
  const [newEntry, setNewEntry] = useState({
    category: AddressCategories.Self
  } as AddressEntry);

  const handleEntryChange = (event: React.ChangeEvent<{name: string, value: string}>) => {
    const newNewEntry = { ...newEntry, [event.target.name]: event.target.value };
    setNewEntry(newNewEntry);
  };

  const handleAddEntry = () => {
    const newAddressBookJson = mergeAddresses([newEntry], addressBook.json);
    setAddressBookJson(newAddressBookJson);
    setOpenDialog(false);
  };

  return (<>
    <DialogTitle id="form-dialog-title">Add new address</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        fullWidth
        id="name"
        label="Account name (optional)"
        name="name"
        onChange={handleEntryChange}
        type="string"
        value={newEntry.name || ""}
      />
      <TextField
        autoFocus
        fullWidth
        id="address"
        label="Address"
        margin="dense"
        name="address"
        onChange={handleEntryChange}
        type="string"
        value={newEntry.address || ""}
      />
      <Autocomplete
        options={Object.keys(AddressCategories)}
        autoSelect
        value={newEntry.category}
        onChange={(event, value) => {
          const newNewEntry = { ...newEntry, category: value as AddressCategory };
          setNewEntry(newNewEntry);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            id="category"
            name="category"
            label="Category"
            margin="dense"
            type="string"
          />
        )}
      />
    </DialogContent>
    <Button onClick={handleAddEntry} color="primary">
      <AddIcon />
    </Button>
  </>);
};