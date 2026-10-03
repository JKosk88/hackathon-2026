"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { clearStoredTokens } from "@/lib/api";
import { loginWithEmail } from "@/lib/auth";

export type AuthUser = {
  name: string;
  email: string;
  provider: "email";
  token?: string;
};

interface AuthContextValue {
  user: AuthUser | null;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_USERNAME = "HY-Jury";
const DEMO_PASSWORD = "zyvbiv-xeckur-4qyFvy";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const rawUser = window.localStorage.getItem("cityVibe-user");

    if (!rawUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as AuthUser;
      setUser(parsedUser);
    } catch {
      window.localStorage.removeItem("cityVibe-user");
    }
  }, []);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem("cityVibe-user", JSON.stringify(user));
      if (user.token) {
        window.localStorage.setItem("cityVibe-token", user.token);
      }
      return;
    }

    window.localStorage.removeItem("cityVibe-user");
    window.localStorage.removeItem("cityVibe-token");
    clearStoredTokens();
  }, [user]);

  const signInWithEmail = async (
    email: string,
    password: string,
  ): Promise<{ ok: boolean; message?: string }> => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return { ok: false, message: "Username and password are required." };
    }

    try {
      const backendUser = await loginWithEmail(trimmedEmail, trimmedPassword);

      setUser({
        name:
          backendUser.name ||
          backendUser.email.split("@")[0] ||
          "CityVibe User",
        email: backendUser.email,
        provider: "email",
        token: backendUser.token,
      });

      return { ok: true };
    } catch (error) {
      if (trimmedEmail === DEMO_USERNAME && trimmedPassword === DEMO_PASSWORD) {
        setUser({
          name: DEMO_USERNAME,
          email: DEMO_USERNAME,
          provider: "email",
        });
        return { ok: true };
      }

      const fallbackMessage =
        error instanceof Error && error.message
          ? error.message
          : "Unable to sign in with the backend.";

      setUser({
        name: trimmedEmail || "CityVibe User",
        email: trimmedEmail || "CityVibe User",
        provider: "email",
      });

      return { ok: false, message: fallbackMessage };
    }
  };

  const signOut = () => {
    setUser(null);
    clearStoredTokens();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signInWithEmail,
      signOut,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
