FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

# libgomp1 diperlukan oleh LightGBM / XGBoost yang dipakai di intelligence domain
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m pip install --upgrade pip \
    && pip install -r requirements.txt

COPY . .

EXPOSE 8000

# Render mengatur PORT secara otomatis; fallback ke 8000 untuk local docker run.
# start.sh menjalankan migrasi + bootstrap admin sebelum start uvicorn.
CMD ["sh", "start.sh"]