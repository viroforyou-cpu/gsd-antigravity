"""Authentication service for JWT token management and user authentication."""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..core.config import settings
from ..models.auth import (
    User, UserCreate, UserLogin, Token, TokenPayload, UserRole
)


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


class AuthError(HTTPException):
    """Authentication error."""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthService:
    """Service for handling authentication operations."""
    
    def __init__(self):
        self.secret_key = settings.jwt_secret_key
        self.algorithm = settings.jwt_algorithm
        self.access_token_expire = settings.jwt_access_token_expire_minutes
        self.refresh_token_expire = settings.jwt_refresh_token_expire_days
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)
    
    def hash_password(self, password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)
    
    def create_access_token(
        self, 
        user_id: str, 
        email: str, 
        role: UserRole = UserRole.USER
    ) -> str:
        """Create a JWT access token."""
        now = datetime.utcnow()
        expire = now + timedelta(minutes=self.access_token_expire)
        
        payload = {
            "sub": user_id,
            "email": email,
            "role": role.value,
            "exp": expire,
            "iat": now,
            "type": "access"
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(
        self, 
        user_id: str, 
        email: str, 
        role: UserRole = UserRole.USER
    ) -> str:
        """Create a JWT refresh token."""
        now = datetime.utcnow()
        expire = now + timedelta(days=self.refresh_token_expire)
        
        payload = {
            "sub": user_id,
            "email": email,
            "role": role.value,
            "exp": expire,
            "iat": now,
            "type": "refresh"
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_token_pair(
        self, 
        user_id: str, 
        email: str, 
        role: UserRole = UserRole.USER
    ) -> Token:
        """Create both access and refresh tokens."""
        access_token = self.create_access_token(user_id, email, role)
        refresh_token = self.create_refresh_token(user_id, email, role)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=self.access_token_expire * 60  # Convert to seconds
        )
    
    def decode_token(self, token: str) -> Optional[TokenPayload]:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm]
            )
            return TokenPayload(
                sub=payload["sub"],
                email=payload["email"],
                role=UserRole(payload["role"]),
                exp=datetime.fromtimestamp(payload["exp"]),
                iat=datetime.fromtimestamp(payload["iat"]),
                type=payload["type"]
            )
        except JWTError:
            return None
    
    def validate_access_token(self, token: str) -> TokenPayload:
        """Validate an access token and return its payload."""
        payload = self.decode_token(token)
        
        if payload is None:
            raise AuthError("Invalid token")
        
        if payload.type != "access":
            raise AuthError("Invalid token type. Expected access token.")
        
        if payload.exp < datetime.utcnow():
            raise AuthError("Token has expired")
        
        return payload
    
    def validate_refresh_token(self, token: str) -> TokenPayload:
        """Validate a refresh token and return its payload."""
        payload = self.decode_token(token)
        
        if payload is None:
            raise AuthError("Invalid refresh token")
        
        if payload.type != "refresh":
            raise AuthError("Invalid token type. Expected refresh token.")
        
        if payload.exp < datetime.utcnow():
            raise AuthError("Refresh token has expired")
        
        return payload


# Global auth service instance
auth_service = AuthService()


# Mock user database for development
# Pre-computed bcrypt hashes to avoid module-load-time hashing issues
MOCK_USERS = {
    "demo@genereason.com": {
        "id": "user_001",
        "email": "demo@genereason.com",
        "username": "demo_user",
        # Pre-computed hash for "demo123456"
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA/7.J6LlZy",
        "role": UserRole.USER,
        "is_active": True,
    },
    "admin@genereason.com": {
        "id": "user_admin",
        "email": "admin@genereason.com",
        "username": "admin",
        # Pre-computed hash for "admin123456"
        "hashed_password": "$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
        "role": UserRole.ADMIN,
        "is_active": True,
    }
}


class UserRepository:
    """Repository for user operations (mock implementation)."""
    
    def __init__(self):
        self.users = MOCK_USERS
    
    async def get_by_email(self, email: str) -> Optional[dict]:
        """Get user by email."""
        return self.users.get(email)
    
    async def get_by_id(self, user_id: str) -> Optional[dict]:
        """Get user by ID."""
        for user in self.users.values():
            if user["id"] == user_id:
                return user
        return None
    
    async def create(self, user_create: UserCreate) -> User:
        """Create a new user."""
        if user_create.email in self.users:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        user_id = f"user_{len(self.users) + 1:03d}"
        now = datetime.utcnow()
        
        user_dict = {
            "id": user_id,
            "email": user_create.email,
            "username": user_create.username,
            "hashed_password": auth_service.hash_password(user_create.password),
            "role": UserRole.USER,
            "is_active": True,
            "created_at": now,
            "updated_at": None
        }
        
        self.users[user_create.email] = user_dict
        
        return User(
            id=user_id,
            email=user_create.email,
            username=user_create.username,
            role=UserRole.USER,
            is_active=True,
            created_at=now,
            updated_at=None
        )


# Global user repository instance
user_repository = UserRepository()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    Dependency to get the current authenticated user.
    Returns None if authentication is disabled or no credentials provided.
    """
    if not settings.require_auth:
        # Return a default mock user when auth is disabled
        return User(
            id="mock_user",
            email="mock@genereason.com",
            username="mock_user",
            role=UserRole.USER,
            is_active=True,
            created_at=datetime.utcnow()
        )
    
    if credentials is None:
        raise AuthError("Not authenticated")
    
    payload = auth_service.validate_access_token(credentials.credentials)
    
    user_dict = await user_repository.get_by_id(payload.sub)
    if user_dict is None:
        raise AuthError("User not found")
    
    if not user_dict["is_active"]:
        raise AuthError("User account is disabled")
    
    return User(
        id=user_dict["id"],
        email=user_dict["email"],
        username=user_dict.get("username"),
        role=user_dict["role"],
        is_active=user_dict["is_active"],
        created_at=user_dict.get("created_at", datetime.utcnow()),
        updated_at=user_dict.get("updated_at")
    )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    Dependency to optionally get the current authenticated user.
    Returns None if no credentials provided (doesn't raise error).
    """
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that requires the current user to be an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
