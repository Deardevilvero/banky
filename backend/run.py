#!/usr/bin/env python3
"""
Launch the AI Finance Tracker backend.

Usage:
    python run.py
    python run.py --port 5000 --reload
"""

import argparse
import os
import sys

# Ensure backend root is on the path when run directly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def main():
    parser = argparse.ArgumentParser(description="AI Finance Tracker API server")
    parser.add_argument("--host", default=os.getenv("HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.getenv("PORT", "5000")))
    parser.add_argument("--reload", action="store_true", default=os.getenv("DEBUG", "true").lower() == "true")
    args = parser.parse_args()

    import uvicorn

    print(f"\n  AI Finance Tracker API")
    print(f"  -> http://localhost:{args.port}/api")
    print(f"  -> http://localhost:{args.port}/health")
    print(f"  -> Docs: http://localhost:{args.port}/docs\n")

    uvicorn.run("app.main:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
