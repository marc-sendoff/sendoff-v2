import React from "react";
import ReactDOM from "react-dom/client";
import Landing from "./Landing.jsx";
import "./index.css";
import "./analytics.js";

/* Until December the site is the signup page and nothing else.
   To open the full app: import Sendoff from "./App.jsx" and render that
   instead. App.jsx and every component it uses are still here, untouched. */
ReactDOM.createRoot(document.getElementById("root")).render(<Landing />);
