from datetime import datetime
from enum import Enum

from uuid import UUID
from pydantic import BaseModel, ConfigDict,EmailStr

from app.schemas.user import UserResponse

class OrganizationRole(str, Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"

class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: OrganizationRole


class InviteMemberResponse(BaseModel):
    id: UUID
    organization_id: UUID
    user_id: int
    model_config = ConfigDict(from_attributes=True)

class OrganizationMemberResponse(BaseModel):
    id: UUID
    organization_id: UUID
    user_id: int
    role: OrganizationRole
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)    