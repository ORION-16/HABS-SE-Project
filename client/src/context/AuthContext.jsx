import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getMe } from '../api/auth.api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: read from localStorage and validate token expiry
  useEffect(() => {
    const storedToken = localStorage.getItem('habs_token');
    const storedUser = localStorage.getItem('habs_user');

    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        const now = Date.now() / 1000;

        if (decoded.exp && decoded.exp > now) {
          setToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else {
          // Token expired — clear
          localStorage.removeItem('habs_token');
          localStorage.removeItem('habs_user');
        }
      } catch {
        localStorage.removeItem('habs_token');
        localStorage.removeItem('habs_user');
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('habs_token', newToken);
    localStorage.setItem('habs_user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('habs_token');
    localStorage.removeItem('habs_user');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe();
      if (res.data.success) {
        setUser(res.data.data);
        localStorage.setItem('habs_user', JSON.stringify(res.data.data));
      }
    } catch {
      // silently fail
    }
  }, []);

  const isAuthenticated = !!token;
  const role = user?.role || null;

  const value = {
    token,
    user,
    loading,
    isAuthenticated,
    role,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
