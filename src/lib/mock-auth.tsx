import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// The two account types in the app. Admins review posts; users write them.
// Admin accounts are created by the backend team, never through signup.
export type Role = "user" | "admin";

type MockAuth = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  role: Role | null;
  name: string;
  email: string;
  isReady: boolean;
  signIn: (role?: Role, name?: string, email?: string) => void;
  updateName: (name: string) => void;
  signOut: () => void;
};

// Keys used to remember the fake login in the browser, so a refresh
// doesn't log you out. Temporary: Firebase handles this later.
const STORAGE_KEY = "rawasi-mock-role";
const NAME_KEY = "rawasi-mock-name";
const EMAIL_KEY = "rawasi-mock-email";
const MockAuthContext = createContext<MockAuth | null>(null);

/** Saves one value in the browser; ignores errors if storage is blocked. */
function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore: storage unavailable
  }
}

/** Deletes the saved values from the browser. */
function forget(...keys: string[]) {
  try {
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore: storage unavailable
  }
}

/**
 * MockAuthProvider: holds the fake login state for the whole app.
 * - role: "user", "admin", or null when nobody is logged in.
 * - name, email: the account details shown in the header and account card.
 * - isReady: true once the saved login has been read from the browser.
 *   Pages wait for this so they don't redirect too early.
 * - signIn(role, name, email): logs in and saves the details.
 * - updateName(name): changes the display name (later: PUT /api/users/me).
 * - signOut(): logs out and clears the saved details.
 */
export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isReady, setIsReady] = useState(false);

  // Runs once when the site loads: reads any saved login from the browser.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "user" || saved === "admin") setRole(saved);
      setName(localStorage.getItem(NAME_KEY) ?? "");
      setEmail(localStorage.getItem(EMAIL_KEY) ?? "");
    } catch {
      // storage unavailable, stay signed out
    }
    setIsReady(true);
  }, []);

  const value = useMemo<MockAuth>(
    () => ({
      role,
      name,
      email,
      isReady,
      isLoggedIn: role !== null,
      isAdmin: role === "admin",
      signIn: (next: Role = "user", displayName = "", mail = "") => {
        setRole(next);
        setName(displayName);
        setEmail(mail);
        remember(STORAGE_KEY, next);
        remember(NAME_KEY, displayName);
        remember(EMAIL_KEY, mail);
      },
      updateName: (newName: string) => {
        setName(newName);
        remember(NAME_KEY, newName);
      },
      signOut: () => {
        setRole(null);
        setName("");
        setEmail("");
        forget(STORAGE_KEY, NAME_KEY, EMAIL_KEY);
      },
    }),
    [role, name, email, isReady],
  );
  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

/**
 * useMockAuth: the shortcut components use to read the login state,
 * e.g. const { isLoggedIn, isAdmin, name } = useMockAuth();
 * Throws an error if used outside MockAuthProvider.
 */
export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be used inside MockAuthProvider");
  return ctx;
}