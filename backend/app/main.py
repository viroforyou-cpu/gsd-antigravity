"""GeneReason API - Main application entry point."""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import structlog
import logging
import time
from typing import Callable

from .core.config import settings
from .core.database import is_database_connected
from .api.routes.questions import router as questions_router
from .api.routes.sessions import router as sessions_router
from .api.routes.reasoning import router as reasoning_router
from .api.routes.progress import router as progress_router
from .api.routes.llm import router as llm_router
from .api.routes.graph import router as graph_router
from .api.routes.auth import router as auth_router
from .api.routes.review import router as review_router
from .api.routes.bookmarks import router as bookmarks_router
from .api.routes.study_plans import router as study_plans_router
from .api.routes.tutor import router as tutor_router
from .api.routes.admin import router as admin_router
from .services.cache_service import cache_service


# Map string log levels to logging module constants
LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}

# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer() if settings.log_format == "json" 
        else structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        LOG_LEVELS.get(settings.log_level, logging.INFO)
    ),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


# Rate limiter setup
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_requests_per_minute}/minute"],
    enabled=settings.rate_limit_enabled,
)


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    GeneReason API - AI-powered training application for medical genetics residents.
    
    ## Features
    * Practice MCQ questions with multiple reasoning strategies
    * Knowledge graph visualization
    * LLM-powered question generation and reasoning
    * Progress tracking and analytics
    
    ## Authentication
    Most endpoints require Bearer token authentication. Use `/api/v1/auth/login` to get a token.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# Custom exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed messages."""
    logger.warning(
        "Validation error",
        path=request.url.path,
        method=request.method,
        errors=exc.errors(),
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
            "body": exc.body,
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.app_env == "development" else "An unexpected error occurred",
        },
    )


# Add rate limit exceeded handler
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip compression for responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add rate limiting middleware
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next: Callable):
    """Log all incoming requests and their duration."""
    start_time = time.time()
    
    # Log request
    logger.info(
        "Request started",
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else None,
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Log response
    logger.info(
        "Request completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration * 1000, 2),
    )
    
    # Add timing header
    response.headers["X-Process-Time"] = str(round(duration, 4))
    
    return response


# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(questions_router, prefix="/api/v1")
app.include_router(sessions_router, prefix="/api/v1")
app.include_router(reasoning_router, prefix="/api/v1")
app.include_router(progress_router, prefix="/api/v1")
app.include_router(llm_router, prefix="/api/v1")
app.include_router(graph_router, prefix="/api/v1")
app.include_router(review_router, prefix="/api/v1")
app.include_router(bookmarks_router, prefix="/api/v1")
app.include_router(study_plans_router, prefix="/api/v1")
app.include_router(tutor_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "GeneReason API",
        "version": settings.app_version,
        "environment": settings.app_env,
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/v1/auth",
            "questions": "/api/v1/questions",
            "sessions": "/api/v1/sessions",
            "reasoning": "/api/v1/reasoning",
            "progress": "/api/v1/progress",
            "llm": "/api/v1/llm",
            "graph": "/api/v1/graph",
            "review": "/api/v1/review",
            "bookmarks": "/api/v1/bookmarks",
            "study-plans": "/api/v1/study-plans",
        },
    }


@app.get("/health")
async def health():
    """Health check endpoint with service status."""
    cache_status = cache_service.health_check()
    
    return {
        "status": "healthy",
        "version": settings.app_version,
        "environment": settings.app_env,
        "services": {
            "database": "connected" if is_database_connected() else "disconnected",
            "cache": cache_status,
        },
        "features": {
            "mock_data": settings.use_mock_data,
            "mock_llm": settings.use_mock_llm,
            "mock_graph": settings.use_mock_graph,
            "auth_required": settings.require_auth,
        },
    }


@app.on_event("startup")
async def startup_event():
    """Application startup tasks."""
    logger.info(
        "Application starting",
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        auth_required=settings.require_auth,
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks."""
    logger.info("Application shutting down")
