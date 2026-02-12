from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "GeneReason API"
    app_version: str = "0.1.0"
    app_env: str = "development"  # development, staging, production
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:8002"]
    
    # Supabase Configuration
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    
    # Database Configuration (for direct SQLAlchemy connection)
    database_url: Optional[str] = None
    
    # LLM Configuration (GLM-4.7)
    llm_api_url: Optional[str] = None
    llm_api_key: Optional[str] = None
    llm_model: str = "glm-4-plus"  # Default model
    llm_max_tokens: int = 4096
    llm_temperature: float = 0.7
    
    # FalkorDB Configuration (Graph Database)
    falkordb_host: str = "localhost"
    falkordb_port: int = 6379
    falkordb_username: Optional[str] = None
    falkordb_password: Optional[str] = None
    falkordb_graph_name: str = "genereason_kg"  # Knowledge graph name
    
    # Redis Cache Configuration
    redis_url: str = "redis://localhost:6379/1"
    redis_cache_enabled: bool = True
    redis_cache_ttl: int = 3600  # Default TTL: 1 hour
    redis_cache_prefix: str = "genereason:"
    
    # Authentication Configuration
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7
    
    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests_per_minute: int = 60
    rate_limit_requests_per_hour: int = 1000
    
    # Feature Flags
    use_mock_data: bool = True  # Set to False when Supabase is configured
    use_mock_llm: bool = True   # Set to False when LLM API is configured
    use_mock_graph: bool = True  # Set to False when FalkorDB is configured
    require_auth: bool = False   # Set to True to require authentication
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"  # json or text
    
    class Config:
        env_file = ".env"


settings = Settings()
