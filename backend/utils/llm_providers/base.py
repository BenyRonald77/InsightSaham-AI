"""
InsightSaham — LLM Provider Base Class
Abstract interface for LLM providers (Gemini, Groq, OpenRouter, etc.)
Ensures the system is not locked to any single provider.
"""
from abc import ABC, abstractmethod
from typing import Optional


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def generate(self, prompt: str, system_instruction: str = "") -> Optional[str]:
        """
        Generate text from a prompt.
        
        Args:
            prompt: The user/system prompt with data to narrate
            system_instruction: System-level instructions for the model
            
        Returns:
            Generated text string, or None if failed
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if this provider is configured and available."""
        pass

    @abstractmethod
    def get_name(self) -> str:
        """Return the provider name."""
        pass
