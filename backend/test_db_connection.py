"""
Standalone Postgres connection tester — bypasses Prisma entirely.
This talks to Postgres directly so we get the RAW error message,
instead of Prisma's generic "P1000/P1001" wrapper.

Usage:
    pip install psycopg2-binary
    python test_db_connection.py

It reads DATABASE_URL from your .env automatically.
"""

import os
import sys
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

try:
    import psycopg2
except ImportError:
    print("Installing psycopg2-binary first...")
    os.system(f"{sys.executable} -m pip install psycopg2-binary")
    import psycopg2

# Load .env manually (no extra dependency needed)
def load_env(path=".env"):
    if not os.path.exists(path):
        print(f"❌ No .env found at {os.path.abspath(path)}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

load_env()

url = os.environ.get("DATABASE_URL")
if not url:
    print("❌ DATABASE_URL not found in .env")
    sys.exit(1)

# Prisma accepts pgbouncer=true, but libpq does not recognize it as a
# connection parameter. Remove only that Prisma-specific option for psycopg2.
parts = urlsplit(url)
query = urlencode([(key, value) for key, value in parse_qsl(parts.query) if key != "pgbouncer"])
psycopg2_url = urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))

# Show the URL with the password masked, so we can eyeball formatting issues
import re
masked = re.sub(r":([^:@]+)@", ":****@", url, count=1)
print(f"Connecting to: {masked}\n")

# Check for trailing/leading whitespace or stray characters — a very common
# copy-paste bug that Prisma's error messages don't surface clearly.
if url != url.strip():
    print("⚠️  WARNING: your DATABASE_URL has leading/trailing whitespace!")
if "\n" in url or "\t" in url:
    print("⚠️  WARNING: your DATABASE_URL contains a newline or tab character!")

try:
    conn = psycopg2.connect(psycopg2_url, connect_timeout=10)
    cur = conn.cursor()
    cur.execute("SELECT version();")
    version = cur.fetchone()[0]
    print("✅ SUCCESS — connected to Postgres!")
    print(f"   {version}")
    cur.close()
    conn.close()
except psycopg2.OperationalError as e:
    print("❌ CONNECTION FAILED — raw Postgres error below:\n")
    print(str(e))
    print("\nCommon meanings:")
    print(" - 'password authentication failed' → the password is genuinely wrong")
    print(" - 'could not translate host name' → DNS/hostname typo")
    print(" - 'timeout expired' / 'could not connect' → network/region/IPv6 issue")
except Exception as e:
    print(f"❌ Unexpected error: {type(e).__name__}: {e}")