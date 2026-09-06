# app/schemas/question.py

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field
from app.query_engine.defination.query import QueryDefinition


class VisualizationConfig(BaseModel):
    type: str
    settings: dict[str, Any] = Field(default_factory=dict)


class SaveQuestionRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)

    query_definition: QueryDefinition

    visualization: VisualizationConfig



class SaveQuestionResponse(BaseModel):
    id: UUID
    organization_id: UUID
    data_source_id: UUID
    title: str
    description: str | None
    query_definition: QueryDefinition
    visualization: VisualizationConfig
    created_by: int

    model_config = {
        "from_attributes": True
    }

class QuestionResponse(BaseModel):
    id: UUID
    organization_id: UUID
    data_source_id: UUID
    title: str
    description: str | None
    query_definition: QueryDefinition
    visualization: VisualizationConfig
    created_by: int

    model_config = {
        "from_attributes": True
    }

class QuestionExecutionResponse(BaseModel):
    columns: tuple[str, ...]
    rows: tuple[dict[str, Any], ...]
    row_count: int

    model_config = {
        "from_attributes": True
    }