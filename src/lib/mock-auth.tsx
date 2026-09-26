import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type MockAuth = {
  isLoggedIn: boolean;
  signIn: () => void;
  signOut: () => void;
};

const MockAuthContext = createContext<MockAuth | null>(null);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const value = useMemo<MockAuth>(
    () => ({
      isLoggedIn,
      signIn: () => setIsLoggedIn(true),
      signOut: () => setIsLoggedIn(false),
    }),
    [isLoggedIn],
  );
  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be used inside MockAuthProvider");
  return ctx;
}
