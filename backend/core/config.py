"""
Configuration management for Vetted backend services.
Loads environment variables for API keys and service configuration.
"""
import os
from typing import Optional


class Config:
    """Application configuration loaded from environment variables."""
    
    # SerpAPI Configuration (same as job scraper)
    SERPAPI_KEY: Optional[str] = os.getenv("SERPAPI_KEY")
    TRENDS_REGION: str = os.getenv("TRENDS_REGION", "us")  # SerpAPI uses lowercase country codes
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("PORT", os.getenv("API_PORT", "8000")))  # Railway uses PORT
    
    @classmethod
    def validate(cls) -> bool:
        """Validate that required configuration is present."""
        if not cls.SERPAPI_KEY:
            print("Warning: SERPAPI_KEY not set")
        if not cls.OPENAI_API_KEY:
            print("Warning: OPENAI_API_KEY not set")
        return True
    
    @classmethod
    def is_serpapi_configured(cls) -> bool:
        """Check if SerpAPI is configured."""
        return bool(cls.SERPAPI_KEY)
    
    @classmethod
    def is_openai_configured(cls) -> bool:
        """Check if OpenAI API is configured."""
        return bool(cls.OPENAI_API_KEY)

