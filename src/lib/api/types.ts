// TypeScript mirrors of the Heritage backend DTOs and request models.
//
// Wire-format contract (verified against the backend source, not just the PDF):
//  - JSON, strictly camelCase (System.Text.Json default).
//  - GUIDs: lowercase strings, e.g. "550e8400-e29b-41d4-a716-446655440000".
//  - Dates: ISO-8601 UTC strings, e.g. "2026-09-30T12:30:00Z".
//  - Enums serialize as NUMERIC integers (no JsonStringEnumConverter is registered),
//    EXCEPT UserRole, which the backend exposes as a STRING on UserProfileDto.
//  - Nullable C# fields (string?, DateTime?) arrive as `value | null`.

/** ISO-8601 UTC timestamp string, e.g. "2026-09-30T12:30:00Z". */
export type IsoDateString = string;

/** Lowercase GUID string. */
export type Guid = string;

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/** HeritagePostStatus — serialized as an integer. */
export const HeritagePostStatus = {
  Draft: 0,
  PendingReview: 1,
  Approved: 2,
  Rejected: 3,
  Archived: 4,
} as const;
export type HeritagePostStatus =
  (typeof HeritagePostStatus)[keyof typeof HeritagePostStatus];

/** ModerationDecision — serialized as an integer. */
export const ModerationDecision = {
  Approved: 0,
  Rejected: 1,
} as const;
export type ModerationDecision =
  (typeof ModerationDecision)[keyof typeof ModerationDecision];

/** UserRole — serialized as a STRING on UserProfileDto. */
export type UserRole = "User" | "Contributor" | "Admin";

/** Allowed values for the public post-list `sort` query parameter. */
export type PostSort = "newest" | "oldest" | "title";

// ---------------------------------------------------------------------------
// Pagination envelope
// ---------------------------------------------------------------------------

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

/** Public-facing representation of a heritage post. */
export interface HeritagePostDto {
  id: Guid;
  title: string;
  summary: string;
  content: string;
  categoryId: Guid;
  authorId: Guid;
  status: HeritagePostStatus;
  createdAt: IsoDateString;
  updatedAt: IsoDateString | null;
  /** Cover image for cards (primary, else first by display order); null when the post has none. */
  coverMediaId?: Guid | null;
}

/** Media attachment metadata. Binary is fetched separately via the content endpoint. */
export interface PostMediaDto {
  id: Guid;
  fileName: string;
  contentType: string;
  fileSize: number;
  isPrimary: boolean;
  displayOrder: number;
  altText: string | null;
  createdAt: IsoDateString;
}

/** Public category model (inactive categories are filtered out by the backend). */
export interface CategoryDto {
  id: Guid;
  name: string;
  description: string;
}

/** Admin category model (exposes isActive). */
export interface CategoryAdminDto {
  id: Guid;
  name: string;
  description: string;
  isActive: boolean;
}

/** Lightweight moderation list item. */
export interface ModerationPostDto {
  id: Guid;
  title: string;
  summary: string;
  categoryId: Guid;
  authorId: Guid;
  status: HeritagePostStatus;
  submittedAt: IsoDateString | null;
}

/** A pending revision (proposed edit to an approved post): proposed vs current content. */
export interface RevisionReviewDto {
  revisionId: Guid;
  postId: Guid;
  version: number;
  changeDescription: string;
  createdBy: Guid;
  createdAt: IsoDateString;
  title: string;
  summary: string;
  content: string;
  categoryId: Guid;
  currentTitle: string;
  currentSummary: string;
  currentContent: string;
  currentCategoryId: Guid;
}

/** A single moderation decision in a post's review history. */
export interface ModerationReviewDto {
  id: Guid;
  adminId: Guid;
  decision: ModerationDecision;
  reason: string | null;
  reviewedAt: IsoDateString;
}

/** Full moderation detail, including the (possibly empty) review history. */
export interface ModerationPostDetailDto {
  id: Guid;
  title: string;
  summary: string;
  content: string;
  categoryId: Guid;
  authorId: Guid;
  status: HeritagePostStatus;
  submittedAt: IsoDateString | null;
  reviews: ModerationReviewDto[];
}

/** Current user / admin user profile. `role` is a STRING. */
export interface UserProfileDto {
  id: Guid;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString | null;
}

/** Administrative audit-log entry. */
export interface AuditLogDto {
  id: Guid;
  userId: Guid | null;
  action: string;
  entityName: string;
  entityId: string;
  timestamp: IsoDateString;
  metadata: string | null;
}

// ---------------------------------------------------------------------------
// Request models (write side — never reuse a response DTO as a request body)
// ---------------------------------------------------------------------------

export interface CreateHeritagePostRequest {
  title: string;
  summary: string;
  content: string;
  categoryId: Guid;
}

export interface UpdateHeritagePostRequest {
  title: string;
  summary: string;
  content: string;
  categoryId: Guid;
}

export interface CreateRevisionRequest {
  title: string;
  summary: string;
  content: string;
  categoryId: Guid;
  changeDescription: string;
}

export interface UpdateCurrentUserRequest {
  displayName: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string;
}

export interface ApprovePostRequest {
  reason?: string;
}

export interface RejectPostRequest {
  reason: string;
}
