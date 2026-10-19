// HTTP security headers for every SSR response (applied in src/server.ts).
//
// Pure functions with explicit inputs so they can be unit-tested. CSP and HSTS
// are production-only: in development they would break Vite's HMR (websocket +
// injected scripts) and HSTS is meaningless over http://localhost.

/** Firebase Auth endpoints used by email/password sign-in and token refresh. */
const FIREBASE_CONNECT = [
  "https://identitytoolkit.googleapis.com",
  "https://securetoken.googleapis.com",
  "https://firebaseinstallations.googleapis.com",
];

/** Lovable embeds the site in its editor; allow that, block everyone else. */
const FRAME_ANCESTORS = ["'self'", "https://lovable.dev", "https://*.lovable.dev", "https://*.lovable.app"];

/** Origin of the backend API, or "" if the URL is missing/invalid. */
export function originOf(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * Content-Security-Policy for the app.
 * - script-src needs 'unsafe-inline': TanStack Start SSR injects inline hydration
 *   scripts. External scripts are still blocked.
 * - img-src allows the API origin (media proxy) plus blob: (private-image previews).
 */
export function buildCsp(apiOrigin: string): string {
  const api = apiOrigin ? [apiOrigin] : [];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    "img-src": ["'self'", "data:", "blob:", ...api],
    "connect-src": ["'self'", ...api, ...FIREBASE_CONNECT],
    "frame-src": ["https://*.firebaseapp.com"],
    "frame-ancestors": FRAME_ANCESTORS,
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };
  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

/** Headers to add to a response. Existing headers of the same name are kept. */
export function securityHeaders(options: { isProd: boolean; apiOrigin: string; isHtml: boolean }): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  };
  if (options.isProd) {
    headers["Strict-Transport-Security"] = "max-age=31536000";
    if (options.isHtml) headers["Content-Security-Policy"] = buildCsp(options.apiOrigin);
  }
  return headers;
}

/** Returns a copy of `response` with the security headers applied. */
export function withSecurityHeaders(response: Response, options: { isProd: boolean; apiOrigin: string }): Response {
  const isHtml = (response.headers.get("content-type") ?? "").includes("text/html");
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders({ ...options, isHtml }))) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
