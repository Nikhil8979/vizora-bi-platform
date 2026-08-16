from sqlalchemy.ext.asyncio import AsyncSession
from app.database.deps import get_db
from app.core.security import get_current_user
from app.schemas.auth import TokenData
from typing import Annotated
from fastapi import Depends
DbSession = Annotated[AsyncSession,Depends(get_db)]
CurrentUser = Annotated[TokenData,Depends(get_current_user)]