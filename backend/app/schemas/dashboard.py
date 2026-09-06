
import uuid

from pydantic import BaseModel, ConfigDict

from typing import Optional
class CreateDashboardRequest(BaseModel):
    name: str
    description: Optional[str] = None

class DashboardResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    organization_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class UpdateDashboardRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

    