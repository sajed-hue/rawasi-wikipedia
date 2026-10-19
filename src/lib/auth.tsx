// Firebase-backed authentication provider.
//
// Replaces the temporary mock-auth. It is the single source of truth for the
// signed-in user and the backend-resolved profile/role. Firebase is the token
// authority; the backend is the authorization authority. Role is used ONLY for
// UI affordances — the backend still enforces every action.
//
// NOTE: This provider is not yet mounted in __root.tsx. The swap from
// MockAuthProvider happens in the auth milestone, together with the login/signup
// rewire, so the branch stays in a working state throughout.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";

import { api, setApiTokenProvider, setApiUnauthorizedHandler } from "@/lib/api/client";
import { isApiError } from "@/lib/api/problem";
import type { UpdateCurrentUserRequest, UserProfileDto, UserRole } from "@/lib/api/types";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  /** True once the initial Firebase auth state has resolved; gate redirects on this. */
  isReady: boolean;
  isAuthenticated: boolean;
  firebaseUser: User | null;
  /** Backend profile, hydrated from GET /api/users/me after sign-in. */
  profile: UserProfileDto | null;
  /** Backend role string, or null when signed out / not yet hydrated. */
  role: UserRole | null;
  isAdmin: boolean;

  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Refetch GET /api/users/me (e.g. after a profile edit). */
  reloadProfile: () => Promise<void>;
  /** PUT /api/users/me then refresh the local profile. */
  updateDisplayName: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED_MESSAGE =
  "Firebase is not configured. Set VITE_FIREBASE_* in .env.local to enable sign-in.";

function requireAuth() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error(NOT_CONFIGURED_MESSAGE);
  return auth;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const firebaseUserRef = useRef<User | null>(null);

  // Give the API client a way to fetch the current token and to react to a hard 401.
  useEffect(() => {
    setApiTokenProvider(async (forceRefresh) => {
      const current = getFirebaseAuth()?.currentUser;
      if (!current) return null;
      return current.getIdToken(forceRefresh);
    });
    setApiUnauthorizedHandler(() => {
      // Backend rejected the token (expired or account deactivated). Clear the session.
      void getFirebaseAuth()?.signOut();
    });
    return () => setApiUnauthorizedHandler(null);
  }, []);

  const loadProfile = useCallback(async (): Promise<void> => {
    try {
      const me = await api.get<UserProfileDto>("/api/users/me", { auth: "required" });
      setProfile(me);
      setStatus("authenticated");
    } catch (error) {
      // 401 (inactive/expired) or 403: treat as signed out and clear Firebase session.
      if (isApiError(error) && (error.kind === "authentication" || error.kind === "authorization")) {
        setProfile(null);
        setStatus("unauthenticated");
        void getFirebaseAuth()?.signOut();
        return;
      }
      // Transient/network error: keep the Firebase session but leave profile unhydrated.
      setStatus("authenticated");
      throw error;
    }
  }, []);

  // Observe Firebase auth state. Runs on the client only; on the server (or when
  // Firebase is unconfigured) we resolve immediately to "unauthenticated".
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setStatus("unauthenticated");
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      firebaseUserRef.current = user;
      setFirebaseUser(user);
      if (user) {
        void loadProfile().catch(() => {
          // Error already reflected in state; swallow to avoid unhandled rejection.
        });
      } else {
        setProfile(null);
        setStatus("unauthenticated");
      }
    });
    return unsubscribe;
  }, [loadProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(requireAuth(), email, password);
    // onAuthStateChanged hydrates the profile.
  }, []);

  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const auth = requireAuth();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && credential.user) {
        await updateProfile(credential.user, { displayName });
      }
      // The first authenticated call to the backend provisions the local user row.
    },
    [],
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(requireAuth(), email);
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
    setProfile(null);
    setStatus("unauthenticated");
  }, []);

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      const payload: UpdateCurrentUserRequest = { displayName };
      await api.put<void>("/api/users/me", payload, { auth: "required" });
      await loadProfile();
    },
    [loadProfile],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isReady: status !== "loading",
      isAuthenticated: status === "authenticated",
      firebaseUser,
      profile,
      role: profile?.role ?? null,
      isAdmin: profile?.role === "Admin",
      signInWithEmail,
      registerWithEmail,
      sendPasswordReset,
      signOut,
      reloadProfile: loadProfile,
      updateDisplayName,
    }),
    [
      status,
      firebaseUser,
      profile,
      signInWithEmail,
      registerWithEmail,
      sendPasswordReset,
      signOut,
      loadProfile,
      updateDisplayName,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Read the auth state. Throws if used outside <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Exposed for diagnostics / conditional UI before config is wired. */
export { isFirebaseConfigured };
