#!/usr/bin/env python3
import argparse
import gzip
import hashlib
import json
import os
import re
import sqlite3
import sys
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup

BASE = "https://gov.nawafith.net"
START = f"{BASE}/ar"
ALLOWED_HOSTS = {"gov.nawafith.net", "www.gov.nawafith.net"}
KEEP_QUERY_KEYS = {"year", "page", "offset", "m", "month", "issuing_body", "governorate", "doc_type", "legal_form", "q", "type"}
SKIP_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".css", ".js", ".map", ".mp4", ".webm", ".mp3", ".wav"}
DOC_EXT = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".json", ".xml", ".md", ".txt", ".zip"}
UA = "NawafithEmergencyArchive/1.0 (+owner-requested preservation; contact via site owner)"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def canonicalize(url: str, base: str = START):
    try:
        u = urljoin(base, url.strip())
        p = urlparse(u)
        if p.scheme not in {"http", "https"}:
            return None
        host = (p.hostname or "").lower()
        if host not in ALLOWED_HOSTS:
            return None
        path = re.sub(r"/{2,}", "/", p.path or "/")
        if path != "/" and path.endswith("/"):
            path = path[:-1]
        ext = Path(path).suffix.lower()
        if ext in SKIP_EXT:
            return None
        q = []
        for k, v in parse_qsl(p.query, keep_blank_values=True):
            if k in KEEP_QUERY_KEYS and len(v) <= 250:
                q.append((k, v))
        q.sort()
        return urlunparse(("https", "gov.nawafith.net", path, "", urlencode(q, doseq=True), ""))
    except Exception:
        return None


def safe_rel_path(url: str, suffix=".html.gz"):
    p = urlparse(url)
    path = p.path.strip("/") or "root"
    path = re.sub(r"[^0-9A-Za-z._\-/\u0600-\u06FF]+", "_", path)
    if p.query:
        qh = hashlib.sha1(p.query.encode()).hexdigest()[:12]
        path += f"__q_{qh}"
    if len(path) > 220:
        path = path[:180] + "__" + hashlib.sha1(url.encode()).hexdigest()[:20]
    return path + suffix


