import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import { makeStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import IconButton from "@material-ui/core/IconButton";
import FormControl from "@material-ui/core/FormControl";
import Typography from "@material-ui/core/Typography";
import Select from "@material-ui/core/Select";
// Icons
import SyncIcon from "@material-ui/icons/Sync";
import DownloadIcon from "@material-ui/icons/GetApp";
import { Asset, Assets, FiatCurrencies } from "@valuemachine/types";

const useStyles = makeStyles( theme => ({
  navbar: {
    flex: 1,
    bottom: "auto",
    top: 0,
  },
  sync: {
    flexGrow: 1,
    justifyContent: "right",
    padding: theme.spacing(2),
  },
  selector: {
    padding: theme.spacing(1),
    display: "flex",
  }
}));

export const NavBar = ({
  setUnit,
  syncAddressBook,
  downloadF8949,
  syncing,
  unit,
}: {
  setUnit: (val: Asset) => void,
  syncAddressBook: () => Promise<void>,
  downloadF8949: () => Promise<void>,
  syncing: string,
  unit: Asset,
}) => {
  const classes = useStyles();

  const handleUnitChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setUnit(event.target.value as Asset);
  };

  return (
    <AppBar color="inherit" position="fixed" className={classes.navbar}>
      <Toolbar variant="dense">
        <Typography className={classes.selector}>
          Unit of Account
        </Typography>
        <FormControl focused={false}>
          <Select
            labelId="select-unit-label"
            id="select-unit"
            value={unit || Assets.ETH}
            onChange={handleUnitChange}
          >
            {([Assets.ETH, Assets.BTC] as Asset[])
              .concat(Object.keys({ ...FiatCurrencies }) as Asset[])
              .map(asset => <MenuItem key={asset} value={asset}>{asset}</MenuItem>)
            }
          </Select>
        </FormControl>

        <Typography align="right" className={classes.sync}>
          {syncing || "Synced"}
        </Typography>

        <IconButton
          edge="start"
          color="inherit"
          aria-label="sync"
          disabled={!!syncing}
          onClick={syncAddressBook}
        >
          <SyncIcon />
        </IconButton>

        <IconButton
          edge="start"
          color="inherit"
          aria-label="download"
          disabled={!!syncing}
          onClick={() => {
            console.log(`Calling form downloader`);
            downloadF8949();
          }}
        >
          <DownloadIcon />
        </IconButton>

      </Toolbar>
    </AppBar>
  );
};
