import React, { createContext, useState, useEffect } from 'react';
import { setAuthToken, refreshToken } from '../services/api';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      const refreshTokenValue = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      
      if (accessToken && refreshTokenValue) {
        try {
          const decodedToken = jwtDecode(accessToken);
          if (Date.now() >= decodedToken.exp * 1000) {
            // Access token expired
            const newTokens = await refreshToken(refreshTokenValue);
            if (newTokens) {
              setAuthState(newTokens.accessToken, newTokens.refreshToken, localStorage.getItem('accessToken') !== null);
            } else {
              logout();
            }
          } else {
            // Access token is still valid
            setAuthState(accessToken, refreshTokenValue, localStorage.getItem('accessToken') !== null);
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const setAuthState = (accessToken, refreshTokenValue, rememberMe) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('accessToken', accessToken);
    storage.setItem('refreshToken', refreshTokenValue);
    setAuthToken(accessToken);
    const decodedToken = jwtDecode(accessToken);
    setUser({
      id: decodedToken.userId,
      username: decodedToken.username,
      name: decodedToken.name,
      email: decodedToken.email
    });
  };

  const login = async (accessToken, refreshToken, rememberMe) => {
    setAuthState(accessToken, refreshToken, rememberMe);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    setAuthToken(null);
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>; // Change eventually
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;