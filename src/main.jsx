import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App.jsx";

const LEGACY_API_BASE = "http://localhost:5000";
const API_BASE_URL = import.meta.env.VITE_API_URL || LEGACY_API_BASE;

axios.interceptors.request.use((config) => {
  if (
    typeof config.url === "string" &&
    config.url.startsWith(LEGACY_API_BASE) &&
    API_BASE_URL !== LEGACY_API_BASE
  ) {
    config.url = `${API_BASE_URL}${config.url.slice(LEGACY_API_BASE.length)}`;
  }
  return config;
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
