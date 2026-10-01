FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
RUN mkdir -p /data
ENV NAWAFITH_DB=/data/nawafith_internal.sqlite3 \
    HOST=0.0.0.0 \
    PORT=8080 \
    COOKIE_SECURE=0
EXPOSE 8080
CMD ["gunicorn","-w","2","-b","0.0.0.0:8080","--timeout","120","app:app"]
