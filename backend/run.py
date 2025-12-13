#!/usr/bin/env python3
"""
Simple script to run the FastAPI backend server.
"""
import uvicorn
from backend.core.config import Config

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=Config.API_HOST,
        port=Config.API_PORT,
        reload=True,
        log_level="info"
    )

