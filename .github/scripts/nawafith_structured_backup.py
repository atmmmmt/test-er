#!/usr/bin/env python3
import hashlib, json, re, sys, time
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests

BASE='https://gov.nawafith.net/'
OUT=Path(sys.argv[1]); OUT.mkdir(parents=True,exist_ok=True)
DATA=OUT/'data'; DATA.mkdir(exist_ok=True)
SEEDS=[
 'corpus-summary.json',
 'entity-fixtures/decrees/_index.json',
 'entity-fixtures/gov-entities-index.json',
 'entity-fixtures/gov-decree-numbers.json',
 'entity-fixtures/news-archive.json',
 'founders-people-index.json',
 'companies-index.json',
 'csos-index.json',
 'rosters-index.json',
 'gazette/_index.json',
 'entity-fixtures/founders-index.json',
 'entity-fixtures/decree-lineage-index.json',
 'register-shelf/volumes.json',
 'register-shelf/records-all.json',
 'search-fixtures/sample.json',
]
JS_SEEDS=['assets/index-CNuWgNNC.js','assets/corpus-hI-08jYX.js','assets/Corpus-BvtcBd3a.js']
s=requests.Session(); s.headers.update({'User-Agent':'NawafithOwnerStructuredArchive/1.0','Accept':'application/json,text/plain,*/*'})
q=deque(urljoin(BASE,x) for x in SEEDS+JS_SEEDS)
queued=set(q); seen=set(); manifest=[]; total=0
MAX_FILES=120000; MAX_TOTAL=3*1024*1024*1024
json_ref_re=re.compile(r'''(?:https?://gov\.nawafith\.net/|/)?[A-Za-z0-9_./%\-]+\.json(?:\?[^"'\s<>]*)?''',re.I)

def local_path(url):
    p=urlparse(url).path.lstrip('/') or 'root'
    p=re.sub(r'[^A-Za-z0-9._/%\-]+','_',p)
    return DATA/p

def add(u):
    u=urljoin(BASE,u)
    p=urlparse(u)
    if p.scheme!='https' or p.hostname not in {'gov.nawafith.net','www.gov.nawafith.net'}: return
    if not (p.path.endswith('.json') or p.path.endswith('.js')): return
    clean=f'https://gov.nawafith.net{p.path}'
    if clean not in seen and clean not in queued:
        q.append(clean); queued.add(clean)

def walk_strings(obj):
    if isinstance(obj,dict):
        for v in obj.values(): yield from walk_strings(v)
    elif isinstance(obj,list):
        for v in obj: yield from walk_strings(v)
    elif isinstance(obj,str): yield obj

def infer_candidates(url,obj):
    path=urlparse(url).path
    objs=[]
    if isinstance(obj,list): objs=obj
    elif isinstance(obj,dict):
        for k in ('items','records','data','decrees','companies','csos','persons','founders','issues'):
            if isinstance(obj.get(k),list): objs += obj[k]
    # Detail fixture inference for known indexes. 404s are harmless and are not stored.
    if path.endswith('/entity-fixtures/decrees/_index.json'):
        for o in objs:
            if isinstance(o,dict):
                for k in ('id','slug','key'):
                    v=o.get(k)
                    if isinstance(v,str) and 0<len(v)<300: add(f'entity-fixtures/decrees/{v}.json')
    if path.endswith('/entity-fixtures/founders-index.json'):
        for o in objs:
            if isinstance(o,dict):
                for k in ('slug','id','key'):
                    v=o.get(k)
                    if isinstance(v,str) and 0<len(v)<300: add(f'entity-fixtures/founders/{v}.json')
    if path.endswith('/gazette/_index.json'):
        for o in objs:
            if isinstance(o,dict):
                y=o.get('year'); i=o.get('issue') or o.get('number') or o.get('issue_number')
                if y and i: add(f'gazette/{y}/{i}.json')

while q and len(seen)<MAX_FILES and total<MAX_TOTAL:
    u=q.popleft(); queued.discard(u)
    if u in seen: continue
    seen.add(u)
    try:
        r=s.get(u,timeout=60,allow_redirects=True)
        content=r.content
        item={'url':u,'status':r.status_code,'size':len(content),'content_type':r.headers.get('content-type','')}
        if r.status_code==200 and content:
            sha=hashlib.sha256(content).hexdigest(); item['sha256']=sha
            p=local_path(u); p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(content)
            item['path']=str(p.relative_to(OUT)); total+=len(content)
            text=content.decode('utf-8',errors='ignore')
            for m in json_ref_re.findall(text): add(m)
            if urlparse(u).path.endswith('.json'):
                try:
                    obj=json.loads(text)
                    for st in walk_strings(obj):
                        if '.json' in st.lower():
                            for m in json_ref_re.findall(st): add(m)
                    infer_candidates(u,obj)
                except Exception as e: item['json_error']=str(e)
        manifest.append(item)
        if len(seen)%100==0: print('progress',len(seen),'queue',len(q),'stored_MB',round(total/1048576,1),flush=True)
        time.sleep(0.01)
    except Exception as e:
        manifest.append({'url':u,'error':str(e)})

summary={
 'fetched':len(seen), 'manifest_rows':len(manifest), 'stored_bytes':total,
 'successful':sum(1 for x in manifest if x.get('status')==200),
 'not_found':sum(1 for x in manifest if x.get('status')==404),
 'remaining_queue':len(q),
}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
