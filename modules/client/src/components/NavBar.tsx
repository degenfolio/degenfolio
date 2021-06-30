import React, { useContext } from "react";
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
import { Asset, Assets, FiatCurrencies } from "@valuemachine/types";

import { AccountContext } from "./AccountManager";

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
    display: "flex",
  },
  selector: {
    padding: theme.spacing(1),
    display: "flex",
  }
}));

export const NavBar = ({
  syncing,
  unit,
  setUnit,
}: { syncing: { state: boolean, msg: string }, unit: Asset, setUnit: (val: Asset) => void }) => {

  const { syncAddressBook } = useContext(AccountContext);
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

        <Typography className={classes.sync}>
          {syncing.state
            ? syncing.msg 
            : `Synced`
          }
        </Typography>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="sync"
          disabled={syncing.state}
          onClick={syncAddressBook}
        >
          <SyncIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};
