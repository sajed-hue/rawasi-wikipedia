# رواسي | Rawasi

A bilingual (Arabic / English) platform for Palestinian heritage: a community-written
wiki where anyone can read, and registered users can contribute articles that an
admin reviews before they go live.

## Features
- Explore heritage articles by category, with search, sorting and pagination
- Guests can browse; accounts can submit, edit and delete their own articles
- Admin review queue: approve, or reject with a written reason
- Saved articles, and an account card with an editable display name
- Arabic (RTL) and English (LTR) with a one-click language switch

## Tech
React 19 · TypeScript · TanStack Start / Router · Tailwind CSS v4 · shadcn/ui (Radix)

## Run it
```sh
npm install
npm run dev      # http://localhost:8080
```

## Folders
- `src/routes`: one file per page (file-based routing; never edit `routeTree.gen.ts`)
- `src/components`: header, footer and shared pieces
- `src/data`: the mock "database" and its functions (see below)
- `src/lib`: language/RTL support and the mock login

## Mock data vs the backend
The screens only call the functions in `src/data`, so connecting the backend means
rewriting these functions and nothing else.

| Function | Backend endpoint |
|---|---|
| `getArticles` | `GET /api/heritage-posts` |
| `getArticleById` | `GET /api/heritage-posts/{id}` |
| `createArticle` / `updateArticle` | `POST` / `PUT /api/heritage-posts` |
| `submitArticle` | `POST /api/heritage-posts/{id}/submit` |
| `deleteArticle` | `DELETE /api/heritage-posts/{id}` |
| `getMyArticles` | `GET /api/users/me/heritage-posts` |
| `getPendingArticles` | `GET /api/admin/moderation/pending` |
| `approveArticle` / `rejectArticle` | `POST /api/admin/moderation/{id}/approve` / `reject` |
| `src/lib/mock-auth.tsx` | Firebase sign-in + `GET` / `PUT /api/users/me` |
| Saved articles | Front end only (no backend feature) |

Post status numbers follow the backend: 0 Draft, 1 Pending review, 2 Approved, 3 Rejected, 4 Archived.

## Known limitations
- The login is a stand-in until Firebase is connected. While running `npm run dev`, an email starting with `admin@` logs in as an admin (a dev-only shortcut in `login.tsx`, switched off in production builds; delete it once the real login works).
- Article photos wait for the backend media endpoints.
- Article text is Arabic-only; category names have English versions on the front end.