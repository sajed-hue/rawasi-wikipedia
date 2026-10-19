// Central API client. Every call to the Heritage backend goes through here.
//
// Responsibilities (and ONLY these):
//  - Base URL resolution from VITE_API_BASE_URL.
//  - Common header injection (Accept, Content-Type for JSON).
//  - Firebase ID token acquisition + attachment (via a registered provider, so this
//    module stays decoupled from Firebase and SSR-safe).
//  - JSON (de)serialization and binary/blob responses.
//  - Error mapping (HTTP status -> ApiError) and network/timeout/cancel abstraction.
//  - A single 401 -> refresh token -> retry-once attempt, per the integration guide.
//
// It does NOT enforce business rules, dictate UI copy, or decide authorization.

import { ApiError } from "./problem";

// ---------------------------------------------------------------------------
// Token provider + unauthorized hook (registered by the auth layer)
// ---------------------------------------------------------------------------

/** Returns a fresh Firebase ID token, or null when signed out. `forceRefresh` bypasses cache. */
export type TokenProvider = (forceRefresh?: boolean) => Promise<string | null>;

let tokenProvider: TokenProvider = async () => null;
let onUnauthorized: (() => void) | null = null;

/** Called by the auth layer once Firebase is ready. */
export function setApiTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

/** Called by the auth layer; invoked when a request stays 401 after a refresh attempt. */
export function setApiUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

// ---------------------------------------------------------------------------
// Request options
// ---------------------------------------------------------------------------

export type AuthMode = "required" | "optional" | "none";
export type ResponseKind = "json" | "blob" | "void";

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Query string params; null/undefined entries are dropped, values are URL-encoded. */
  query?: Record<string, QueryValue>;
  /** JSON request body (ignored when `form` is provided). */
  body?: unknown;
  /** Multipart body; let the browser set the Content-Type boundary (do not set it manually). */
  form?: FormData;
  /** Whether a token is attached. Default "none". */
  auth?: AuthMode;
  /** How to interpret the response body. Default "json". */
  responseKind?: ResponseKind;
  /** Caller cancellation (e.g. component unmount, new search keystroke). */
  signal?: AbortSignal;
  /** Per-request timeout in ms. Default 20000. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 20_000;

function baseUrl(): string {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) {
    throw new ApiError({
      kind: "unknown",
      status: null,
      message:
        "VITE_API_BASE_URL is not set. Configure it in .env.local before calling the API.",
    });
  }
  return url.replace(/\/+$/, "");
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const qs = query ? buildQueryString(query) : "";
  return `${baseUrl()}${normalizedPath}${qs}`;
}

/** Serialize a params object to a `?a=1&b=2` string, dropping null/undefined and encoding values. */
export function buildQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Combine the caller's AbortSignal with a timeout into one signal. */
function linkedSignal(
  callerSignal: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener("abort", onAbort, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (callerSignal) callerSignal.removeEventListener("abort", onAbort);
    },
  };
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    query,
    body,
    form,
    auth = "none",
    responseKind = "json",
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const url = buildUrl(path, query);

  const send = async (forceRefresh: boolean): Promise<Response> => {
    const headers: Record<string, string> = { Accept: "application/json" };

    // Attach the Firebase token when the route needs it.
    if (auth !== "none") {
      const token = await tokenProvider(forceRefresh);
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else if (auth === "required") {
        throw new ApiError({
          kind: "authentication",
          status: null,
          message: "You must be signed in to perform this action.",
        });
      }
    }

    // JSON body: set Content-Type. FormData: never set it (boundary is auto-generated).
    let payload: BodyInit | undefined;
    if (form) {
      payload = form;
    } else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }

    const { signal: combined, cleanup } = linkedSignal(signal, timeoutMs);
    try {
      return await fetch(url, {
        method,
        headers,
        signal: combined,
        ...(payload !== undefined ? { body: payload } : {}),
      });
    } catch (error) {
      // Distinguish a caller/timeout cancellation from a genuine transport failure.
      if (signal?.aborted) throw ApiError.canceled();
      if (error instanceof DOMException && error.name === "AbortError") {
        throw ApiError.canceled("Request timed out.");
      }
      throw ApiError.network();
    } finally {
      cleanup();
    }
  };

  let response = await send(false);

  // 401: try exactly one token refresh + retry, then give up (never loop).
  if (response.status === 401 && auth !== "none") {
    response = await send(true);
    if (response.status === 401) {
      onUnauthorized?.();
      throw ApiError.fromResponse(401, await parseJsonSafely(response));
    }
  }

  if (!response.ok) {
    throw ApiError.fromResponse(response.status, await parseJsonSafely(response));
  }

  if (responseKind === "void" || response.status === 204) {
    return undefined as T;
  }
  if (responseKind === "blob") {
    return (await response.blob()) as T;
  }
  return (await parseJsonSafely(response)) as T;
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

type HelperOptions = Omit<RequestOptions, "method" | "body" | "form">;

export const api = {
  get: <T>(path: string, options?: HelperOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  getBlob: (path: string, options?: HelperOptions) =>
    request<Blob>(path, { ...options, method: "GET", responseKind: "blob" }),

  post: <T>(path: string, body?: unknown, options?: HelperOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  postForm: <T>(path: string, form: FormData, options?: HelperOptions) =>
    request<T>(path, { ...options, method: "POST", form }),

  put: <T>(path: string, body?: unknown, options?: HelperOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),

  del: <T = void>(path: string, options?: HelperOptions) =>
    request<T>(path, { ...options, method: "DELETE", responseKind: "void" }),
};
