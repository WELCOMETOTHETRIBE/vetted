"""
FastAPI main application for Vetted backend services.
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import trends
from backend.core.config import Config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Vetted Backend API",
    description="Backend API services for Vetted platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(trends.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Vetted Backend API",
        "version": "1.0.0",
        "endpoints": {
            "trends": "/api/trends",
            "health": "/api/trends/health"
        }
    }


@app.on_event("startup")
async def startup_event():
    """Validate configuration on startup."""
    logger.info("Starting Vetted Backend API...")
    Config.validate()
    logger.info("Configuration validated")


if __name__ == "__main__":
    import uvicorn
    import os
    
    # Railway sets PORT env var, fallback to config
    port = int(os.getenv("PORT", Config.API_PORT))
    
    uvicorn.run(
        "backend.main:app",
        host=Config.API_HOST,
        port=port,
        reload=False  # Disable reload in production
    )

