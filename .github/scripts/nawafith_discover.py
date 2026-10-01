#!/usr/bin/env python3
import json, re, sys, time
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

BASE='https://gov.nawafith.net'
OUT=Path(sys.argv[1]); OUT.mkdir(parents=True,exist_ok=True)
s=requests.Session(); s.headers.update({'User-Agent':'NawafithOwnerArchiveDiscovery/1.0','Accept-Language':'ar,en;q=0.8'})
seed_paths=['/ar/access','/en/access','/ar/corpus','/en/corpus','/api','/api/docs','/docs','/openapi.json','/api/openapi.json','/robots.txt','/sitemap.xml','/sitemap_index.xml']
results=[]; scripts=set(); links=set(); texts={}
for p in seed_paths:
    u=urljoin(BASE,p)
    try:
        r=s.get(u,timeout=30,allow_redirects=True)
        results.append({'url':u,'status':r.status_code,'final_url':r.url,'content_type':r.headers.get('content-type',''),'size':len(r.content)})
        ctype=r.headers.get('content-type','')
        text=r.text if ('text' in ctype or 'json' in ctype or 'xml' in ctype or 'html' in ctype) else ''
        texts[p]=text
        safe=p.strip('/').replace('/','__') or 'root'
        (OUT/f'{safe}.txt').write_text(text[:30_000_000],encoding='utf-8',errors='ignore')
        if 'html' in ctype:
            soup=BeautifulSoup(text,'html.parser')
            for tag in soup.find_all('script',src=True):
                su=urljoin(r.url,tag['src'])
                if urlparse(su).hostname in {'gov.nawafith.net','www.gov.nawafith.net'}: scripts.add(su)
            for a in soup.find_all('a',href=True): links.add(urljoin(r.url,a['href']))
    except Exception as e:
        results.append({'url':u,'error':str(e)})

# Sitemap URLs
sitemap_urls=set()
for p,t in texts.items():
    if 'sitemap' in p:
        for loc in re.findall(r'<loc>\s*([^<]+?)\s*</loc>',t,re.I): sitemap_urls.add(loc.strip())
# Follow sitemap indexes once/twice
for u in list(sitemap_urls):
    if 'sitemap' in u.lower():
        try:
            r=s.get(u,timeout=30)
            for loc in re.findall(r'<loc>\s*([^<]+?)\s*</loc>',r.text,re.I): sitemap_urls.add(loc.strip())
        except Exception: pass
(OUT/'sitemap_urls.txt').write_text('\n'.join(sorted(sitemap_urls)),encoding='utf-8')

# Fetch JS bundles and collect likely data/API strings.
hits=[]
patterns=[
    r'https?://[^\"\'\s<>]+',
    r'/(?:api|v1|v2|data|download|export|corpus)[A-Za-z0-9_./?=&%{}:\-]*',
    r'[A-Za-z0-9_./\-]+\.(?:parquet|json|csv|zip|ndjson|jsonl)',
]
for i,u in enumerate(sorted(scripts)):
    if i>=120: break
    try:
        r=s.get(u,timeout=30)
        txt=r.text
        for pat in patterns:
            for m in re.findall(pat,txt,re.I):
                if isinstance(m,tuple): m=''.join(m)
                low=m.lower()
                if any(k in low for k in ['api','corpus','parquet','json','csv','download','export','decre','company','companies','persons','csos','gazette']):
                    hits.append({'script':u,'hit':m[:2000]})
    except Exception as e: hits.append({'script':u,'error':str(e)})

# Also scan HTML/text for explicit endpoints/data references.
for p,t in texts.items():
    for pat in patterns:
        for m in re.findall(pat,t,re.I):
            if isinstance(m,tuple): m=''.join(m)
            low=m.lower()
            if any(k in low for k in ['api','corpus','parquet','json','csv','download','export','decre','company','companies','persons','csos','gazette']):
                hits.append({'source':p,'hit':m[:2000]})

# Deduplicate hits
seen=set(); clean=[]
for h in hits:
    key=(h.get('hit'),h.get('error'),h.get('script'),h.get('source'))
    if key in seen: continue
    seen.add(key); clean.append(h)
(OUT/'discovery.json').write_text(json.dumps({'fetches':results,'scripts':sorted(scripts),'links':sorted(links),'hits':clean},ensure_ascii=False,indent=2),encoding='utf-8')
with (OUT/'hits.txt').open('w',encoding='utf-8') as f:
    for h in clean:
        if 'hit' in h: f.write(f"{h.get('source') or h.get('script')}\t{h['hit']}\n")
print(json.dumps(results,ensure_ascii=False,indent=2))
print('scripts',len(scripts),'sitemap_urls',len(sitemap_urls),'hits',len(clean))
