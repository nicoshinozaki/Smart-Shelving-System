import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
const rootElement = document.getElementById("app");
if (rootElement) {
  createRoot(document.getElementById("app")).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}else{
  console.error("Root element with ID 'data' not found!");
}