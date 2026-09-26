#!/bin/bash
# JengaAI FastAPI backend — auth + Mazungumzo (Gemini chat)
set -e

echo "JengaAI backend: starting..."

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Generating Prisma client..."
prisma generate

echo "Applying database schema (real Postgres)..."
prisma db push

echo "Starting FastAPI on http://0.0.0.0:8000 ..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
