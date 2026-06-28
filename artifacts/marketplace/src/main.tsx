import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);

import { onCLS, onFCP, onLCP, onTTFB, onINP } from "web-vitals";

function reportWebVitals(_metric: { name: string; value: number; rating: string }) {
  // intentionally empty — console output removed
}

onCLS(reportWebVitals);
onFCP(reportWebVitals);
onLCP(reportWebVitals);
onTTFB(reportWebVitals);
onINP(reportWebVitals);
