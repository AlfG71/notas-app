import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";
import { getStoredSession, clearSession } from "./supabase.js";

function Root() {
  const [route, setRoute]         = useState(window.location.pathname);
  const [authSession, setAuth]    = useState(null);
  const [authChecked, setChecked] = useState(false);

  // Simple client-side routing
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    const stored = getStoredSession();
    if (stored?.access_token) setAuth(stored);
    setChecked(true);
  }, []);

  function navigate(path) {
    window.history.pushState({}, "", path);
    setRoute(path);
  }

  function handleLogin(session) {
    setAuth(session);
    navigate("/dashboard");
  }

  function handleLogout() {
    clearSession();
    setAuth(null);
    navigate("/");
  }

  if (!authChecked) return null;

  // Dashboard route — protected
  if (route === "/dashboard") {
    if (!authSession) return <Login onLogin={handleLogin}/>;
    return <Dashboard authSession={authSession} onLogout={handleLogout}/>;
  }

  // Login route
  if (route === "/login") {
    if (authSession) { navigate("/dashboard"); return null; }
    return <Login onLogin={handleLogin}/>;
  }

  // Default — widget
  return <App/>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><Root/></React.StrictMode>
);
