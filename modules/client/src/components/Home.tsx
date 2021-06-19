import React, { useState } from "react";
import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import { makeStyles } from "@material-ui/core/styles";
import TabContext from "@material-ui/lab/TabContext";
import TabPanel from "@material-ui/lab/TabPanel";
import AccountIcon from "@material-ui/icons/AccountCircle";
import BarChartIcon from '@material-ui/icons/BarChart';

const useStyles = makeStyles( theme => ({
  appbar: {
    flex: 1,
    bottom: 0,
    top: 'auto',
  },
  panel: {
    marginTop: theme.spacing(8),
  },
}));

export const Home = () => {
  const classes = useStyles();
  const [tab, setTab] = useState("wallet");

  const updateSelection = (event: React.ChangeEvent<{}>, selectedTab: string) => {
    setTab(selectedTab);
  };

  return (
    <>
      <TabContext value={tab}>
        <TabPanel value="account" className={classes.panel}>
          Account
        </TabPanel>
        <TabPanel value="wallet" className={classes.panel}> Portfolio </TabPanel>

        <AppBar color="inherit" position="fixed" className={classes.appbar}>
          <Tabs
            value={tab}
            onChange={updateSelection}
            indicatorColor="primary"
            variant="fullWidth"
          >
            <Tab value="wallet" icon={<BarChartIcon />} aria-label="wallet" />
            <Tab value="account" icon={<AccountIcon />} aria-label="account" />

          </Tabs>
        </AppBar>
      </TabContext>
    </>
  )
}