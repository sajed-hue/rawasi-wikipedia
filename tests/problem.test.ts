import { describe, expect, test } from "bun:test";

import { ApiError, isApiError, kindFromStatus } from "../src/lib/api/problem";
import { apiErrorMessage, fieldError } from "../src/lib/api/messages";

describe("kindFromStatus", () => {
  test.each([
    [400, "validation"],
    [401, "authentication"],
    [403, "authorization"],
    [404, "notFound"],
    [409, "conflict"],
    [413, "payloadTooLarge"],
    [429, "rateLimit"],
    [500, "server"],
    [503, "server"],
    [418, "unknown"],
  ] as const)("%i -> %s", (status, kind) => {
    expect(kindFromStatus(status)).toBe(kind);
  });
});

describe("ApiError.fromResponse", () => {
  test("parses an RFC 7807 validation problem", () => {
    const error = ApiError.fromResponse(400, {
      title: "Validation Failed",
      status: 400,
      detail: "One or more validation failures have occurred.",
      traceId: "00-abc",
      errors: { Title: ["'Title' must not be empty."] },
    });
    expect(error.kind).toBe("validation");
    expect(error.status).toBe(400);
    expect(error.traceId).toBe("00-abc");
    expect(error.firstFieldError("Title")).toBe("'Title' must not be empty.");
    expect(error.firstFieldError("Summary")).toBeUndefined();
    expect(isApiError(error)).toBe(true);
  });

  test("falls back to a generic message for non-problem bodies", () => {
    const error = ApiError.fromResponse(502, "<html>Bad gateway</html>");
    expect(error.kind).toBe("server");
    expect(error.message).toContain("502");
    expect(error.problem).toBeUndefined();
  });

  test("only network failures and 503 count as transient", () => {
    expect(ApiError.network().isTransient).toBe(true);
    expect(ApiError.fromResponse(503, {}).isTransient).toBe(true);
    expect(ApiError.fromResponse(500, {}).isTransient).toBe(false);
    expect(ApiError.fromResponse(400, {}).isTransient).toBe(false);
  });
});

describe("apiErrorMessage", () => {
  test("localizes by kind", () => {
    const conflict = ApiError.fromResponse(409, {});
    expect(apiErrorMessage(conflict, "en")).toContain("current state");
    expect(apiErrorMessage(conflict, "ar")).toContain("حالة");
  });

  test("appends the support id to server errors only", () => {
    expect(apiErrorMessage(ApiError.fromResponse(500, { traceId: "00-xyz" }), "en")).toContain("Support ID: 00-xyz");
    expect(apiErrorMessage(ApiError.fromResponse(404, { traceId: "00-xyz" }), "en")).not.toContain("00-xyz");
  });

  test("handles non-ApiError values", () => {
    expect(apiErrorMessage(new Error("boom"), "en")).toBe("Something went wrong. Please try again.");
    expect(fieldError(new Error("boom"), "Title")).toBeUndefined();
  });
});
