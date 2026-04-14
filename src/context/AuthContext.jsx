import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { loginUser } from "../services/authService";
import { AuthContext } from "./AuthContextObject";

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  );
  const [user, setUser] = useState(() => getStoredUser());
  const [isLoading] = useState(false);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (credentials) => {
    const { token: nextToken, user: nextUser } = await loginUser(credentials);

    if (!nextToken) {
      throw new Error("Token missing in login response");
    }

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, nextToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
      hasRole: (role) => user?.role === role,
    }),
    [token, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
