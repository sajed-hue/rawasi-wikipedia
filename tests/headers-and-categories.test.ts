import { describe, expect, test } from "bun:test";

import { buildCategoryIndex, enrichCategory } from "../src/lib/api/categories";
import { buildCsp, originOf, securityHeaders, withSecurityHeaders } from "../src/lib/security-headers";

describe("security headers", () => {
  test("originOf strips the path and rejects invalid URLs", () => {
    expect(originOf("https://api.example.com/v1/")).toBe("https://api.example.com");
    expect(originOf("not a url")).toBe("");
    expect(originOf(undefined)).toBe("");
  });

  test("development: basic headers only, no CSP or HSTS", () => {
    const headers = securityHeaders({ isProd: false, apiOrigin: "http://localhost:5046", isHtml: true });
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Content-Security-Policy"]).toBeUndefined();
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });

  test("production HTML gets a CSP that allows the API and Firebase, and HSTS", () => {
    const headers = securityHeaders({ isProd: true, apiOrigin: "https://api.example.com", isHtml: true });
    const csp = headers["Content-Security-Policy"] ?? "";
    expect(csp).toContain("connect-src 'self' https://api.example.com https://identitytoolkit.googleapis.com");
    expect(csp).toContain("img-src 'self' data: blob: https://api.example.com");
    expect(csp).toContain("object-src 'none'");
    expect(headers["Strict-Transport-Security"]).toBe("max-age=31536000");
  });

  test("CSP is only sent on HTML responses", () => {
    expect(securityHeaders({ isProd: true, apiOrigin: "", isHtml: false })["Content-Security-Policy"]).toBeUndefined();
  });

  test("CSP without an API origin still builds", () => {
    expect(buildCsp("")).toContain("connect-src 'self' https://identitytoolkit.googleapis.com");
  });

  test("withSecurityHeaders keeps status, body and existing headers", async () => {
    const original = new Response("<p>hi</p>", {
      status: 404,
      headers: { "content-type": "text/html", "Referrer-Policy": "no-referrer" },
    });
    const result = withSecurityHeaders(original, { isProd: true, apiOrigin: "https://api.example.com" });
    expect(result.status).toBe(404);
    expect(await result.text()).toBe("<p>hi</p>");
    expect(result.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(result.headers.get("Content-Security-Policy")).toContain("https://api.example.com");
  });
});

describe("category enrichment", () => {
  test("known Arabic names get their group and English name", () => {
    const c = enrichCategory({ id: "g1", name: "العمارة والآثار", description: "" });
    expect(c.group).toBe("material");
    expect(c.nameEn).toBe("Architecture & Antiquities");
  });

  test("unknown categories fall back to the intangible group and their own name", () => {
    const c = enrichCategory({ id: "g2", name: "تصنيف جديد", description: "" });
    expect(c.group).toBe("immaterial");
    expect(c.nameEn).toBe("تصنيف جديد");
  });

  test("index resolves names by id and language", () => {
    const index = buildCategoryIndex([
      { id: "a", name: "الأزياء والحلي", description: "" },
      { id: "b", name: "الفنون الشعبية", description: "" },
    ]);
    expect(index.name("a", "en")).toBe("Dress & Jewellery");
    expect(index.name("b", "ar")).toBe("الفنون الشعبية");
    expect(index.name("missing", "en")).toBe("");
    expect(index.groups.material.map((c) => c.id)).toEqual(["a"]);
    expect(index.groups.immaterial.map((c) => c.id)).toEqual(["b"]);
  });
});
