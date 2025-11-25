//Import Mixpanel SDK
import mixpanel from "mixpanel-browser";

// Create an instance of the Mixpanel object, your token is already added to this snippet
mixpanel.init('bfae4fe5c827d9d44ba994028b30d36a', {
  autocapture: true,
  record_sessions_percent: 100,
})

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
