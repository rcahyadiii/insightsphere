import os
from typing import List, Callable
from jose import jwt, JWTError
from fastapi import Request, HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from domains.identity.constants import ADMIN_OWNER_ROLES

oauth2_scheme = HTTPBearer()
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"

def get_current_user_payload(credentials: HTTPAuthorizationCredentials = Security(oauth2_scheme)):
    """Mengambil payload JWT. Raise 401 jika invalid."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_roles(allowed_roles: List[str]):
    def role_checker(payload: dict = Depends(get_current_user_payload)):
        user_role = payload.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role: {user_role}"
            )
        return payload
    return role_checker

def require_owner_or_admin(payload: dict = Depends(get_current_user_payload)):
    user_role = payload.get("role")
    if user_role not in ADMIN_OWNER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires owner or admin privileges"
        )
    return payload

def require_store_access(store_nbr: int, payload: dict):
    """Direct callable function to check store access (not a Depends factory)."""
    user_role = payload.get("role")
    user_store_nbr = payload.get("store_nbr")
    
    if user_role in ADMIN_OWNER_ROLES:
        return
        
    if user_store_nbr is not None and int(user_store_nbr) == store_nbr:
        return
        
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Akses Ditolak. Anda hanya bisa mengakses data untuk cabang (store) Anda sendiri."
    )

def get_current_user(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    from domains.identity import service
    username = payload.get("username") or payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid auth credentials")
    user = service.get_user_by_username(db, username=username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
