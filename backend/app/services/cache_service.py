"""
Redis caching service for performance optimization.
Provides a simple interface for caching API responses and computed data.
"""
import json
import hashlib
from typing import Optional, Any, Callable
from functools import wraps
import redis
from fakeredis import FakeRedis
from ..core.config import settings


class CacheService:
    """
    Redis-based caching service with fallback to in-memory cache.
    """
    
    def __init__(self):
        self._client: Optional[redis.Redis] = None
        self._enabled = settings.redis_cache_enabled
        self._ttl = settings.redis_cache_ttl
        self._prefix = settings.redis_cache_prefix
    
    def _get_client(self) -> Optional[redis.Redis]:
        """Get or create Redis client."""
        if self._client is not None:
            return self._client
        
        if not self._enabled:
            return None
        
        try:
            # Try to connect to real Redis
            self._client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
            # Test connection
            self._client.ping()
            return self._client
        except Exception:
            # Fall back to FakeRedis for development
            print("ℹ Redis not available, using in-memory cache (FakeRedis)")
            self._client = FakeRedis(decode_responses=True)
            return self._client
    
    def _make_key(self, key: str) -> str:
        """Create a prefixed cache key."""
        return f"{self._prefix}{key}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from cache."""
        client = self._get_client()
        if not client:
            return None
        
        try:
            value = client.get(self._make_key(key))
            if value:
                return json.loads(value)
            return None
        except Exception:
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set a value in cache with optional TTL."""
        client = self._get_client()
        if not client:
            return False
        
        try:
            serialized = json.dumps(value, default=str)
            cache_key = self._make_key(key)
            ttl = ttl or self._ttl
            
            client.setex(cache_key, ttl, serialized)
            return True
        except Exception:
            return False
    
    def delete(self, key: str) -> bool:
        """Delete a value from cache."""
        client = self._get_client()
        if not client:
            return False
        
        try:
            client.delete(self._make_key(key))
            return True
        except Exception:
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern."""
        client = self._get_client()
        if not client:
            return 0
        
        try:
            keys = client.keys(self._make_key(pattern))
            if keys:
                return client.delete(*keys)
            return 0
        except Exception:
            return 0
    
    def exists(self, key: str) -> bool:
        """Check if a key exists in cache."""
        client = self._get_client()
        if not client:
            return False
        
        try:
            return bool(client.exists(self._make_key(key)))
        except Exception:
            return False
    
    def get_ttl(self, key: str) -> int:
        """Get remaining TTL for a key in seconds."""
        client = self._get_client()
        if not client:
            return -1
        
        try:
            return client.ttl(self._make_key(key))
        except Exception:
            return -1
    
    def increment(self, key: str, amount: int = 1) -> int:
        """Increment a counter in cache."""
        client = self._get_client()
        if not client:
            return 0
        
        try:
            return client.incrby(self._make_key(key), amount)
        except Exception:
            return 0
    
    def cache_response(self, key_prefix: str, ttl: Optional[int] = None):
        """
        Decorator to cache function results.
        
        Usage:
            @cache_service.cache_response("questions_list", ttl=300)
            async def get_questions(...):
                ...
        """
        def decorator(func: Callable):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Create cache key from function name and arguments
                cache_key = self._create_cache_key(key_prefix, args, kwargs)
                
                # Try to get from cache
                cached = self.get(cache_key)
                if cached is not None:
                    return cached
                
                # Execute function and cache result
                result = await func(*args, **kwargs)
                self.set(cache_key, result, ttl)
                return result
            
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                cache_key = self._create_cache_key(key_prefix, args, kwargs)
                
                cached = self.get(cache_key)
                if cached is not None:
                    return cached
                
                result = func(*args, **kwargs)
                self.set(cache_key, result, ttl)
                return result
            
            import asyncio
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            return sync_wrapper
        
        return decorator
    
    def _create_cache_key(self, prefix: str, args: tuple, kwargs: dict) -> str:
        """Create a unique cache key from function arguments."""
        # Convert args and kwargs to a string representation
        key_data = f"{prefix}:{str(args)}:{str(sorted(kwargs.items()))}"
        # Hash to create a fixed-length key
        return f"{prefix}:{hashlib.md5(key_data.encode()).hexdigest()}"
    
    def clear_all(self) -> bool:
        """Clear all cache entries with our prefix."""
        client = self._get_client()
        if not client:
            return False
        
        try:
            keys = client.keys(f"{self._prefix}*")
            if keys:
                client.delete(*keys)
            return True
        except Exception:
            return False
    
    def health_check(self) -> dict:
        """Check cache health status."""
        result = {
            "enabled": self._enabled,
            "connected": False,
            "type": "none"
        }
        
        client = self._get_client()
        if client:
            try:
                client.ping()
                result["connected"] = True
                result["type"] = "redis" if not isinstance(client, FakeRedis) else "fake_redis"
            except Exception:
                pass
        
        return result


# Singleton instance
cache_service = CacheService()
