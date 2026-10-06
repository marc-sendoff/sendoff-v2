/* Motion's animation engine loads as its own chunk so the main bundle stays
   light. domMax (not domAnimation) because the trip grid uses layout
   animations. Pattern from motion.dev docs: LazyMotion + m components, with
   the features re-exported from a file the app pulls in via dynamic import. */
import { domMax } from "motion/react";
export default domMax;
