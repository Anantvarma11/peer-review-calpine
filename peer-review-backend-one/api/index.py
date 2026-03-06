# Vercel serverless entrypoint: must live under api/ for Vercel to discover it.
# CWD at runtime is project root (peer-review-backend-one), so main is importable.
from main import app
