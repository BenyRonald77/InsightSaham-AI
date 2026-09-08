"""
InsightSaham — Google Gemini LLM Provider
Implementation of LLM provider for Google Gemini API (Flash model)
"""
import logging
from typing import Optional

from utils.llm_providers.base import LLMProvider
from config import settings

logger = logging.getLogger(__name__)

# Try importing google-generativeai, gracefully handle if not installed
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-generativeai not installed. Gemini provider will be unavailable.")


class GeminiProvider(LLMProvider):
    """Google Gemini Flash LLM provider."""

    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model_name = "gemini-3.6-flash"
        self._client = None

    def _get_client(self):
        """Lazy-init the Gemini client."""
        if not GENAI_AVAILABLE:
            return None
        if self._client is None and self.is_available():
            genai.configure(api_key=self.api_key)
            self._client = genai.GenerativeModel(self.model_name)
        return self._client

    async def generate(self, prompt: str, system_instruction: str = "") -> Optional[str]:
        """Generate narrative text using Gemini Flash."""
        try:
            client = self._get_client()
            if client is None:
                logger.warning("Gemini client not available")
                return None

            full_prompt = prompt
            if system_instruction:
                full_prompt = f"{system_instruction}\n\n{prompt}"

            response = client.generate_content(full_prompt)

            if response and response.text:
                return response.text.strip()

            logger.warning("Empty response from Gemini")
            return None

        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            return None

    def is_available(self) -> bool:
        """Check if Gemini API key is configured and library is installed."""
        return (
            GENAI_AVAILABLE
            and bool(self.api_key)
            and self.api_key != "your_gemini_api_key_here"
        )

    def get_name(self) -> str:
        return "Google Gemini Flash"
