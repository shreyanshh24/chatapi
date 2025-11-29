// src/Login.js
import { useState } from 'react';
import axios from 'axios';
import './Login.css'; // Import the new styles

const AuthForm = ({ isLogin, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        onSubmit(response.data);
      } else {
        await axios.post('http://localhost:5000/api/auth/signup', { username, email, password });
        alert('Signup successful! Please log in.');
        // Optionally switch to login mode automatically here if you lifted state up
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || `Failed to ${isLogin ? 'login' : 'signup'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {!isLogin && (
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            placeholder="Choose a username"
            required
          />
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          placeholder="name@example.com"
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          placeholder="••••••••"
          required
        />
      </div>

      {error && <div className="error-msg">{error}</div>}

      <button type="submit" className="login-btn">
        {isLogin ? 'Sign In' : 'Create Account'}
      </button>
    </form>
  );
};

export default function Login({ onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">
          {isLogin ? 'Welcome Back' : 'Join Chat App'}
        </h2>

        <AuthForm isLogin={isLogin} onSubmit={onSuccess} />

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="toggle-text"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}