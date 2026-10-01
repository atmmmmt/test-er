import csv
import io
import os
import re
import secrets
import sqlite3
import unicodedata
from datetime import timedelta
from functools import wraps
from pathlib import Path

from flask import Flask, Response, abort, flash, g, redirect, render_template_string, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("NAWAFITH_DB", BASE_DIR / "data" / "nawafith_internal.sqlite3"))

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY") or secrets.token_hex(32)
app.permanent_session_lifetime = timedelta(hours=8)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "0") == "1",
    MAX_CONTENT_LENGTH=2 * 1024 * 1024,
)

ROLE_RANK = {"viewer": 1, "researcher": 2, "admin": 3, "owner": 4}
ROLE_AR = {"viewer": "مشاهد", "researcher": "باحث", "admin": "مدير بيانات", "owner": "مالك النظام"}
ROUTE_AR = {
    "decrees": "القرارات والمراسيم", "companies": "الشركات", "csos": "منظمات المجتمع المدني",
    "persons": "الأشخاص", "founders": "المؤسسون", "gazette": "الجريدة الرسمية",
    "investment": "الاستثمارات", "international-associations": "جهات دولية", "ministry": "الوزارات",
    "committees": "اللجان", "governorates": "المحافظات", "register": "السجل", "corpus": "المتن",
}

CSS = """
:root{font-family:Tahoma,Arial,sans-serif;color:#171717;background:#f5f5f3}*{box-sizing:border-box}body{margin:0}a{color:inherit;text-decoration:none}.top{background:#101010;color:#fff;padding:14px 24px;display:flex;align-items:center;gap:20px;position:sticky;top:0;z-index:5}.brand{font-weight:800;font-size:20px}.top nav{display:flex;gap:14px;margin-inline-start:auto;align-items:center}.top a{color:#ddd}.top a:hover{color:#fff}.wrap{max-width:1280px;margin:auto;padding:24px}.card{background:#fff;border:1px solid #e5e5e5;border-radius:14px;padding:20px;box-shadow:0 2px 12px #00000008}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.stat b{font-size:28px;display:block}.muted{color:#6c6c6c}.searchbar{display:grid;grid-template-columns:1fr 180px 150px auto;gap:10px;margin:16px 0}.searchbar input,.searchbar select,input,select,button{padding:11px 12px;border:1px solid #d8d8d8;border-radius:9px;background:#fff;font:inherit}button,.btn{background:#171717;color:#fff;border:0;padding:11px 16px;border-radius:9px;cursor:pointer;display:inline-block}.btn.secondary{background:#eee;color:#171717}.results{display:grid;gap:10px}.result{background:#fff;border:1px solid #e4e4e4;border-radius:12px;padding:15px}.result h3{margin:0 0 7px;font-size:17px}.badge{display:inline-block;background:#f0f0ef;border-radius:999px;padding:4px 9px;font-size:12px;margin-inline-end:5px}.snippet{line-height:1.8;color:#444;white-space:pre-wrap}.pager{display:flex;gap:8px;justify-content:center;margin:20px}.pager a{padding:8px 12px;background:#fff;border:1px solid #ddd;border-radius:8px}.doc{white-space:pre-wrap;line-height:2;font-size:15px;background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:22px;max-height:70vh;overflow:auto}.login{max-width:430px;margin:9vh auto}.login input{width:100%;margin:6px 0 14px}.alert{padding:11px 14px;border-radius:9px;margin-bottom:12px;background:#fff2d8;border:1px solid #efd18b}.ok{background:#eaf7ed;border-color:#b8dfc1}.tablewrap{overflow:auto}.table{width:100%;border-collapse:collapse;background:#fff}.table th,.table td{padding:11px;border-bottom:1px solid #eee;text-align:right;vertical-align:top}.actions{display:flex;gap:8px;flex-wrap:wrap}.meta{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 18px}.code{direction:ltr;text-align:left;font-family:monospace;background:#f0f0f0;padding:8px;border-radius:7px;overflow:auto}.danger{background:#8f1d1d}.small{font-size:12px}@media(max-width:760px){.searchbar{grid-template-columns:1fr}.top{padding:12px}.top nav{gap:8px;font-size:13px}.wrap{padding:14px}}
"""

