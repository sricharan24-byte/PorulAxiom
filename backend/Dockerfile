# ==============================================================================
# PorulAxiom Backend Dockerfile (Optimized for Render Web Service)
# ==============================================================================

FROM python:3.12

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    APP_ENV=production

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ /app/app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
