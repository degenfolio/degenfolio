import {
  AddressEntry,
  AddressCategory,
} from "@valuemachine/types";
import { fmtAddressEntry } from "@valuemachine/utils";

import { Guards } from "../enums";

export const setAddressCategory = (category: AddressCategory) =>
  (entry: Partial<AddressEntry>): AddressEntry =>
    fmtAddressEntry({
      ...entry,
      category,
      guard: Guards.MATIC,
    } as AddressEntry);
