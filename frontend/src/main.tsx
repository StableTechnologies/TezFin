import "@fontsource-variable/fraunces";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/spline-sans-mono/400.css";
import "@fontsource/spline-sans-mono/500.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/global.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("TezFin application root is missing");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
