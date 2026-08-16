from sqlalchemy.ext.asyncio import AsyncSession
from app.database.deps import get_db
from app.core.security import get_current_organization, get_current_user_from_token
from app.schemas.auth import TokenData
from typing import Annotated
from fastapi import Depends

from app.models.organizations import Organization
DbSession = Annotated[AsyncSession,Depends(get_db)]
CurrentUser = Annotated[TokenData,Depends(get_current_user_from_token)]
CurrentOrganization = Annotated[
    Organization,
    Depends(get_current_organization)
]