BASE = """<!doctype html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex,nofollow,noarchive\"><title>{{ title }} · أرشيف نوافذ الداخلي</title><style>""" + CSS + """</style></head><body>
{% if session.get('uid') %}<header class=\"top\"><a class=\"brand\" href=\"{{ url_for('dashboard') }}\">أرشيف نوافذ</a><nav><a href=\"{{ url_for('search') }}\">البحث</a>{% if role_rank >= 3 %}<a href=\"{{ url_for('users') }}\">المستخدمون</a><a href=\"{{ url_for('audit') }}\">السجل</a>{% endif %}<span class=\"muted\">{{ session.get('username') }}</span><a href=\"{{ url_for('logout') }}\">خروج</a></nav></header>{% endif %}
<main class=\"wrap\">{% for category,message in get_flashed_messages(with_categories=true) %}<div class=\"alert {% if category=='ok' %}ok{% endif %}\">{{ message }}</div>{% endfor %}{{ content|safe }}</main></body></html>"""


def db():
    if "db" not in g:
        if not DB_PATH.exists():
            raise RuntimeError(f"Database not found: {DB_PATH}")
        g.db = sqlite3.connect(DB_PATH, timeout=30)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys=ON")
        g.db.execute("PRAGMA busy_timeout=30000")
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    d = g.pop("db", None)
    if d is not None:
        d.close()


def csrf_token():
    if "csrf" not in session:
        session["csrf"] = secrets.token_urlsafe(24)
    return session["csrf"]

app.jinja_env.globals["csrf_token"] = csrf_token


def verify_csrf():
    if request.method == "POST" and not secrets.compare_digest(request.form.get("csrf", ""), session.get("csrf", "")):
        abort(400)


def current_user():
    uid = session.get("uid")
    if not uid:
        return None
    return db().execute("SELECT id,username,role,active FROM users WHERE id=?", (uid,)).fetchone()


def log(action, detail=""):
    u = current_user()
    db().execute("INSERT INTO audit_log(user_id,action,detail,ip) VALUES(?,?,?,?)", (u["id"] if u else None, action, detail[:4000], request.headers.get("X-Forwarded-For", request.remote_addr)))
    db().commit()


def login_required(fn):
    @wraps(fn)
    def wrapped(*a, **kw):
        u = current_user()
        if not u or not u["active"]:
            session.clear()
            return redirect(url_for("login", next=request.path))
        g.user = u
        return fn(*a, **kw)
    return wrapped


def role_required(min_role):
    def deco(fn):
        @wraps(fn)
        @login_required
        def wrapped(*a, **kw):
            if ROLE_RANK.get(g.user["role"], 0) < ROLE_RANK[min_role]:
                abort(403)
            return fn(*a, **kw)
        return wrapped
    return deco


def render_page(title, body_tpl, **ctx):
    role = session.get("role", "viewer")
    content = render_template_string(body_tpl, **ctx)
    return render_template_string(BASE, title=title, content=content, role_rank=ROLE_RANK.get(role, 0))


def safe_match(q):
    tokens = re.findall(r"[\w\u0600-\u06ff]+", q, flags=re.UNICODE)[:12]
    if not tokens:
        return ""
    return " AND ".join('"' + t.replace('"', '') + '"' for t in tokens if len(t) > 1)


