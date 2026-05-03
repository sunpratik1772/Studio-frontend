import { createRoot } from "react-dom/client";
import App from "./App";
import { setBaseUrl } from "@workspace/api-client-react";
import "./index.css";

// Point the generated API client at the backend.
//
// Order of precedence:
//   1. VITE_API_BASE_URL injected at build time (recommended for Cloud Run).
//   2. Empty string → relative URLs (same-origin proxy, e.g. behind nginx /api/*).
const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
if (apiBase) setBaseUrl(apiBase);

createRoot(document.getElementById("root")!).render(<App />);
