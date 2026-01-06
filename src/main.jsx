import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

console.log('main.jsx executing...');

// Error boundary for the entire app
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Main App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>Application Error</h1>
          <p>Something went wrong: {this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
          <details style={{ marginTop: '10px' }}>
            <summary>Error Details</summary>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  const root = document.getElementById("root");
  if (root) {
    console.log('Rendering App with error boundary...');
    ReactDOM.createRoot(root).render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    );
    console.log('App rendered successfully');
  } else {
    console.error('Root element not found!');
    document.body.innerHTML = '<h1>Error: Root element not found!</h1>';
  }
} catch (error) {
  console.error('Critical error in main.jsx:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif; color: red;">
      <h1>Critical Application Error</h1>
      <p>Error: ${error.message}</p>
    </div>
  `;
}