def excerpt(text, q, limit=420):
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) <= limit:
        return text
    pos = -1
    for token in re.findall(r"[\w\u0600-\u06ff]+", q):
        pos = text.casefold().find(token.casefold())
        if pos >= 0:
            break
    if pos < 0:
        return text[:limit] + "…"
    start = max(0, pos - limit // 3)
    return ("…" if start else "") + text[start:start + limit] + "…"


def bootstrap_owner():
    if not DB_PATH.exists():
        return
    con = sqlite3.connect(DB_PATH)
    try:
        count = con.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        username = os.environ.get("ADMIN_USERNAME", "").strip()
        password = os.environ.get("ADMIN_PASSWORD", "")
        if count == 0 and username and password:
            con.execute("INSERT INTO users(username,password_hash,role) VALUES(?,?, 'owner')", (username, generate_password_hash(password)))
            con.commit()
    finally:
        con.close()


@app.get("/health")
def health():
    return {"ok": True, "db": DB_PATH.exists()}


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        verify_csrf()
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        u = db().execute("SELECT * FROM users WHERE username=? AND active=1", (username,)).fetchone()
        if u and check_password_hash(u["password_hash"], password):
            session.clear(); session.permanent = True
            session.update(uid=u["id"], username=u["username"], role=u["role"], csrf=secrets.token_urlsafe(24))
            log("login", "successful login")
            return redirect(url_for("dashboard"))
        flash("بيانات الدخول غير صحيحة")
    return render_page("تسجيل الدخول", """<section class=\"card login\"><h1>أرشيف نوافذ الداخلي</h1><p class=\"muted\">دخول أعضاء الفريق فقط</p><form method=\"post\"><input type=\"hidden\" name=\"csrf\" value=\"{{ csrf_token() }}\"><label>اسم المستخدم</label><input name=\"username\" autocomplete=\"username\" required><label>كلمة المرور</label><input name=\"password\" type=\"password\" autocomplete=\"current-password\" required><button style=\"width:100%\">دخول</button></form></section>""")


@app.get("/logout")
def logout():
    if session.get("uid"):
        try: log("logout")
        except Exception: pass
    session.clear()
    return redirect(url_for("login"))


@app.get("/")
@login_required
def dashboard():
    stats = {r[0]: r[1] for r in db().execute("SELECT key,value FROM metadata")}
    routes = db().execute("SELECT route,COUNT(*) n FROM documents WHERE lang='ar' GROUP BY route ORDER BY n DESC LIMIT 12").fetchall()
    return render_page("الرئيسية", """<h1>الأرشيف الداخلي</h1><p class=\"muted\">نسخة مستقلة للبحث والرجوع إلى بيانات نوافذ بدون الاعتماد على الموقع الأصلي.</p><section class=\"grid\"><div class=\"card stat\"><b>{{ stats.get('documents','—') }}</b><span>صفحة محفوظة</span></div><div class=\"card stat\"><b>{{ stats.get('register_records','—') }}</b><span>سجل منظم</span></div><div class=\"card stat\"><b>4</b><span>مستويات صلاحيات</span></div></section><section class=\"card\" style=\"margin-top:16px\"><h2>بحث سريع</h2><form class=\"searchbar\" action=\"{{ url_for('search') }}\"><input name=\"q\" placeholder=\"اسم شخص، شركة، رقم قرار، كلمة من النص…\" autofocus><select name=\"route\"><option value=\"\">كل الأقسام</option>{% for r in routes %}<option value=\"{{ r.route }}\">{{ labels.get(r.route,r.route) }} ({{ r.n }})</option>{% endfor %}</select><select name=\"lang\"><option value=\"ar\">العربية</option><option value=\"en\">English</option><option value=\"\">الكل</option></select><button>بحث</button></form></section>""", stats=stats, routes=routes, labels=ROUTE_AR)


@app.get("/search")
@login_required
def search():
    q = request.args.get("q", "").strip()[:300]
    route = request.args.get("route", "").strip()[:50]
    lang = request.args.get("lang", "ar").strip()[:10]
    page = max(1, min(int(request.args.get("page", 1) or 1), 10000))
    per = 30; off = (page - 1) * per
    results = []
    if q:
        match = safe_match(q)
        if match:
            sql = """SELECT d.id,d.url,d.lang,d.route,d.record_type,d.slug,d.title,d.h1,d.body_text,bm25(documents_fts,4.0,3.0,1.0) score FROM documents_fts JOIN documents d ON d.id=documents_fts.rowid WHERE documents_fts MATCH ?"""
            params = [match]
            if route: sql += " AND d.route=?"; params.append(route)
            if lang: sql += " AND d.lang=?"; params.append(lang)
            sql += " ORDER BY score LIMIT ? OFFSET ?"; params += [per, off]
            try: rows = db().execute(sql, params).fetchall()
            except sqlite3.OperationalError: rows = []
            results = [dict(r) | {"snippet": excerpt(r["body_text"], q)} for r in rows]
        # Also surface structured register records at the top on first page.
        if page == 1 and safe_match(q):
            try:
                rr = db().execute("""SELECT r.*,bm25(register_fts) score FROM register_fts JOIN register_records r ON r.id=register_fts.rowid WHERE register_fts MATCH ? ORDER BY score LIMIT 12""", (safe_match(q),)).fetchall()
                for r in reversed(rr):
                    results.insert(0, {"id": "r" + str(r["id"]), "url": "", "lang": "ar", "route": "register", "record_type": r["kind"], "slug": "", "title": r["title_ar"] or r["title_en"], "h1": r["issuer_ar"], "snippet": excerpt((r["detail_ar"] or "") + " " + (r["detail_en"] or ""), q), "register_id": r["id"]})
            except sqlite3.OperationalError: pass
        log("search", f"q={q}; route={route}; lang={lang}; page={page}")
    routes = db().execute("SELECT route,COUNT(*) n FROM documents WHERE lang='ar' GROUP BY route ORDER BY n DESC").fetchall()
    return render_page("البحث", """<h1>البحث في الأرشيف</h1><form class=\"searchbar\"><input name=\"q\" value=\"{{ q }}\" placeholder=\"ابحث في النص الكامل…\" autofocus><select name=\"route\"><option value=\"\">كل الأقسام</option>{% for r in routes %}<option value=\"{{ r.route }}\" {% if route==r.route %}selected{% endif %}>{{ labels.get(r.route,r.route) }} ({{ r.n }})</option>{% endfor %}</select><select name=\"lang\"><option value=\"ar\" {% if lang=='ar' %}selected{% endif %}>العربية</option><option value=\"en\" {% if lang=='en' %}selected{% endif %}>English</option><option value=\"\" {% if not lang %}selected{% endif %}>الكل</option></select><button>بحث</button></form>{% if q %}<div class=\"results\">{% for r in results %}<article class=\"result\"><div><span class=\"badge\">{{ labels.get(r.route,r.route) }}</span><span class=\"badge\">{{ r.lang }}</span></div><h3>{% if r.register_id %}<a href=\"{{ url_for('register_detail', rid=r.register_id) }}\">{{ r.title or r.h1 or 'سجل' }}</a>{% else %}<a href=\"{{ url_for('document', doc_id=r.id) }}\">{{ r.title or r.h1 or r.slug }}</a>{% endif %}</h3>{% if r.h1 and r.h1 != r.title %}<div class=\"muted\">{{ r.h1 }}</div>{% endif %}<p class=\"snippet\">{{ r.snippet }}</p></article>{% else %}<div class=\"card\">ما لقينا نتائج مطابقة.</div>{% endfor %}</div>{% if results %}<div class=\"pager\">{% if page>1 %}<a href=\"?q={{ q|urlencode }}&route={{ route }}&lang={{ lang }}&page={{ page-1 }}\">السابق</a>{% endif %}<span class=\"badge\">صفحة {{ page }}</span><a href=\"?q={{ q|urlencode }}&route={{ route }}&lang={{ lang }}&page={{ page+1 }}\">التالي</a></div>{% endif %}{% endif %}""", q=q, route=route, lang=lang, page=page, results=results, routes=routes, labels=ROUTE_AR)


@app.get("/document/<int:doc_id>")
@login_required
def document(doc_id):
    r = db().execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not r: abort(404)
    log("view_document", f"id={doc_id}; url={r['url']}")
    return render_page(r["title"] or r["h1"] or "مستند", """<div class=\"actions\"><a class=\"btn secondary\" href=\"{{ url_for('search') }}\">رجوع للبحث</a>{% if rank>=2 %}<a class=\"btn\" href=\"{{ url_for('export_document',doc_id=r.id) }}\">تصدير نص</a>{% endif %}</div><h1>{{ r.title or r.h1 or r.slug }}</h1><div class=\"meta\"><span class=\"badge\">{{ labels.get(r.route,r.route) }}</span><span class=\"badge\">{{ r.lang }}</span><span class=\"badge\">{{ r.record_type }}</span></div><div class=\"code\">{{ r.url }}</div><div class=\"doc\">{{ r.body_text }}</div>""", r=r, labels=ROUTE_AR, rank=ROLE_RANK.get(g.user["role"],0))


@app.get("/register/<int:rid>")
@login_required
def register_detail(rid):
    r = db().execute("SELECT * FROM register_records WHERE id=?", (rid,)).fetchone()
    if not r: abort(404)
    log("view_register", f"id={rid}; kind={r['kind']}")
    return render_page(r["title_ar"] or r["title_en"] or "سجل", """<h1>{{ r.title_ar or r.title_en }}</h1><div class=\"meta\"><span class=\"badge\">{{ r.kind }}</span><span class=\"badge\">{{ r.record_date }}</span><span class=\"badge\">{{ r.year_month }}</span>{% if r.governorate %}<span class=\"badge\">{{ r.governorate }}</span>{% endif %}</div><div class=\"card\"><b>الجهة:</b> {{ r.issuer_ar or r.issuer_en }}<hr><div class=\"snippet\">{{ r.detail_ar or r.detail_en or 'لا توجد تفاصيل إضافية في السجل المنظم.' }}</div></div>""", r=r)


@app.get("/document/<int:doc_id>/export.txt")
@role_required("researcher")
def export_document(doc_id):
    r = db().execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not r: abort(404)
    log("export_document", f"id={doc_id}")
    text = f"{r['title'] or ''}\n{r['h1'] or ''}\n\n{r['body_text'] or ''}\n\nSOURCE: {r['url']}\n"
    return Response(text, mimetype="text/plain; charset=utf-8", headers={"Content-Disposition": f"attachment; filename=document-{doc_id}.txt"})


@app.get("/export.csv")
@role_required("researcher")
def export_search():
    q = request.args.get("q", "").strip()[:300]
    if not q or not safe_match(q): abort(400)
    rows = db().execute("""SELECT d.id,d.url,d.lang,d.route,d.title,d.h1,d.body_text FROM documents_fts JOIN documents d ON d.id=documents_fts.rowid WHERE documents_fts MATCH ? LIMIT 5000""", (safe_match(q),)).fetchall()
    out = io.StringIO(); w = csv.writer(out); w.writerow(["id","url","language","section","title","heading","text"])
    for r in rows: w.writerow(r)
    log("export_search", f"q={q}; rows={len(rows)}")
    return Response('\ufeff' + out.getvalue(), mimetype="text/csv; charset=utf-8", headers={"Content-Disposition": "attachment; filename=nawafith-search.csv"})


@app.route("/users", methods=["GET", "POST"])
@role_required("admin")
def users():
    if request.method == "POST":
        verify_csrf()
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        role = request.form.get("role", "viewer")
        allowed = {"viewer","researcher"} if g.user["role"] == "admin" else set(ROLE_RANK)
        if role not in allowed or len(username) < 3 or len(password) < 8:
            flash("تحقق من اسم المستخدم، كلمة المرور (8 أحرف على الأقل)، والصلاحية.")
        else:
            try:
                db().execute("INSERT INTO users(username,password_hash,role) VALUES(?,?,?)", (username, generate_password_hash(password), role)); db().commit(); log("create_user", f"username={username}; role={role}"); flash("تمت إضافة المستخدم", "ok")
            except sqlite3.IntegrityError: flash("اسم المستخدم موجود مسبقاً")
    rows = db().execute("SELECT id,username,role,active,created_at FROM users ORDER BY id").fetchall()
    roles = ["viewer","researcher"] + (["admin","owner"] if g.user["role"] == "owner" else [])
    return render_page("المستخدمون", """<h1>المستخدمون والصلاحيات</h1><section class=\"card\"><h2>إضافة مستخدم</h2><form method=\"post\" class=\"searchbar\"><input type=\"hidden\" name=\"csrf\" value=\"{{ csrf_token() }}\"><input name=\"username\" placeholder=\"اسم المستخدم\" required><input name=\"password\" type=\"password\" placeholder=\"كلمة المرور\" minlength=\"8\" required><select name=\"role\">{% for role in roles %}<option value=\"{{ role }}\">{{ role_labels[role] }}</option>{% endfor %}</select><button>إضافة</button></form></section><div class=\"tablewrap card\" style=\"margin-top:16px\"><table class=\"table\"><tr><th>المستخدم</th><th>الدور</th><th>الحالة</th><th>تاريخ الإنشاء</th><th></th></tr>{% for u in users %}<tr><td>{{ u.username }}</td><td>{{ role_labels[u.role] }}</td><td>{{ 'فعال' if u.active else 'موقوف' }}</td><td>{{ u.created_at }}</td><td>{% if u.id != me.id and (me.role=='owner' or u.role not in ['owner','admin']) %}<form method=\"post\" action=\"{{ url_for('toggle_user',uid=u.id) }}\"><input type=\"hidden\" name=\"csrf\" value=\"{{ csrf_token() }}\"><button class=\"secondary\">{{ 'إيقاف' if u.active else 'تفعيل' }}</button></form>{% endif %}</td></tr>{% endfor %}</table></div>""", users=rows, roles=roles, role_labels=ROLE_AR, me=g.user)


@app.post("/users/<int:uid>/toggle")
@role_required("admin")
def toggle_user(uid):
    verify_csrf()
    target = db().execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
    if not target or target["id"] == g.user["id"]: abort(400)
    if g.user["role"] != "owner" and target["role"] in ("owner","admin"): abort(403)
    db().execute("UPDATE users SET active=CASE active WHEN 1 THEN 0 ELSE 1 END WHERE id=?", (uid,)); db().commit(); log("toggle_user", f"user={target['username']}")
    return redirect(url_for("users"))


@app.get("/audit")
@role_required("admin")
def audit():
    rows = db().execute("""SELECT a.*,u.username FROM audit_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 500""").fetchall()
    return render_page("سجل التدقيق", """<h1>سجل التدقيق</h1><div class=\"tablewrap card\"><table class=\"table\"><tr><th>الوقت</th><th>المستخدم</th><th>العملية</th><th>التفاصيل</th><th>IP</th></tr>{% for r in rows %}<tr><td class=\"small\">{{ r.created_at }}</td><td>{{ r.username or '—' }}</td><td>{{ r.action }}</td><td class=\"small\">{{ r.detail }}</td><td class=\"small\">{{ r.ip }}</td></tr>{% endfor %}</table></div>""", rows=rows)


@app.errorhandler(403)
def forbidden(_): return render_page("غير مسموح", "<div class='card'><h1>غير مسموح</h1><p>صلاحيتك الحالية لا تسمح بهذه العملية.</p></div>"), 403


if __name__ == "__main__":
    bootstrap_owner()
    app.run(host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", "8080")), debug=False)
else:
    bootstrap_owner()
