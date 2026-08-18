FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=4173

WORKDIR /app

COPY pyproject.toml README.md ./
COPY groundhog_vault ./groundhog_vault
COPY web ./web

RUN pip install --no-cache-dir . \
    && useradd --create-home --uid 10001 groundhog \
    && mkdir -p /app/.data \
    && chown -R groundhog:groundhog /app

USER groundhog

EXPOSE 4173
VOLUME ["/app/.data"]

CMD ["groundhog-serve"]
