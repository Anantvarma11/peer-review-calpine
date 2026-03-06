# Vercel serverless entrypoint: must live under api/ for Vercel to discover it.
import sys
from pathlib import Path
# Ensure project root is on path (Vercel may run with different cwd)
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))
from main import app
