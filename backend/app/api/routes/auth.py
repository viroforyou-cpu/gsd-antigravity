"""Authentication API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from ...models.auth import (
    User, UserCreate, UserLogin, Token, RefreshToken, 
    PasswordReset, PasswordResetConfirm, ChangePassword
)
from ...services.auth_service import (
    auth_service, user_repository, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user_create: UserCreate):
    """
    Register a new user account.
    
    - **email**: Valid email address
    - **password**: Minimum 8 characters
    - **username**: Optional display name
    """
    user = await user_repository.create(user_create)
    return user


@router.post("/login", response_model=Token)
async def login(user_login: UserLogin):
    """
    Login to get access and refresh tokens.
    
    - **email**: Registered email address
    - **password**: User password
    """
    user_dict = await user_repository.get_by_email(user_login.email)
    
    if user_dict is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not auth_service.verify_password(user_login.password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user_dict["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    token = auth_service.create_token_pair(
        user_id=user_dict["id"],
        email=user_dict["email"],
        role=user_dict["role"]
    )
    
    return token


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh: RefreshToken):
    """
    Refresh access token using a valid refresh token.
    
    - **refresh_token**: Valid refresh token from login
    """
    payload = auth_service.validate_refresh_token(refresh.refresh_token)
    
    # Verify user still exists and is active
    user_dict = await user_repository.get_by_id(payload.sub)
    
    if user_dict is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user_dict["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Create new token pair
    token = auth_service.create_token_pair(
        user_id=user_dict["id"],
        email=user_dict["email"],
        role=user_dict["role"]
    )
    
    return token


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.
    """
    return current_user


@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user)
):
    """
    Change the current user's password.
    
    - **current_password**: Current password for verification
    - **new_password**: New password (minimum 8 characters)
    """
    user_dict = await user_repository.get_by_id(current_user.id)
    
    if user_dict is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not auth_service.verify_password(password_data.current_password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password (in mock, this updates the dict)
    user_dict["hashed_password"] = auth_service.hash_password(password_data.new_password)
    
    return {"message": "Password changed successfully"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout the current user.
    
    Note: With JWT, true logout requires token blacklisting. 
    This endpoint is for client-side token removal.
    """
    return {"message": "Successfully logged out"}


@router.post("/forgot-password")
async def forgot_password(reset_data: PasswordReset):
    """
    Request a password reset email.
    
    Note: In production, this would send an email with a reset link.
    For development, it returns a success message regardless of email existence.
    """
    # Always return success to prevent email enumeration
    return {
        "message": "If the email exists, a password reset link has been sent"
    }


@router.post("/reset-password")
async def reset_password(reset_confirm: PasswordResetConfirm):
    """
    Reset password using a valid reset token.
    
    Note: In production, this would validate the token from the email.
    For development, it accepts any token.
    """
    # In production, validate the reset token
    return {"message": "Password has been reset successfully"}
