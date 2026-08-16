

import uuid

from pydantic import BaseModel
    
class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str | None = None

    model_config = {
        "from_attributes": True
    }