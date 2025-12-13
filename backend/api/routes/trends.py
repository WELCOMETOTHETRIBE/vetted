"""
FastAPI routes for Tech Trends endpoint.
"""
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from backend.models.trends import TrendsResponse
from backend.services.trends_service import TrendsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/trends", tags=["trends"])


@router.get("", response_model=TrendsResponse)
async def get_trends():
    """
    Get current tech trends.
    
    Fetches latest technology trends from Google Search and enriches them
    with AI-generated highlights.
    
    Returns:
        TrendsResponse with list of trend items and last updated timestamp
    """
    try:
        service = TrendsService()
        response = await service.get_trends()
        return response
    except Exception as e:
        logger.error(f"Error in get_trends endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch trends. Please try again later."
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for trends service."""
    from backend.core.config import Config
    
    return JSONResponse({
        "status": "ok",
        "google_configured": Config.is_google_configured(),
        "openai_configured": Config.is_openai_configured()
    })

