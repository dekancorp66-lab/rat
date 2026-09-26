import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, type AuthUser } from "./client";

const TOKEN_KEY = "jengaai_token";
const USER_KEY = "jengaai_user";

type RegisterInput = { full_name: string; email: string; phone: string; password: string };

type SimpleAuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
};

const SimpleAuthContext = createContext<SimpleAuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Runs once on mount, client-side only — localStorage doesn't exist during
  // SSR, so we hydrate after mount rather than in useState's initializer.
  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = readStoredUser();
    if (storedToken) {
      setToken(storedToken);
      setUser(storedUser);
      // Confirm the token is still valid and refresh the cached profile.
      authApi
        .me(storedToken)
        .then((fresh) => {
          setUser(fresh);
          window.localStorage.setItem(USER_KEY, JSON.stringify(fresh));
        })
        .catch(() => {
          window.localStorage.removeItem(TOKEN_KEY);
          window.localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  function persist(access_token: string, freshUser: AuthUser) {
    window.localStorage.setItem(TOKEN_KEY, access_token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
    setToken(access_token);
    setUser(freshUser);
  }

  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password });
    persist(res.access_token, res.user);
  }

  async function register(data: RegisterInput) {
    const res = await authApi.register(data);
    persist(res.access_token, res.user);
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <SimpleAuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const ctx = useContext(SimpleAuthContext);
  if (!ctx) throw new Error("useSimpleAuth must be used within SimpleAuthProvider");
  return ctx;
}
