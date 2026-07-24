import type { InspectMap } from "./types";
import { METHOD } from "./method";
import { GROCERY_BUDDY } from "./grocery-buddy";
import { PROCUREMENT_AGENT } from "./procurement-agent";
import { JIM } from "./jim";
import { DJ_AGENT } from "./dj-agent";
import { M_CLONE } from "./m-clone";

/**
 * Registry of click-to-inspect excerpts, keyed by the `inspect` prop a
 * SystemDeepDive declares in MDX. A missing key simply disables the
 * feature for that dossier — nothing breaks.
 */
export const INSPECT: Record<string, InspectMap> = {
  method: METHOD,
  "grocery-buddy": GROCERY_BUDDY,
  "procurement-agent": PROCUREMENT_AGENT,
  jim: JIM,
  "dj-agent": DJ_AGENT,
  "m-clone": M_CLONE,
};

export type { InspectEntry, InspectMap } from "./types";