def init_db(db_path: Path):
    con = sqlite3.connect(db_path)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA synchronous=NORMAL")
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS pages (
          url TEXT PRIMARY KEY,
          final_url TEXT,
          status INTEGER,
          content_type TEXT,
          fetched_at TEXT,
          title TEXT,
          h1 TEXT,
          body_text TEXT,
          sha256 TEXT,
          raw_path TEXT,
          size_bytes INTEGER,
          record_type TEXT,
          slug TEXT,
          error TEXT
        );
        CREATE TABLE IF NOT EXISTS links (
          source_url TEXT NOT NULL,
          target_url TEXT NOT NULL,
          anchor_text TEXT,
          PRIMARY KEY (source_url, target_url, anchor_text)
        );
        CREATE TABLE IF NOT EXISTS external_links (
          source_url TEXT NOT NULL,
          target_url TEXT NOT NULL,
          anchor_text TEXT,
          PRIMARY KEY (source_url, target_url, anchor_text)
        );
        CREATE TABLE IF NOT EXISTS json_blocks (
          page_url TEXT NOT NULL,
          kind TEXT,
          payload TEXT,
          sha256 TEXT,
          PRIMARY KEY (page_url, sha256)
        );
        CREATE TABLE IF NOT EXISTS crawl_log (
          ts TEXT,
          event TEXT,
          url TEXT,
          detail TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
        CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(record_type);
        CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_url);
        """
    )
    try:
        con.execute("CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(url, title, h1, body_text, content='pages', content_rowid='rowid')")
        con.executescript(
            """
            CREATE TRIGGER IF NOT EXISTS pages_ai AFTER INSERT ON pages BEGIN
              INSERT INTO pages_fts(rowid,url,title,h1,body_text) VALUES (new.rowid,new.url,new.title,new.h1,new.body_text);
            END;
            CREATE TRIGGER IF NOT EXISTS pages_ad AFTER DELETE ON pages BEGIN
              INSERT INTO pages_fts(pages_fts,rowid,url,title,h1,body_text) VALUES('delete',old.rowid,old.url,old.title,old.h1,old.body_text);
            END;
            CREATE TRIGGER IF NOT EXISTS pages_au AFTER UPDATE ON pages BEGIN
              INSERT INTO pages_fts(pages_fts,rowid,url,title,h1,body_text) VALUES('delete',old.rowid,old.url,old.title,old.h1,old.body_text);
              INSERT INTO pages_fts(rowid,url,title,h1,body_text) VALUES (new.rowid,new.url,new.title,new.h1,new.body_text);
            END;
            """
        )
    except sqlite3.OperationalError:
        pass
    con.commit()
    return con


def record_type_from_url(url: str):
    parts = [x for x in urlparse(url).path.split("/") if x]
    if len(parts) >= 2 and parts[0] == "ar":
        mapping = {
            "decrees": "decree",
            "gazette": "gazette",
            "company": "company",
            "companies": "companies_index",
            "person": "person",
            "persons": "persons_index",
            "cso": "cso",
            "csos": "csos_index",
            "ministry": "ministry",
            "body": "government_body",
            "committee": "committee",
            "register": "register",
            "corpus": "corpus",
            "news": "news",
        }
        return mapping.get(parts[1], parts[1]), parts[-1] if len(parts) > 2 else None
    return "page", parts[-1] if parts else None


def visible_text(soup: BeautifulSoup):
    for tag in soup(["script", "style", "noscript", "template"]):
        tag.decompose()
    main = soup.find("main") or soup.body or soup
    text = main.get_text("\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def extract_page(html: bytes, url: str):
    soup = BeautifulSoup(html, "lxml")
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    h1_tag = soup.find("h1")
    h1 = h1_tag.get_text(" ", strip=True) if h1_tag else ""
    body = visible_text(BeautifulSoup(html, "lxml"))

    internal = []
    external = []
    for a in soup.find_all("a", href=True):
        href = a.get("href", "").strip()
        label = re.sub(r"\s+", " ", a.get_text(" ", strip=True))[:500]
        absolute = urljoin(url, href)
        p = urlparse(absolute)
        if (p.hostname or "").lower() in ALLOWED_HOSTS:
            c = canonicalize(absolute, url)
            if c:
                internal.append((c, label))
        elif p.scheme in {"http", "https"}:
            external.append((absolute, label))

    # Discover routes embedded in SSR / Next.js payloads even when not rendered as anchors.
    raw_text = html.decode("utf-8", errors="ignore")
    route_patterns = [
        r'(?<![A-Za-z0-9])(/ar/(?:decrees|gazette|company|companies|person|persons|cso|csos|ministry|body|committee|register|corpus|news)[^"\'<>\\\s]*)',
        r'(https://gov\.nawafith\.net/ar/[^"\'<>\\\s]+)',
    ]
    for pat in route_patterns:
        for m in re.findall(pat, raw_text, flags=re.I):
            c = canonicalize(m, url)
            if c:
                internal.append((c, "[embedded-route]"))

    json_blocks = []
    for s in soup.find_all("script"):
        typ = (s.get("type") or "").lower()
        sid = s.get("id") or ""
        txt = s.string or s.get_text() or ""
        if not txt.strip():
            continue
        if typ in {"application/ld+json", "application/json"} or sid == "__NEXT_DATA__":
            txt = txt.strip()
            json_blocks.append((typ or sid or "json", txt[:10_000_000]))

    return title, h1, body, list(dict.fromkeys(internal)), list(dict.fromkeys(external)), json_blocks


def seeds():
    out = [
        f"{BASE}/ar",
        f"{BASE}/ar/register",
        f"{BASE}/ar/decrees",
        f"{BASE}/ar/companies",
        f"{BASE}/ar/persons",
        f"{BASE}/ar/csos",
        f"{BASE}/ar/corpus",
        f"{BASE}/ar/sources",
        f"{BASE}/ar/access",
        f"{BASE}/ar/news",
        f"{BASE}/robots.txt",
        f"{BASE}/sitemap.xml",
        f"{BASE}/sitemap_index.xml",
    ]
    for year in range(2000, 2027):
        out.append(f"{BASE}/ar/decrees?year={year}")
        out.append(f"{BASE}/ar/register?year={year}")
        for issue in range(1, 71):
            out.append(f"{BASE}/ar/gazette/{year}/{issue:02d}")
    # Current structured era has explicit year buttons 2020-present.
    for year in range(2020, 2027):
        out.append(f"{BASE}/ar/decrees?year={year}")
    return [canonicalize(x) for x in out if canonicalize(x)]


def request(session, url, timeout=35):
    last = None
    for attempt in range(4):
        try:
            r = session.get(url, timeout=timeout, allow_redirects=True, stream=True)
            chunks = []
            size = 0
            limit = 60 * 1024 * 1024
            for chunk in r.iter_content(256 * 1024):
                if not chunk:
                    continue
                size += len(chunk)
                if size > limit:
                    raise RuntimeError("response exceeded 60 MB safety limit")
                chunks.append(chunk)
            return r, b"".join(chunks), None
        except Exception as e:
            last = str(e)
            time.sleep(min(8, 1.4 ** attempt))
    return None, b"", last


def write_summary(con, outdir: Path):
    summary = {}
    for status, count in con.execute("SELECT COALESCE(status,-1), COUNT(*) FROM pages GROUP BY status"):
        summary[f"status_{status}"] = count
    summary["total_pages"] = con.execute("SELECT COUNT(*) FROM pages").fetchone()[0]
    summary["successful_pages"] = con.execute("SELECT COUNT(*) FROM pages WHERE status BETWEEN 200 AND 299").fetchone()[0]
    summary["internal_links"] = con.execute("SELECT COUNT(*) FROM links").fetchone()[0]
    summary["external_links"] = con.execute("SELECT COUNT(*) FROM external_links").fetchone()[0]
    summary["generated_at"] = now_iso()
    summary["record_types"] = {k: v for k, v in con.execute("SELECT COALESCE(record_type,'unknown'), COUNT(*) FROM pages WHERE status BETWEEN 200 AND 299 GROUP BY record_type ORDER BY COUNT(*) DESC")}
    (outdir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    with (outdir / "pages.csv").open("w", encoding="utf-8-sig", newline="") as f:
        import csv
        w = csv.writer(f)
        w.writerow(["url", "final_url", "status", "content_type", "title", "h1", "record_type", "slug", "sha256", "raw_path", "size_bytes", "fetched_at", "error"])
        for row in con.execute("SELECT url,final_url,status,content_type,title,h1,record_type,slug,sha256,raw_path,size_bytes,fetched_at,error FROM pages ORDER BY url"):
            w.writerow(row)

    with gzip.open(outdir / "records.jsonl.gz", "wt", encoding="utf-8") as f:
        cur = con.execute("SELECT url,final_url,status,content_type,fetched_at,title,h1,body_text,sha256,raw_path,size_bytes,record_type,slug,error FROM pages ORDER BY url")
        cols = [d[0] for d in cur.description]
        for row in cur:
            f.write(json.dumps(dict(zip(cols, row)), ensure_ascii=False) + "\n")

    with (outdir / "README.txt").open("w", encoding="utf-8") as f:
        f.write("Nawafith emergency public archive\n")
        f.write("Generated: " + now_iso() + "\n\n")
        f.write("archive.sqlite3  : searchable SQLite database; pages_fts provides full-text search when SQLite FTS5 is available.\n")
        f.write("raw/             : gzip-compressed raw HTML/text/binary responses.\n")
        f.write("records.jsonl.gz : one metadata/text record per fetched URL.\n")
        f.write("pages.csv        : compact inventory.\n")
        f.write("summary.json     : crawl counts by HTTP status and record type.\n\n")
        f.write("The crawler follows only public pages on gov.nawafith.net. It does not bypass authentication or API keys.\n")


def crawl(outdir: Path, max_pages: int, max_runtime: int, delay: float):
    outdir.mkdir(parents=True, exist_ok=True)
    rawdir = outdir / "raw"
    rawdir.mkdir(exist_ok=True)
    con = init_db(outdir / "archive.sqlite3")

    visited = {r[0] for r in con.execute("SELECT url FROM pages")}
    queued = set()
    q = deque()
    for s in seeds():
        if s not in visited and s not in queued:
            q.append(s); queued.add(s)

    # Resume newly discovered links from an earlier partial run.
    for (target,) in con.execute("SELECT DISTINCT target_url FROM links"):
        if target not in visited and target not in queued:
            q.append(target); queued.add(target)

    session = requests.Session()
    session.headers.update({
        "User-Agent": UA,
        "Accept-Language": "ar,en;q=0.7",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,text/plain,*/*;q=0.5",
        "Connection": "keep-alive",
    })

    start = time.monotonic()
    fetched = 0
    ok = 0
    last_summary = 0

    while q and fetched < max_pages:
        if time.monotonic() - start > max_runtime:
            print(f"Reached max runtime ({max_runtime}s), writing resumable archive.", flush=True)
            break
        url = q.popleft()
        queued.discard(url)
        if url in visited:
            continue
        visited.add(url)

        r, content, err = request(session, url)
        fetched += 1
        if r is None:
            con.execute("INSERT OR REPLACE INTO pages(url,fetched_at,error) VALUES(?,?,?)", (url, now_iso(), err))
            con.execute("INSERT INTO crawl_log VALUES(?,?,?,?)", (now_iso(), "error", url, err or "request failed"))
            con.commit()
            continue

        status = r.status_code
        ctype = (r.headers.get("content-type") or "").split(";", 1)[0].strip().lower()
        final_url = canonicalize(r.url) or r.url
        sha = hashlib.sha256(content).hexdigest()
        rec_type, slug = record_type_from_url(final_url)
        raw_path = None
        title = h1 = body = ""
        internal = external = json_blocks = []

        if 200 <= status < 300 and content:
            ok += 1
            ext = Path(urlparse(final_url).path).suffix.lower()
            if "html" in ctype or ctype in {"", "text/html", "application/xhtml+xml"}:
                raw_path = safe_rel_path(final_url, ".html.gz")
                raw_file = rawdir / raw_path
                raw_file.parent.mkdir(parents=True, exist_ok=True)
                with gzip.open(raw_file, "wb", compresslevel=6) as g:
                    g.write(content)
                try:
                    title, h1, body, internal, external, json_blocks = extract_page(content, final_url)
                except Exception as e:
                    err = (err + "; " if err else "") + "parse: " + str(e)
            else:
                suffix = ext if ext else ".bin"
                raw_path = safe_rel_path(final_url, suffix + ".gz")
                raw_file = rawdir / raw_path
                raw_file.parent.mkdir(parents=True, exist_ok=True)
                with gzip.open(raw_file, "wb", compresslevel=6) as g:
                    g.write(content)
                if ctype.startswith("text/") or ctype in {"application/json", "application/xml"}:
                    body = content.decode("utf-8", errors="replace")[:20_000_000]

        con.execute(
            """INSERT OR REPLACE INTO pages
            (url,final_url,status,content_type,fetched_at,title,h1,body_text,sha256,raw_path,size_bytes,record_type,slug,error)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (url, final_url, status, ctype, now_iso(), title, h1, body, sha, str(Path("raw") / raw_path) if raw_path else None, len(content), rec_type, slug, err),
        )

        for target, label in internal:
            con.execute("INSERT OR IGNORE INTO links(source_url,target_url,anchor_text) VALUES(?,?,?)", (final_url, target, label))
            if target not in visited and target not in queued:
                q.append(target); queued.add(target)
        for target, label in external:
            con.execute("INSERT OR IGNORE INTO external_links(source_url,target_url,anchor_text) VALUES(?,?,?)", (final_url, target, label))
        for kind, payload in json_blocks:
            jsha = hashlib.sha256(payload.encode("utf-8", errors="ignore")).hexdigest()
            con.execute("INSERT OR IGNORE INTO json_blocks(page_url,kind,payload,sha256) VALUES(?,?,?,?)", (final_url, kind, payload, jsha))

        # Sitemap XML is valuable even if served as application/xml.
        if ("xml" in ctype or final_url.endswith(".xml")) and content:
            txt = content.decode("utf-8", errors="ignore")
            for loc in re.findall(r"<loc>\s*([^<]+?)\s*</loc>", txt, flags=re.I):
                c = canonicalize(loc, final_url)
                if c and c not in visited and c not in queued:
                    q.append(c); queued.add(c)

        con.commit()
        if fetched % 100 == 0:
            elapsed = int(time.monotonic() - start)
            print(f"progress fetched={fetched} ok={ok} queue={len(q)} elapsed={elapsed}s current={url}", flush=True)
        if fetched - last_summary >= 500:
            write_summary(con, outdir)
            last_summary = fetched
        if delay:
            time.sleep(delay)

    write_summary(con, outdir)
    con.execute("INSERT INTO crawl_log VALUES(?,?,?,?)", (now_iso(), "finished", START, json.dumps({"fetched_this_run": fetched, "ok_this_run": ok, "remaining_queue": len(q)})))
    con.commit()
    con.close()
    print(f"DONE fetched_this_run={fetched} ok_this_run={ok} remaining_queue={len(q)}", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default="nawafith_archive")
    ap.add_argument("--max-pages", type=int, default=150000)
    ap.add_argument("--max-runtime", type=int, default=17400, help="seconds; default 4h50m")
    ap.add_argument("--delay", type=float, default=0.08, help="polite delay between requests")
    args = ap.parse_args()
    crawl(Path(args.output), args.max_pages, args.max_runtime, args.delay)


if __name__ == "__main__":
    main()
