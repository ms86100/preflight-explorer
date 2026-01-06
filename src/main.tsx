import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// SPA deep-link refresh support:
// Some static hosts serve 404 for non-root routes. Our public/404.html redirects to
// /?__redirect=<encoded-path>, and we restore the original URL here before React mounts.
try {
  const url = new URL(window.location.href);
  const redirect = url.searchParams.get("__redirect");
  if (redirect) {
    url.searchParams.delete("__redirect");
    const targetPath = decodeURIComponent(redirect);
    window.history.replaceState(null, "", targetPath);
  }
} catch {
  // Intentionally ignore URL parsing failures
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
