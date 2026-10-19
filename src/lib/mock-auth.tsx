// Compatibility layer — now backed by real Firebase authentication.
//
// This module keeps the original `useMockAuth` / `MockAuthProvider` API so that
// finalized components (Header, Footer, AccountCard) and existing route guards
// keep working unchanged, while the actual auth state comes from Firebase via
// `@/lib/auth`. New code should import `useAuth` from `@/lib/auth` directly.

import { AuthProvider, useAuth } from "@/lib/auth";

/** The app's two UI-facing roles. The backend's "Contributor" maps to "user" here. */
export type Role = "user" | "admin";

/** Provider kept under the old name; it is the real Firebase AuthProvider. */
export const MockAuthProvider = AuthProvider;

/**
 * useMockAuth — adapts the Firebase auth state to the original mock shape.
 * - role: "admin" when the backend role is Admin, otherwise "user".
 * - name/email: from the backend profile, falling back to the Firebase user.
 * - signIn: deprecated no-op (sign-in now happens through Firebase on the
 *   login/signup pages via useAuth); kept so older callers don't break.
 */
export function useMockAuth() {
  const auth = useAuth();
  const role: Role | null = auth.role ? (auth.role === "Admin" ? "admin" : "user") : null;

  return {
    isLoggedIn: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    role,
    name: auth.profile?.displayName ?? auth.firebaseUser?.displayName ?? "",
    email: auth.profile?.email ?? auth.firebaseUser?.email ?? "",
    isReady: auth.isReady,
    signIn: (_role?: Role, _name?: string, _email?: string) => {
      if (import.meta.env.DEV) {
        console.warn("useMockAuth().signIn is a no-op; sign in through Firebase (useAuth).");
      }
    },
    updateName: (name: string) => {
      void auth.updateDisplayName(name);
    },
    signOut: () => {
      void auth.signOut();
    },
  };
}
