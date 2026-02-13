"""
Database configuration and connection management.
Supports both Supabase client and direct PostgreSQL connection via SQLAlchemy.
"""
from typing import Optional
from supabase import create_client, Client
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager
from .config import settings

# Supabase client (optional)
_supabase_client: Optional[Client] = None

# SQLAlchemy engine and session (for direct PostgreSQL connection)
_engine = None
_SessionLocal = None
Base = declarative_base()


def get_supabase_client() -> Optional[Client]:
    """
    Get or create the Supabase client singleton.
    Returns None if Supabase is not configured.
    """
    global _supabase_client
    
    if _supabase_client is not None:
        return _supabase_client
    
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    
    _supabase_client = create_client(
        settings.supabase_url,
        settings.supabase_service_role_key
    )
    
    return _supabase_client


def get_engine():
    """
    Get or create the SQLAlchemy engine.
    Uses DATABASE_URL if configured, otherwise returns None.
    Includes optimized connection pooling settings.
    """
    global _engine
    
    if _engine is not None:
        return _engine
    
    if not settings.database_url:
        return None
    
    _engine = create_engine(
        settings.database_url,
        # Connection pooling settings
        pool_pre_ping=True,  # Verify connections before use
        pool_size=10,  # Number of connections to keep in pool
        max_overflow=20,  # Additional connections when pool is full
        pool_recycle=3600,  # Recycle connections after 1 hour
        pool_timeout=30,  # Timeout for getting connection from pool
        # Performance settings
        echo=settings.log_level == "DEBUG",
        echo_pool=False,  # Don't log pool events
    )
    
    return _engine


def get_session_local():
    """
    Get or create the session factory.
    """
    global _SessionLocal
    
    if _SessionLocal is not None:
        return _SessionLocal
    
    engine = get_engine()
    if not engine:
        return None
    
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal


def get_db() -> Session:
    """
    Dependency for FastAPI to get a database session.
    Yields a SQLAlchemy session.
    """
    SessionLocal = get_session_local()
    if SessionLocal is None:
        raise RuntimeError("Database not configured. Set DATABASE_URL environment variable.")
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session():
    """
    Context manager for database sessions.
    Use this for non-FastAPI contexts.
    """
    SessionLocal = get_session_local()
    if SessionLocal is None:
        yield None
        return
    
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def is_database_connected() -> bool:
    """Check if database is connected and configured."""
    # First try SQLAlchemy connection
    engine = get_engine()
    if engine:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception:
            pass
    
    # Fall back to Supabase client
    return get_supabase_client() is not None


async def init_db():
    """Initialize database connection and verify connectivity."""
    # Try SQLAlchemy first
    engine = get_engine()
    if engine:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("✓ PostgreSQL connection established via SQLAlchemy")
            return True
        except Exception as e:
            print(f"✗ PostgreSQL connection failed: {e}")
    
    # Fall back to Supabase
    client = get_supabase_client()
    if client:
        try:
            # Test connection by querying the questions table
            client.table("questions").select("id").limit(1).execute()
            print("✓ Supabase connection established")
            return True
        except Exception as e:
            print(f"✗ Supabase connection failed: {e}")
            return False
    
    print("ℹ Using mock data (no database configured)")
    return False
