import { useEffect, useState } from "react";
import api from "./api";
import Login from "./Login";
import Chat from './Chat';
import Dashboard from './Dashboard';
function Home({ user, onLogout }) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome, {user?.username || user?.name || user?.email}</h2>
      <p>✅ You’re logged in. Next we’ll add chat UI.</p>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Helper to verify token & fetch current user
  const verifyTokenAndLoadUser = async (tkn) => {
    if (!tkn) return null;
    try {
      // ensure axios attaches token
      api.defaults.headers.common["Authorization"] = `Bearer ${tkn}`;

      // --- START OF FIX ---
      // The original line was: await api.get("/users/me");
      // This was sending the request to the wrong port (3001).
      // We must use the full URL to your backend server on port 5000.
      const res = await api.get("http://localhost:5000/api/users/me");
      // --- END OF FIX ---

      console.log("verifyTokenAndLoadUser -> /users/me OK", res.data);
      return res.data.user || null;
    } catch (err) {
      // log full debug info
      console.error("verifyTokenAndLoadUser error:", err?.response || err);
      return null;
    }
  };

  // run once on mount (in case token exists from previous session)
  useEffect(() => {
    (async () => {
      if (!token) return setUser(null);

      const u = await verifyTokenAndLoadUser(token);
      if (u) {
        setUser(u);
      } else {
        // token invalid or route failed — keep token but allow debugging:
        // Option A (safer): clear token and force login
        // localStorage.removeItem("token"); setToken(null); setUser(null);
        // Option B (less strict): just clear user and keep token for retry
        setUser(null);
        console.warn("Token verification failed — user cleared. Check network / backend logs.");
      }
    })();
  }, [token]);

  // called by Login component on successful login
  const handleLoginSuccess = async (loginData) => {
    // loginData should be { token, user } from backend login response
    if (!loginData?.token) {
      console.error("handleLoginSuccess called with no token:", loginData);
      return;
    }

    localStorage.setItem("token", loginData.token);
    setToken(loginData.token);

    // Immediately verify & fetch authoritative user from server
    const u = await verifyTokenAndLoadUser(loginData.token);
    if (u) {
      setUser(u);
    } else {
      // If verify failed, fallback to whatever backend returned (optional)
      setUser(loginData.user || null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    api.defaults.headers.common["Authorization"] = undefined;
  };

  // If not logged in, show login and pass callback name onSuccess
  if (!token || !user) return <Login onSuccess={handleLoginSuccess} />;

  return <Dashboard user={user} onLogout={handleLogout} />;
  //return <Chat conversationId="conv:demo" user={user} onLogout={handleLogout} />;
}