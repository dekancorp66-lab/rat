#!/bin/bash
# JengaAI FastAPI backend — auth + Mazungumzo (Gemini chat)
set -e

PORT_FROM_PLATFORM="${PORT:-}"

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

PORT="${PORT_FROM_PLATFORM:-${PORT:-8000}}"
export PORT

echo "JengaAI backend: starting on 0.0.0.0:${PORT}..."

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Generating Prisma client..."
prisma generate

echo "Applying committed database migrations..."
prisma migrate deploy --schema prisma/schema.prisma

echo "Starting FastAPI on http://0.0.0.0:${PORT} ..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT}"
