import { isAddress } from "@ethersproject/address";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import Collapse from "@material-ui/core/Collapse";
import Divider from "@material-ui/core/Divider";
import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
// import AddIcon from "@material-ui/icons/AddCircle";
import RemoveIcon from "@material-ui/icons/RemoveCircle";
import SaveIcon from "@material-ui/icons/Save";
import EditIcon from "@material-ui/icons/Edit";
import {
  AddressBook,
  AddressBookJson,
  AddressCategories,
  AddressEntry,
} from "@valuemachine/types";
import { Guards } from "@degenfolio/adapters";
import React, { useEffect, useState } from "react";

import { HexString } from "./HexString";

const getEmptyEntry = (): AddressEntry => ({
  address: "",
  category: AddressCategories.Self,
  guard: Guards.ETH,
  name: "",
});

const useStyles = makeStyles((theme: Theme) => createStyles({
  root: {
    margin: theme.spacing(1),
    maxWidth: "98%",
  },
  divider: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  select: {
    margin: theme.spacing(3),
    minWidth: 160,
  },
  input: {
    margin: theme.spacing(1),
    minWidth: 120,
    maxWidth: 300,
  },
  exporter: {
    marginBottom: theme.spacing(4),
    marginLeft: theme.spacing(4),
    marginRight: theme.spacing(4),
    marginTop: theme.spacing(0),
  },
  importer: {
    marginBottom: theme.spacing(1),
    marginLeft: theme.spacing(4),
    marginRight: theme.spacing(4),
    marginTop: theme.spacing(0),
  },
  snackbar: {
    width: "100%"
  },
  button: {
    marginBottom: theme.spacing(1.5),
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
  },
  title: {
    margin: theme.spacing(2),
  },
  subtitle: {
    margin: theme.spacing(2),
  },
  paper: {
    minWidth: "600px",
    padding: theme.spacing(2),
  },
}));

