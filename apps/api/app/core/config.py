from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    app_name: str = "Railier API"
    debug: bool = True
    
    # Database
    database_url: str = "postgresql+asyncpg://railier:railier_dev@localhost:5432/railier"
    
    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3-vl:8b-instruct"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
