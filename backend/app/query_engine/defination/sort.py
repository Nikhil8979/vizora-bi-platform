from pydantic import BaseModel, Field
from enum import StrEnum

class SortDirection(StrEnum):
    ASC = "ASC"
    DESC = "DESC"
    
class SortDefinition(BaseModel):
    field: str = Field(min_length=1, description="The name of the field to be used for sorting.")
    direction: SortDirection = SortDirection.ASC