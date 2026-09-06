import uuid

from fastapi import HTTPException
from sqlalchemy import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.question.question import QuestionRepository
from app.repositories.datasources.data_source import DataSourceRepository
from app.schemas.question import SaveQuestionRequest
from app.models.question import Question
from app.query_engine.defination.builder import QueryDefinitionBuilder
from app.query_engine.query_builder import QueryBuilder
from app.services.datasources.secret_service import SecretService


class QuestionService:
    def __init__(self,db:AsyncSession):
        self.question_repository = QuestionRepository(db=db)
        self.data_source_repository = DataSourceRepository(db=db)
        self.query_definition_builder = QueryDefinitionBuilder()
        self.secret_service = SecretService()

    async def save_question(self, request: SaveQuestionRequest, organization_id:uuid.UUID, created_by:int):
        data_source = await self.data_source_repository.get_data_source_by_id(request.query_definition.data_source_id)
        if not data_source or data_source.organization_id != organization_id:
            raise HTTPException(status_code=400, detail="Data source does not exist or does not belong to the organization")

        query = self.query_definition_builder.build(request.query_definition)
        try:
            credentials = self.secret_service.get_secret(data_source.credential_secret_id)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=(
                    "Failed to read credentials from Secret Manager for "
                    f"{data_source.credential_secret_id}: {exc}"
                ),
            ) from exc

        if not isinstance(credentials, dict) or not credentials:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Data source credentials are empty or invalid. "
                    f"Secret: {data_source.credential_secret_id}"
                ),
            )

        try:
            engine = QueryBuilder.build(data_source=data_source, credentials=credentials)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data source credentials or configuration: {exc}",
            ) from exc

        validation_context = await engine.build_validation_context(
            query=query,
            data_source=data_source,
        )

        errors = engine.validator.validate(
            query,
            validation_context,
        )
        if errors:
            raise HTTPException(status_code=400, detail=[str(error) for error in errors])
        
        data = Question(
            id=uuid.uuid4(),
            data_source_id=request.query_definition.data_source_id,
            organization_id=organization_id,
            title=request.title,
            description=request.description,
            query_definition=request.query_definition.model_dump(mode="json"),
            visualization=request.visualization.model_dump(mode="json"),
            created_by=created_by
        )
        return await self.question_repository.create_question(data=data)