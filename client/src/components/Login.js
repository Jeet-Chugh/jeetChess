import React, { useState, useContext } from 'react';
import { login } from '../services/api';
import { AuthContext } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const { login: authLogin } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await login(username, password);
      if (response.data.accessToken && response.data.refreshToken) {
        authLogin(response.data.accessToken, response.data.refreshToken, rememberMe);
        navigate('/')
      }
    } catch (error) {
      console.error('Login failed', error);
      setError("Invalid Credentials");
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <form className="bg-gray-900 p-8 rounded-lg shadow-lg text-white w-full max-w-sm" onSubmit={handleLogin}>
      <h2 className="text-2xl font-bold mb-3 text-center">Login</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center text-sm">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="mr-2" />
            Remember me
          </label>
        </div>
        <button type="submit" className="w-full py-2 bg-green-500 hover:bg-green-600 rounded text-white font-semibold">
          Log In
        </button>
        <div className="mt-4 text-center text-gray-400 text-sm">
          New? <a href="/register" className="text-green-500 hover:underline">Create an Account</a> - and start playing!
        </div>
      </form>
    </div>
  );
};

export default Login;