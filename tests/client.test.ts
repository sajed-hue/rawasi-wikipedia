import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

// The client reads the base URL lazily (per request), so set it before any call.
process.env.VITE_API_BASE_URL = "http://api.test/";

import { buildQueryString, request, setApiTokenProvider, setApiUnauthorizedHandler } from "../src/lib/api/client";
import { isApiError } from "../src/lib/api/problem";

const realFetch = globalThis.fetch;

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("buildQueryString", () => {
  test("drops null, undefined and empty values", () => {
    expect(buildQueryString({ page: 1, search: "", categoryId: undefined, sort: null })).toBe("?page=1");
    expect(buildQueryString({})).toBe("");
  });

  test("encodes Arabic search text", () => {
    expect(buildQueryString({ search: "صابون" })).toBe(`?search=${encodeURIComponent("صابون")}`);
  });
});

describe("request", () => {
  let tokens: Array<boolean | undefined>;

  beforeEach(() => {
    tokens = [];
    setApiTokenProvider(async (forceRefresh) => {
      tokens.push(forceRefresh);
      return forceRefresh ? "fresh-token" : "stale-token";
    });
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    setApiUnauthorizedHandler(null);
  });

  test("joins the base URL without a double slash and returns JSON", async () => {
    const fetchMock = mock(async () => jsonResponse(200, { ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await request<{ ok: boolean }>("/api/categories", { query: { page: 2 } });

    expect(result).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://api.test/api/categories?page=2");
  });

  test("does not attach a token when auth is 'none'", async () => {
    const fetchMock = mock(async (_url: string, init: RequestInit) => {
      expect((init.headers as Record<string, string>)["Authorization"]).toBeUndefined();
      return jsonResponse(200, []);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await request("/api/heritage-posts", { auth: "none" });
    expect(tokens).toEqual([]);
  });

  test("on 401, refreshes the token once and retries", async () => {
    const seen: string[] = [];
    globalThis.fetch = mock(async (_url: string, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>)["Authorization"] ?? "";
      seen.push(auth);
      return auth === "Bearer fresh-token" ? jsonResponse(200, { id: "me" }) : jsonResponse(401, {});
    }) as unknown as typeof fetch;

    const me = await request<{ id: string }>("/api/users/me", { auth: "required" });

    expect(me).toEqual({ id: "me" });
    expect(seen).toEqual(["Bearer stale-token", "Bearer fresh-token"]);
    expect(tokens).toEqual([false, true]);
  });

  test("a second 401 calls the unauthorized handler and does not loop", async () => {
    let calls = 0;
    const onUnauthorized = mock(() => {});
    setApiUnauthorizedHandler(onUnauthorized);
    globalThis.fetch = mock(async () => {
      calls += 1;
      return jsonResponse(401, { title: "Unauthorized" });
    }) as unknown as typeof fetch;

    const error = await request("/api/users/me", { auth: "required" }).catch((e: unknown) => e);

    expect(isApiError(error) && error.kind).toBe("authentication");
    expect(calls).toBe(2);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  test("required auth with no signed-in user fails fast without a request", async () => {
    setApiTokenProvider(async () => null);
    const fetchMock = mock(async () => jsonResponse(200, {}));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const error = await request("/api/users/me", { auth: "required" }).catch((e: unknown) => e);

    expect(isApiError(error) && error.kind).toBe("authentication");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("maps a thrown fetch to a network error", async () => {
    globalThis.fetch = mock(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;

    const error = await request("/api/categories").catch((e: unknown) => e);
    expect(isApiError(error) && error.kind).toBe("network");
  });

  test("returns undefined for 204 No Content", async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
    expect(await request("/api/heritage-posts/x/submit", { method: "POST", auth: "required" })).toBeUndefined();
  });
});
