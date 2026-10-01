#!/usr/bin/env python3
import csv, json, os, sqlite3, sys
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse

DB = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row


def one(sql, params=()):
    r = con.execute(sql, params).fetchone()
    return r[0] if r else 0

summary = {
    "total_pages": one("SELECT COUNT(*) FROM pages"),
    "successful_pages": one("SELECT COUNT(*) FROM pages WHERE status BETWEEN 200 AND 299"),
    "not_found": one("SELECT COUNT(*) FROM pages WHERE status=404"),
    "internal_links": one("SELECT COUNT(*) FROM links"),
    "external_links": one("SELECT COUNT(*) FROM external_links"),
    "json_blocks": one("SELECT COUNT(*) FROM json_blocks"),
    "pages_with_text": one("SELECT COUNT(*) FROM pages WHERE LENGTH(COALESCE(body_text,''))>0"),
    "pages_with_raw": one("SELECT COUNT(*) FROM pages WHERE raw_path IS NOT NULL"),
}

# Counts by language, top-level route, and crawler record type.
languages = Counter()
routes = Counter()
for r in con.execute("SELECT url FROM pages WHERE status BETWEEN 200 AND 299"):
    p = [x for x in urlparse(r[0]).path.split('/') if x]
    lang = p[0] if p and p[0] in {'ar','en'} else 'other'
    languages[lang] += 1
    route = p[1] if len(p) > 1 and lang in {'ar','en'} else (p[0] if p else 'root')
    routes[f"{lang}/{route}"] += 1
summary['languages'] = dict(languages)
summary['top_routes'] = dict(routes.most_common())
summary['record_types'] = {str(k): v for k,v in con.execute("SELECT COALESCE(record_type,'unknown'), COUNT(*) FROM pages WHERE status BETWEEN 200 AND 299 GROUP BY record_type ORDER BY COUNT(*) DESC")}

# Counts of distinct Arabic and English detail routes, useful for coverage checks.
detail_routes = ['decrees','companies','persons','csos','founders','gazette','investment','international-associations','ministry','committees','governorates']
coverage = {}
for route in detail_routes:
    coverage[route] = {}
    for lang in ('ar','en'):
        prefix = f"https://gov.nawafith.net/{lang}/{route}/%"
        coverage[route][lang] = one("SELECT COUNT(*) FROM pages WHERE status BETWEEN 200 AND 299 AND url LIKE ?", (prefix,))
summary['detail_coverage'] = coverage

(OUT/'audit_summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')

# Export compact inventory (without full body text).
with (OUT/'inventory.csv').open('w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['url','status','record_type','slug','title','h1','content_type','size_bytes','fetched_at','error'])
    for r in con.execute("SELECT url,status,record_type,slug,title,h1,content_type,size_bytes,fetched_at,error FROM pages ORDER BY url"):
        w.writerow(r)

# Export all 404s for targeted retry/cleanup.
with (OUT/'not_found_404.csv').open('w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f); w.writerow(['url','record_type','slug','error'])
    for r in con.execute("SELECT url,record_type,slug,error FROM pages WHERE status=404 ORDER BY url"):
        w.writerow(r)

# Real samples: up to 25 records from each important route, Arabic first.
important = ['decree','companies_index','persons_index','csos_index','founders','gazette','investment','international-associations','ministry','committees','page']
samples=[]
for typ in important:
    rows = con.execute("""
      SELECT url,status,record_type,slug,title,h1,body_text,size_bytes,fetched_at
      FROM pages
      WHERE status BETWEEN 200 AND 299 AND record_type=? AND LENGTH(COALESCE(body_text,''))>0
      ORDER BY CASE WHEN url LIKE 'https://gov.nawafith.net/ar/%' THEN 0 ELSE 1 END, url
      LIMIT 25
    """, (typ,)).fetchall()
    for r in rows:
        d = dict(r)
        body = (d.pop('body_text') or '').replace('\x00','')
        d['body_excerpt'] = body[:4000]
        samples.append(d)
with (OUT/'samples.json').open('w', encoding='utf-8') as f:
    json.dump(samples, f, ensure_ascii=False, indent=2)

# Decree/company/person/cso URL lists are small and directly useful for comparing against the live site.
for route in ['decrees','companies','persons','csos','founders','gazette']:
    with (OUT/f'{route}_urls.txt').open('w', encoding='utf-8') as f:
        for (url,) in con.execute("SELECT url FROM pages WHERE status BETWEEN 200 AND 299 AND url LIKE ? ORDER BY url", (f'https://gov.nawafith.net/ar/{route}/%',)):
            f.write(url+'\n')

# Human-readable report.
lines = [
    'NAWAFITH ARCHIVE AUDIT',
    f"Total fetched URLs: {summary['total_pages']}",
    f"Successful: {summary['successful_pages']}",
    f"404: {summary['not_found']}",
    f"Pages with extracted text: {summary['pages_with_text']}",
    f"Internal links captured: {summary['internal_links']}",
    '', 'DETAIL COVERAGE (successful URLs):'
]
for route, vals in coverage.items():
    lines.append(f"{route}: ar={vals['ar']} en={vals['en']}")
lines += ['', 'TOP ROUTES:']
for k,v in list(routes.most_common(30)):
    lines.append(f"{k}: {v}")
(OUT/'REPORT.txt').write_text('\n'.join(lines)+'\n', encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
con.close()
