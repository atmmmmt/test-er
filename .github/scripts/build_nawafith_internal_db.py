#!/usr/bin/env python3
import json, re, sqlite3, sys
from pathlib import Path
from urllib.parse import urlparse
import requests

SRC=Path(sys.argv[1]); OUT=Path(sys.argv[2]); OUT.parent.mkdir(parents=True,exist_ok=True)
if OUT.exists(): OUT.unlink()
src=sqlite3.connect(SRC); src.row_factory=sqlite3.Row
db=sqlite3.connect(OUT)
db.execute('PRAGMA journal_mode=DELETE'); db.execute('PRAGMA synchronous=OFF'); db.execute('PRAGMA temp_store=MEMORY'); db.execute('PRAGMA page_size=8192')
db.executescript('''
CREATE TABLE documents(
 id INTEGER PRIMARY KEY,
 url TEXT UNIQUE NOT NULL,
 lang TEXT NOT NULL,
 route TEXT,
 record_type TEXT,
 slug TEXT,
 title TEXT,
 h1 TEXT,
 body_text TEXT,
 size_bytes INTEGER,
 fetched_at TEXT
);
CREATE INDEX idx_documents_lang ON documents(lang);
CREATE INDEX idx_documents_type ON documents(record_type);
CREATE INDEX idx_documents_route ON documents(route);
CREATE INDEX idx_documents_slug ON documents(slug);
CREATE VIRTUAL TABLE documents_fts USING fts5(
 title, h1, body_text,
 content='documents', content_rowid='id',
 tokenize='unicode61 remove_diacritics 2'
);
CREATE TABLE register_records(
 id INTEGER PRIMARY KEY,
 year_month TEXT,
 kind TEXT,
 title_ar TEXT,
 title_en TEXT,
 record_date TEXT,
 issuer_ar TEXT,
 issuer_en TEXT,
 governorate TEXT,
 detail_ar TEXT,
 detail_en TEXT,
 raw_json TEXT
);
CREATE INDEX idx_register_kind ON register_records(kind);
CREATE INDEX idx_register_month ON register_records(year_month);
CREATE INDEX idx_register_governorate ON register_records(governorate);
CREATE VIRTUAL TABLE register_fts USING fts5(
 title_ar,title_en,issuer_ar,issuer_en,detail_ar,detail_en,
 content='register_records',content_rowid='id', tokenize='unicode61 remove_diacritics 2'
);
CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT);
CREATE TABLE users(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('owner','admin','researcher','viewer')),
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE audit_log(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER,
 action TEXT NOT NULL,
 detail TEXT,
 ip TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
''')

rows=src.execute("SELECT url,record_type,slug,title,h1,body_text,size_bytes,fetched_at FROM pages WHERE status BETWEEN 200 AND 299 ORDER BY url")
batch=[]; n=0
for r in rows:
    p=[x for x in urlparse(r['url']).path.split('/') if x]
    lang=p[0] if p and p[0] in ('ar','en') else 'other'
    route=p[1] if len(p)>1 and lang in ('ar','en') else (p[0] if p else 'root')
    batch.append((r['url'],lang,route,r['record_type'],r['slug'],r['title'],r['h1'],r['body_text'],r['size_bytes'],r['fetched_at']))
    if len(batch)>=500:
        db.executemany('INSERT INTO documents(url,lang,route,record_type,slug,title,h1,body_text,size_bytes,fetched_at) VALUES(?,?,?,?,?,?,?,?,?,?)',batch); n+=len(batch); batch=[]
if batch:
    db.executemany('INSERT INTO documents(url,lang,route,record_type,slug,title,h1,body_text,size_bytes,fetched_at) VALUES(?,?,?,?,?,?,?,?,?,?)',batch); n+=len(batch)
db.commit(); print('documents',n,flush=True)
db.execute("INSERT INTO documents_fts(documents_fts) VALUES('rebuild')"); db.commit(); print('documents FTS built',flush=True)

# Public compact structured shelf used by the web UI.
r=requests.get('https://gov.nawafith.net/register-shelf/records-all.json',timeout=60,headers={'User-Agent':'NawafithOwnerInternalArchive/1.0'})
r.raise_for_status(); shelf=r.json(); issuers=shelf.get('issuers',[])
reg=[]
for ym,items in shelf.get('months',{}).items():
    for x in items:
        ia=x.get('i'); ie=x.get('ie')
        issuer_ar=issuers[ia] if isinstance(ia,int) and 0<=ia<len(issuers) else ''
        issuer_en=issuers[ie] if isinstance(ie,int) and 0<=ie<len(issuers) else ''
        reg.append((ym,x.get('k',''),x.get('t',''),x.get('te',''),x.get('dt',''),issuer_ar,issuer_en,x.get('g',''),x.get('d',''),x.get('de',''),json.dumps(x,ensure_ascii=False,separators=(',',':'))))
db.executemany('INSERT INTO register_records(year_month,kind,title_ar,title_en,record_date,issuer_ar,issuer_en,governorate,detail_ar,detail_en,raw_json) VALUES(?,?,?,?,?,?,?,?,?,?,?)',reg)
db.commit(); db.execute("INSERT INTO register_fts(register_fts) VALUES('rebuild')"); db.commit(); print('register records',len(reg),flush=True)

meta={
 'documents':n,
 'register_records':len(reg),
 'source':'https://gov.nawafith.net',
 'archive_scope':'public pages captured 2026-10-01',
 'license':'CC BY-SA 4.0 (as stated by source site)',
}
db.executemany('INSERT INTO metadata(key,value) VALUES(?,?)',[(k,str(v)) for k,v in meta.items()]); db.commit()
# Optimize and compact.
db.execute('ANALYZE'); db.commit(); db.execute('VACUUM'); db.close(); src.close()
print('output_bytes',OUT.stat().st_size,flush=True)
