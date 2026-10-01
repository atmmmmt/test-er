# Nawafith Internal Archive

Closed, local-first search interface for the preserved public data from `gov.nawafith.net`.

## What is included

- Full-text search over the preserved public pages.
- Structured register records imported from the public register shelf.
- Arabic / English filtering and section filtering.
- Four roles: Owner, Admin, Researcher, Viewer.
- No public registration.
- Researcher+ text/CSV export.
- Audit log for login, search, view, exports and user-management actions.
- `noindex` on every screen.
- SQLite only: no external database or paid service is required.

## Start with Docker

1. Download the `nawafith-internal-database` artifact produced by the GitHub Action `Nawafith build internal database`.
2. Put `nawafith_internal.sqlite3.zst` in `nawafith_internal/data/`.
3. Copy `.env.example` to `.env` and set strong values for `ADMIN_USERNAME`, `ADMIN_PASSWORD` and `SECRET_KEY`.
4. Run:

```bash
docker compose up -d --build
```

The compose file binds only to `127.0.0.1:8080`, so it is not publicly exposed by default. Open `http://127.0.0.1:8080` on the server itself.

The container automatically decompresses `data/nawafith_internal.sqlite3.zst` on first start.

## Team access

For a LAN-only deployment, change the compose port binding from `127.0.0.1:8080:8080` to the private interface you want to use. If it is later placed behind HTTPS, set `COOKIE_SECURE=1`.

Do not expose this service directly to the public internet without an HTTPS reverse proxy and an additional network access layer.

## First owner

The first time the app starts with an empty `users` table it creates exactly one Owner from `ADMIN_USERNAME` and `ADMIN_PASSWORD`. After that, changing those environment values does not replace existing accounts.

Role behavior:

- **Owner**: all access, including Admin/Owner account creation.
- **Admin**: search/read plus user management for Researchers/Viewers and audit log.
- **Researcher**: search/read/export.
- **Viewer**: search/read only.

## Data files

Never commit the database, `.env`, passwords, or secrets. `.gitignore` excludes them.

The emergency raw archive is retained separately from this operational database. The operational database is optimized for internal search and can always be rebuilt from the preserved archive while that archive is available.
