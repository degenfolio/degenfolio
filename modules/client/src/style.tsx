import { Theme } from "@material-ui/core/styles";

export const getFabStyle = (theme: Theme): any => ({
  position: "fixed",
  bottom: theme.spacing(8),
  right: theme.spacing(2),
});