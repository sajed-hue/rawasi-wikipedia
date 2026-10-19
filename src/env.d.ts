/// <reference types="vite/client" />

// Strongly-typed frontend environment variables.
// Only VITE_-prefixed values are exposed to the client bundle (public).
// Backend secrets (service accounts, DB strings, private keys) MUST NOT appear here.
interface ImportMetaEnv {
  /** Base URL of the ASP.NET Core Heritage API, no trailing slash. e.g. https://localhost:7111 */
  readonly VITE_API_BASE_URL: string;

  /** Firebase Web (client) config — public, safe to ship in the bundle. */
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
