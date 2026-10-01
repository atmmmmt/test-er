FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends zstd && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py entrypoint.sh ./
RUN chmod +x /app/entrypoint.sh && mkdir -p /data
ENV NAWAFITH_DB=/data/nawafith_internal.sqlite3 \
    HOST=0.0.0.0 \
    PORT=8080 \
    COOKIE_SECURE=0
EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
