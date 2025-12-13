"""
Pydantic models for Tech Trends API responses.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl, Field


class TrendItem(BaseModel):
    """Represents a single tech trend article/item."""
    title: str = Field(..., description="Article title")
    url: str = Field(..., description="Article URL")
    source: str = Field(..., description="Source domain (e.g., 'techcrunch.com')")
    published_at: Optional[datetime] = Field(None, description="Publication date if available")
    raw_excerpt: str = Field(..., description="Raw snippet/description from search results")
    highlight: str = Field(default="", description="AI-generated highlight summary")
    category: str = Field(..., description="Category (e.g., 'startups', 'software_engineering', 'ai')")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "AI-powered code review tools are transforming software engineering teams",
                "url": "https://example.com/ai-code-review",
                "source": "example.com",
                "published_at": "2025-12-11T08:00:00Z",
                "raw_excerpt": "A new wave of AI-powered tools is automating code reviews...",
                "highlight": "AI-driven review tools are speeding up PR cycles and reducing bugs for fast-growing SaaS and startup teams.",
                "category": "software_engineering"
            }
        }


class TrendsResponse(BaseModel):
    """Response model for trends endpoint."""
    items: list[TrendItem] = Field(..., description="List of trend items")
    last_updated: datetime = Field(..., description="Timestamp when trends were last fetched")
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "title": "AI-powered code review tools are transforming software engineering teams",
                        "url": "https://example.com/ai-code-review",
                        "source": "example.com",
                        "published_at": "2025-12-11T08:00:00Z",
                        "raw_excerpt": "A new wave of AI-powered tools is automating code reviews...",
                        "highlight": "AI-driven review tools are speeding up PR cycles and reducing bugs for fast-growing SaaS and startup teams.",
                        "category": "software_engineering"
                    }
                ],
                "last_updated": "2025-12-12T10:15:00Z"
            }
        }

