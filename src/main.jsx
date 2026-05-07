import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Register service worker with better update handling
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Only register in production
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: false, // Don't activate immediately
      onNeedRefresh() {
        // New content available, show a prompt
        const shouldUpdate = window.confirm(
          'New version available! Click OK to update and reload.'
        );
        if (shouldUpdate) {
          updateSW(true); // Force update
        }
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
      onRegistered(registration) {
        console.log('Service Worker registered');
        // Check for updates every hour
        if (registration) {
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        }
      },
      onRegisterError(error) {
        console.error('Service Worker registration error:', error);
      }
    });
  }).catch(err => {
    console.error('Failed to load PWA register:', err);
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
