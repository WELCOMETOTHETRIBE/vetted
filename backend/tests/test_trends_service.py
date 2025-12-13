"""
Unit tests for TrendsService.
"""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from backend.models.trends import TrendItem
from backend.services.trends_service import TrendsService


@pytest.fixture
def mock_google_response():
    """Mock Google Search API response."""
    return {
        "items": [
            {
                "title": "AI Startup Raises $50M",
                "link": "https://example.com/ai-startup",
                "snippet": "A new AI startup has raised significant funding...",
                "pagemap": {
                    "metatags": [{
                        "article:published_time": "2025-12-11T08:00:00Z"
                    }]
                }
            },
            {
                "title": "Software Engineering Trends 2025",
                "link": "https://techcrunch.com/eng-trends",
                "snippet": "Latest trends in software engineering...",
            }
        ]
    }


@pytest.fixture
def trends_service():
    """Create a TrendsService instance."""
    with patch("backend.services.trends_service.Config") as mock_config:
        mock_config.GOOGLE_SEARCH_API_KEY = "test-key"
        mock_config.GOOGLE_SEARCH_ENGINE_ID = "test-engine-id"
        mock_config.OPENAI_API_KEY = "test-openai-key"
        mock_config.is_google_configured.return_value = True
        mock_config.is_openai_configured.return_value = True
        mock_config.GOOGLE_TRENDS_REGION = "US"
        
        service = TrendsService()
        service.google_api_key = "test-key"
        service.google_engine_id = "test-engine-id"
        return service


@pytest.mark.asyncio
async def test_fetch_raw_trends_success(trends_service, mock_google_response):
    """Test successful fetching of raw trends."""
    with patch("httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.json.return_value = mock_google_response
        mock_response.raise_for_status = MagicMock()
        
        mock_client_instance = AsyncMock()
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.__aexit__.return_value = None
        mock_client_instance.get = AsyncMock(return_value=mock_response)
        mock_client.return_value = mock_client_instance
        
        results = await trends_service.fetch_raw_trends()
        
        assert len(results) > 0
        assert "title" in results[0]
        assert "link" in results[0]


@pytest.mark.asyncio
async def test_fetch_raw_trends_no_config():
    """Test fetching trends when Google API is not configured."""
    with patch("backend.services.trends_service.Config") as mock_config:
        mock_config.is_google_configured.return_value = False
        
        service = TrendsService()
        results = await service.fetch_raw_trends()
        
        assert results == []


def test_normalize_results(trends_service, mock_google_response):
    """Test normalization of raw results."""
    raw_items = mock_google_response["items"]
    raw_items[0]["category"] = "startups"
    raw_items[1]["category"] = "software_engineering"
    
    normalized = trends_service._normalize_results(raw_items)
    
    assert len(normalized) == 2
    assert isinstance(normalized[0], TrendItem)
    assert normalized[0].title == "AI Startup Raises $50M"
    assert normalized[0].category == "startups"
    assert normalized[0].source == "example.com"


def test_normalize_results_deduplication(trends_service):
    """Test that duplicate URLs are removed."""
    raw_items = [
        {
            "title": "Test Article",
            "link": "https://example.com/article",
            "snippet": "Test snippet",
            "category": "startups"
        },
        {
            "title": "Test Article Duplicate",
            "link": "https://example.com/article",  # Same URL
            "snippet": "Another snippet",
            "category": "ai"
        }
    ]
    
    normalized = trends_service._normalize_results(raw_items)
    
    assert len(normalized) == 1  # Duplicate removed


@pytest.mark.asyncio
async def test_enrich_with_ai_success(trends_service):
    """Test AI enrichment of trend items."""
    items = [
        TrendItem(
            title="Test Article",
            url="https://example.com/test",
            source="example.com",
            raw_excerpt="Test excerpt",
            category="startups"
        )
    ]
    
    mock_openai_response = MagicMock()
    mock_openai_response.choices = [MagicMock()]
    mock_openai_response.choices[0].message.content = "AI-generated highlight here"
    
    trends_service.openai_client = MagicMock()
    trends_service.openai_client.chat.completions.create = MagicMock(
        return_value=mock_openai_response
    )
    
    # Mock asyncio.to_thread or run_in_executor
    with patch("asyncio.to_thread", new_callable=AsyncMock, return_value=mock_openai_response) as mock_to_thread:
        enriched = await trends_service.enrich_with_ai(items)
        
        assert len(enriched) == 1
        assert enriched[0].highlight == "AI-generated highlight here"


@pytest.mark.asyncio
async def test_enrich_with_ai_no_openai(trends_service):
    """Test enrichment when OpenAI is not configured."""
    trends_service.openai_client = None
    
    items = [
        TrendItem(
            title="Test Article",
            url="https://example.com/test",
            source="example.com",
            raw_excerpt="Test excerpt",
            category="startups"
        )
    ]
    
    enriched = await trends_service.enrich_with_ai(items)
    
    assert len(enriched) == 1
    assert enriched[0].highlight == ""  # No highlight when OpenAI not available


@pytest.mark.asyncio
async def test_get_trends_end_to_end(trends_service, mock_google_response):
    """Test end-to-end get_trends flow."""
    with patch("httpx.AsyncClient") as mock_client:
        # Mock Google API response
        mock_response = MagicMock()
        mock_response.json.return_value = mock_google_response
        mock_response.raise_for_status = MagicMock()
        
        mock_client_instance = AsyncMock()
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.__aexit__.return_value = None
        mock_client_instance.get = AsyncMock(return_value=mock_response)
        mock_client.return_value = mock_client_instance
        
        # Mock OpenAI response
        mock_openai_response = MagicMock()
        mock_openai_response.choices = [MagicMock()]
        mock_openai_response.choices[0].message.content = "Test highlight"
        
        trends_service.openai_client = MagicMock()
        trends_service.openai_client.chat.completions.create = MagicMock(
            return_value=mock_openai_response
        )
        
        # Mock asyncio.to_thread for OpenAI calls
        with patch("asyncio.to_thread", new_callable=AsyncMock, return_value=mock_openai_response):
            response = await trends_service.get_trends()
            
            assert response.items is not None
            assert response.last_updated is not None
            assert isinstance(response.last_updated, datetime)

