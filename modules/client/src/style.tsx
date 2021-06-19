import { Theme } from "@material-ui/core/styles";

export const getFabStyle = (theme: Theme): any => ({
  position: "fixed",
  bottom: theme.spacing(8),
  [theme.breakpoints.up("lg")]: {
    right: "30%",
  },
  [theme.breakpoints.down("md")]: {
    right: theme.spacing(2),
  },
});