const EditEntry = ({
  entry,
  setEntry,
  addresses,
}: {
  entry: AddressEntry;
  setEntry: (entry: AddressEntry) => void;
  addresses: string[];
}) => {
  const [newEntry, setNewEntry] = useState(getEmptyEntry());
  const [entryModified, setEntryModified] = useState(false);
  const [newEntryError, setNewEntryError] = useState("");
  const classes = useStyles();

  useEffect(() => {
    if (!entry) return;
    setNewEntry(JSON.parse(JSON.stringify(entry)));
  }, [entry]);

  useEffect(() => {
    if (!entryModified) {
      setNewEntryError("");
    }
  }, [entryModified]);

  const getErrors = (candidate: AddressEntry): string => {
    console.log(`Checking ${addresses.length} addresses for dups.. first few: ${addresses.slice(0, 2)}`);
    if (!candidate?.address) {
      return "Address is required";
    } else if (!isAddress(candidate.address)) {
      return "Invalid address";
    } else if (addresses?.includes(candidate.address)) {
      return `Address ${
        candidate.address.substring(0,6)
      }..${
        candidate.address.substring(candidate.address.length-4)
      } already exists at index ${
        addresses?.findIndex(a => a ===candidate.address)
      }`;
    } else {
      return "";
    }
  };

  const handleEntryChange = (event: any) => {
    const newNewEntry = { ...newEntry, [event.target.name]: event.target.value } as any;
    setNewEntry(newNewEntry);
    setNewEntryError(getErrors(newNewEntry));
  };

  useEffect(() => {
    if (!addresses?.length || !entryModified) return;
    setNewEntryError(getErrors(newEntry) || "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  useEffect(() => {
    if (!entry || !newEntry) {
      setEntryModified(false);
    } else if (
      newEntry.address !== entry.address ||
      newEntry.category !== entry.category ||
      newEntry.guard !== entry.guard ||
      newEntry.name !== entry.name
    ) {
      setEntryModified(true);
    } else {
      setEntryModified(false);
    }
  }, [newEntry, entry]);

  const handleSave = () => {
    if (!newEntry) return;
    const errors = getErrors(newEntry);
    if (!errors) {
      setEntry(newEntry);
    } else {
      setNewEntryError(errors);
    }
  };

  return (<>
    <Grid
      alignContent="center"
      alignItems="center"
      container
      spacing={1}
      className={classes.root}
    >

      <Grid item md={4}>
        <TextField
          autoComplete="off"
          value={newEntry?.name || ""}
          helperText="Give your account a nickname"
          id="name"
          fullWidth
          label="Account Name"
          margin="normal"
          name="name"
          onChange={handleEntryChange}
          variant="outlined"
        />
      </Grid>

      <Grid item md={4}>
        <FormControl className={classes.select}>
          <InputLabel id="select-new-category">Category</InputLabel>
          <Select
            labelId={`select-${entry?.address}-category`}
            id={`select-${entry?.address}-category`}
            name="category"
            value={newEntry?.category || ""}
            onChange={handleEntryChange}
          >
            <MenuItem value={""}>-</MenuItem>
            {Object.keys(AddressCategories).map((cat, i) => (
              <MenuItem key={i} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item md={4}>
        <FormControl className={classes.select}>
          <InputLabel id="select-new-guard">Guard</InputLabel>
          <Select
            labelId={`select-${entry?.address}-guard`}
            id={`select-${entry?.address}-guard`}
            name="guard"
            value={newEntry?.guard || Guards.ETH}
            onChange={handleEntryChange}
          >
            {Object.keys(Guards).map((cat, i) => (
              <MenuItem key={i} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item md={6}>
        <TextField
          autoComplete="off"
          value={newEntry?.address || ""}
          error={!!newEntryError}
          helperText={newEntryError || "Add your ethereum address to fetch info"}
          id="address"
          fullWidth
          label="Eth Address"
          margin="normal"
          name="address"
          onChange={handleEntryChange}
          variant="outlined"
        />
      </Grid>

      <Grid item md={6}>
        {entryModified ?
          <Grid item>
            <Button
              className={classes.button}
              color="primary"
              onClick={handleSave}
              size="small"
              startIcon={<SaveIcon />}
              variant="contained"
            >
              Save Address
            </Button>
          </Grid>
          : undefined
        }
      </Grid>
    </Grid>

  </>);
};

const AddressRow = ({
  index,
  editEntry,
  entry,
  otherAddresses,
}: {
  index: number;
  editEntry: any;
  entry: AddressEntry;
  otherAddresses: string[];
}) => {
  const [editMode, setEditMode] = useState(false);
  const [newEntry, setNewEntry] = useState(getEmptyEntry());
  const classes = useStyles();

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      setNewEntry(getEmptyEntry());
    } else {
      setNewEntry(JSON.parse(JSON.stringify(entry)));
    }
  };

  const handleDelete = () => {
    editEntry(index, undefined);
    setEditMode(false);
  };

  const handleEdit = (editedEntry: AddressEntry) => {
    editEntry(index, editedEntry);
    setEditMode(false);
  };

  return (
    <React.Fragment>
      <TableRow>
        <TableCell> {entry.name} </TableCell>
        <TableCell> {entry.category} </TableCell>
        <TableCell> {entry.guard || Guards.None} </TableCell>
        <TableCell> <HexString value={entry.address}/> </TableCell>
        <TableCell>
          <IconButton color="secondary" onClick={toggleEditMode}>
            <EditIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={editMode} timeout="auto" unmountOnExit>
            <Box py={2} px={4} >
              <Typography variant="h6" gutterBottom component="div">
                Edit Address
              </Typography>

              <EditEntry
                entry={newEntry}
                setEntry={handleEdit}
                addresses={otherAddresses}
              />

              <Grid item>
                <Button
                  className={classes.button}
                  color="primary"
                  onClick={handleDelete}
                  size="small"
                  startIcon={<RemoveIcon />}
                  variant="contained"
                >
                  Delete Address
                </Button>
              </Grid>

            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export const AddressBookManager = ({
  addressBook,
  setAddressBookJson,
}: {
  addressBook: AddressBook,
  setAddressBookJson: (val: AddressBookJson) => void,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const [filteredAddresses, setFilteredAddresses] = useState([] as AddressEntry[]);
  const [filterCategory, setFilterCategory] = useState("");

  const [allAddresses, setAllAddresses] = useState([] as string[]);
  const [newEntry, setNewEntry] = useState(getEmptyEntry);
  const classes = useStyles();

  useEffect(() => {
    setAllAddresses(addressBook.json.map(entry => entry.address));
  }, [addressBook]);

  useEffect(() => {
    setFilteredAddresses(addressBook.json.filter(entry =>
      !filterCategory || entry.category === filterCategory
    ).sort((e1, e2) =>
      // put self addresses first
      (
        e1.category !== AddressCategories.Self &&
        e2.category === AddressCategories.Self
      ) ? 1
        : (
          e1.category === AddressCategories.Self &&
          e2.category !== AddressCategories.Self
        ) ? -1
          // sort by category
          : (e1.category.toLowerCase() > e2.category.toLowerCase()) ? 1
          : (e1.category.toLowerCase() < e2.category.toLowerCase()) ? -1
          // then sort by name
          : (e1.name.toLowerCase() > e2.name.toLowerCase()) ? 1
          : (e1.name.toLowerCase() < e2.name.toLowerCase()) ? -1
          // then sort by address
          : (e1.address.toLowerCase() > e2.address.toLowerCase()) ? 1
          : (e1.address.toLowerCase() < e2.address.toLowerCase()) ? -1
          : 0
    ));
  }, [addressBook, filterCategory]);

  const editEntry = (index: number, editedEntry?: AddressEntry) => {
    if (index >= 0 && index <= allAddresses.length) {
      console.log(`${
        !editedEntry ? "Deleting" : index === allAddresses.length ? "Creating" : "Updating"
      } ${JSON.stringify(editedEntry)}`);
      const newAddressBook = [...addressBook.json]; // create new array to ensure it re-renders
      if (!editedEntry) {
        newAddressBook.splice(index,1);
      } else {
        newAddressBook[index] = editedEntry;
      }
      setAddressBookJson(newAddressBook);
      // Don't reset new entry fields when we modify an existing one
      if (editedEntry && index === allAddresses.length) {
        setNewEntry(getEmptyEntry);
      }
    } else {
      console.log(`index ${index} is out of range, expected 0-${allAddresses.length}`);
    }
  };

  const addNewAddress = (editedEntry: AddressEntry) => {
    editEntry(addressBook.json.length, editedEntry);
  };

  const reset = async () => {
    setAddressBookJson([]);
  };

  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleFilterChange = (event: any) => {
    setFilterCategory(event.target.value || "");
    setPage(0);
  };

  return (
    <div className={classes.root}>

      <Typography variant="h4" className={classes.subtitle}>
        Manage Address Book
      </Typography>

      <Grid
        alignContent="center"
        alignItems="center"
        justify="center"
        container
        spacing={1}
        className={classes.root}
      >

        <Grid item md={8}>
          <Card className={classes.root}>
            <CardHeader title={"Add new Address"} />
            <EditEntry
              entry={newEntry}
              setEntry={addNewAddress}
              addresses={allAddresses}
            />
          </Card>
        </Grid>

        <Grid item md={4}>
          <Button
            color="primary"
            onClick={reset}
            size="medium"
            disabled={!addressBook.json?.length}
            startIcon={<RemoveIcon/>}
            variant="contained"
          >
            Remove All
          </Button>
        </Grid>

      </Grid>

      <Divider/>
      <Typography variant="h4" className={classes.subtitle}>
        Address Book Filters
      </Typography>

      <FormControl className={classes.select}>
        <InputLabel id="select-filter-category">Filter Category</InputLabel>
        <Select
          labelId="select-filter-category"
          id="select-filter-category"
          value={filterCategory || ""}
          onChange={handleFilterChange}
        >
          <MenuItem value={""}>-</MenuItem>
          {Array.from(new Set(addressBook.json.map(e => e.category))).map(cat => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Paper className={classes.paper}>

        <Typography align="center" variant="h4" className={classes.title} component="div">
          {filteredAddresses.length === addressBook.json.length
            ? `${filteredAddresses.length} Addresses`
            : `${filteredAddresses.length} of ${addressBook.json.length} Addresses`
          }
        </Typography>

        <TableContainer>
          <TablePagination
            rowsPerPageOptions={[25, 50, 100, 250]}
            component="div"
            count={filteredAddresses.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong> Account name </strong></TableCell>
                <TableCell><strong> Category </strong></TableCell>
                <TableCell><strong> Guard </strong></TableCell>
                <TableCell><strong> Eth Address </strong></TableCell>
                <TableCell><strong> Edit </strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAddresses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((entry: AddressEntry, i: number) => (
                  <AddressRow
                    otherAddresses={[...allAddresses.slice(0, i), ...allAddresses.slice(i + 1)]}
                    key={i}
                    index={addressBook.json.findIndex(e => e.address === entry.address)}
                    editEntry={editEntry}
                    entry={entry}
                  />

                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[25, 50, 100, 250]}
            component="div"
            count={filteredAddresses.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Paper>

    </div>
  );
};
