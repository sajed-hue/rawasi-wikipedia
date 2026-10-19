// RFC 7807 ProblemDetails parsing and a single, typed ApiError the whole app uses.
//
// The backend's GlobalExceptionHandler returns `application/problem+json` for expected
// errors. The UI never branches on raw HTTP numbers scattered through components — it
// branches on `ApiError.kind`, which this module derives once.

/** Shape of an RFC 7807 ProblemDetails body (all fields optional on the wire). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  /** Present only on 400 validation errors: field name -> messages. */
  errors?: Record<string, string[]>;
}

/** Domain classification of a failure, mapped from HTTP status (or transport state). */
export type ApiErrorKind =
  | "validation" // 400
  | "authentication" // 401
  | "authorization" // 403
  | "notFound" // 404
  | "conflict" // 409
  | "payloadTooLarge" // 413
  | "rateLimit" // 429
  | "server" // >= 500
  | "network" // no HTTP response (offline, DNS, connection refused)
  | "canceled" // request aborted (unmount, new search, timeout)
  | "unknown"; // anything else

/** Map an HTTP status code to a domain error kind. */
export function kindFromStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return "validation";
    case 401:
      return "authentication";
    case 403:
      return "authorization";
    case 404:
      return "notFound";
    case 409:
      return "conflict";
    case 413:
      return "payloadTooLarge";
    case 429:
      return "rateLimit";
    default:
      return status >= 500 ? "server" : "unknown";
  }
}

/** Narrow an unknown body to a ProblemDetails if it looks like one. */
function asProblemDetails(body: unknown): ProblemDetails | undefined {
  if (body === null || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  const hasShape =
    typeof record["title"] === "string" ||
    typeof record["detail"] === "string" ||
    typeof record["status"] === "number" ||
    typeof record["traceId"] === "string" ||
    typeof record["errors"] === "object";
  return hasShape ? (body as ProblemDetails) : undefined;
}

export interface ApiErrorInit {
  kind: ApiErrorKind;
  status: number | null;
  message: string;
  detail?: string | undefined;
  fieldErrors?: Record<string, string[]> | undefined;
  traceId?: string | undefined;
  problem?: ProblemDetails | undefined;
}

/**
 * The single error type thrown by the API client. Properties are declared with
 * explicit `| undefined` unions (not `?`) so they satisfy `exactOptionalPropertyTypes`
 * while still being assignable from possibly-absent ProblemDetails fields.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status, or null for transport failures (network / canceled). */
  readonly status: number | null;
  /** Human-readable detail from ProblemDetails, if any. */
  readonly detail: string | undefined;
  /** 400 validation map: field -> messages. */
  readonly fieldErrors: Record<string, string[]> | undefined;
  /** Correlation id, safe to surface to users in support prompts. */
  readonly traceId: string | undefined;
  /** Raw ProblemDetails body, if the server returned one. */
  readonly problem: ProblemDetails | undefined;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = "ApiError";
    this.kind = init.kind;
    this.status = init.status;
    this.detail = init.detail;
    this.fieldErrors = init.fieldErrors;
    this.traceId = init.traceId;
    this.problem = init.problem;
  }

  /** First validation message for a field, if present. */
  firstFieldError(field: string): string | undefined {
    const messages = this.fieldErrors?.[field];
    return messages && messages.length > 0 ? messages[0] : undefined;
  }

  /** True for failures where an automatic GET retry is reasonable. */
  get isTransient(): boolean {
    return this.kind === "network" || this.status === 503;
  }

  /** Build an ApiError from an HTTP error response body. */
  static fromResponse(status: number, body: unknown): ApiError {
    const problem = asProblemDetails(body);
    const kind = kindFromStatus(status);
    const message =
      problem?.title ??
      problem?.detail ??
      `Request failed with status ${status}`;
    return new ApiError({
      kind,
      status,
      message,
      detail: problem?.detail,
      fieldErrors: problem?.errors,
      traceId: problem?.traceId,
      problem,
    });
  }

  static network(message = "Network error. Please check your connection."): ApiError {
    return new ApiError({ kind: "network", status: null, message });
  }

  static canceled(message = "Request canceled."): ApiError {
    return new ApiError({ kind: "canceled", status: null, message });
  }
}

/** Type guard for `catch` blocks and React Query error handlers. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
