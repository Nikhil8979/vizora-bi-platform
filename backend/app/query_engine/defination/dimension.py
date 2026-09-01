from pydantic import BaseModel, Field

class DimensionDefinition(BaseModel):
    column: str = Field(..., min_length=1, description="The name of the column to be used as a dimension.")
    alias: str | None = None