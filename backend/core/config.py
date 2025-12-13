"""
Configuration management for Vetted backend services.
Loads environment variables for API keys and service configuration.
"""
import os
from typing import Optional


class Config:
    """Application configuration loaded from environment variables."""
    
    # Google Search API Configuration
    GOOGLE_SEARCH_API_KEY: Optional[str] = os.getenv("GOOGLE_SEARCH_API_KEY")
    GOOGLE_SEARCH_ENGINE_ID: Optional[str] = os.getenv("GOOGLE_SEARCH_ENGINE_ID")
    GOOGLE_TRENDS_REGION: str = os.getenv("GOOGLE_TRENDS_REGION", "US")
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("PORT", os.getenv("API_PORT", "8000")))  # Railway uses PORT
    
    @classmethod
    def validate(cls) -> bool:
        """Validate that required configuration is present."""
        if not cls.GOOGLE_SEARCH_API_KEY:
            print("Warning: GOOGLE_SEARCH_API_KEY not set")
        if not cls.GOOGLE_SEARCH_ENGINE_ID:
            print("Warning: GOOGLE_SEARCH_ENGINE_ID not set")
        if not cls.OPENAI_API_KEY:
            print("Warning: OPENAI_API_KEY not set")
        return True
    
    @classmethod
    def is_google_configured(cls) -> bool:
        """Check if Google Search API is configured."""
        return bool(cls.GOOGLE_SEARCH_API_KEY and cls.GOOGLE_SEARCH_ENGINE_ID)
    
    @classmethod
    def is_openai_configured(cls) -> bool:
        """Check if OpenAI API is configured."""
        return bool(cls.OPENAI_API_KEY)

