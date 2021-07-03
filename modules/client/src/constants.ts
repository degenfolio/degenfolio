import { Guards } from "@degenfolio/adapters";
import {
  AddressBookJson,
  AddressCategories,
} from "@valuemachine/types";
import { getEmptyAddressBook } from "@valuemachine/utils";

export const Examples = {
  Polygon: "Polygon",
  Idle: "Idle",
  Custom: "Custom",
};

export const getExampleData = (example: string): AddressBookJson =>
  example === Examples.Idle ? [{
    name: "IdleUser",
    address: "0x5bCfC2dee33fBD19771d4063C15cFB6dD555bb4C",
    category: AddressCategories.Self,
    guard: Guards.USD,
  }] : example === Examples.Polygon ? [{
    name: "PolygonUser",
    address: "0x8266C20Cb25A5E1425cb126D78799B2A138B6c46",
    category: AddressCategories.Self,
    guard: Guards.INR,
  }] : getEmptyAddressBook();

