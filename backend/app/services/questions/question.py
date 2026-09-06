import uuid

from app.core.pagination import  DEFAULT_PAGE_SIZE
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.question.question import QuestionRepository
from app.repositories.datasources.data_source import DataSourceRepository
from app.schemas.question import SaveQuestionRequest, VisualizationConfig
from app.models.question import Question
from app.query_engine.defination.builder import QueryDefinitionBuilder
from app.query_engine.defination.query import QueryDefinition
from app.query_engine.query_builder import QueryBuilder
from app.services.datasources.secret_service import SecretService
from app.core.pagination import get_pagination
from fastapi import HTTPException
class QuestionService:
    def __init__(self,db:AsyncSession):
        self.question_repository = QuestionRepository(db=db)
        self.data_source_repository = DataSourceRepository(db=db)
        self.query_definition_builder = QueryDefinitionBuilder()
        self.secret_service = SecretService()

    async def save_question(self, request: SaveQuestionRequest, organization_id:uuid.UUID, created_by:int):
        data_source = await self.data_source_repository.get_by_id(organization_id=organization_id, data_source_id=request.query_definition.data_source_id)
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

        visualization_errors = engine.visualization_validator.validate(
            visualization=request.visualization,
            query=query,
        )
        if visualization_errors:
            print(f"Visualization validation errors: {visualization_errors}")
            raise HTTPException(status_code=400, detail=[str(error) for error in visualization_errors])
        
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


    async def get_question_by_id(self, question_id:uuid.UUID, organization_id:uuid.UUID):
        question = await self.question_repository.get_question_by_id(question_id=question_id)
        if not question or question.organization_id != organization_id:
            raise HTTPException(status_code=404, detail="Question not found or does not belong to the organization")
        return question

    async def list_questions(self, organization_id:uuid.UUID, limit:int=DEFAULT_PAGE_SIZE, page:int=1):
        normalized_limit, normalized_offset = get_pagination(limit=limit, page=page)
        return await self.question_repository.list_questions(organization_id=organization_id, limit=normalized_limit, offset=normalized_offset)

    async def delete_question(self, question_id:uuid.UUID, organization_id:uuid.UUID):
        question = await self.question_repository.get_question_by_id(question_id=question_id)
        if not question or question.organization_id != organization_id:
            raise HTTPException(status_code=404, detail="Question not found or does not belong to the organization")
        return await self.question_repository.delete_question(question_id=question_id)

    async def update_question(self, request: SaveQuestionRequest, organization_id:uuid.UUID, question_id:uuid.UUID, updated_by:int):
        question = await self.question_repository.get_question_by_id(question_id=question_id)
        if not question or question.organization_id != organization_id:
            raise HTTPException(status_code=404, detail="Question not found or does not belong to the organization")

        data_source = await self.data_source_repository.get_by_id(organization_id=organization_id, data_source_id=request.query_definition.data_source_id)
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

        visualization_errors = engine.visualization_validator.validate(
            visualization=request.visualization,
            query=query,
        )
        if visualization_errors:
            print(f"Visualization validation errors: {visualization_errors}")
            raise HTTPException(status_code=400, detail=[str(error) for error in visualization_errors])
        
        question.title = request.title
        question.description = request.description
        question.query_definition = request.query_definition.model_dump(mode="json")
        question.visualization = request.visualization.model_dump(mode="json")
        question.updated_by = updated_by
        return await self.question_repository.update_question(question=question)


    async def execute_question(self, question_id:uuid.UUID, organization_id:uuid.UUID):
        question = await self.question_repository.get_question_by_id(question_id=question_id)
        if not question or question.organization_id != organization_id:
            raise HTTPException(status_code=404, detail="Question not found or does not belong to the organization")

        data_source = await self.data_source_repository.get_by_id(organization_id=organization_id, data_source_id=question.data_source_id)
        if not data_source or data_source.organization_id != organization_id:
            raise HTTPException(status_code=400, detail="Data source does not exist or does not belong to the organization")

        query_definition = QueryDefinition.model_validate(question.query_definition)
        visualization = VisualizationConfig.model_validate(question.visualization)
        query = self.query_definition_builder.build(query_definition)

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

        visualization_errors = engine.visualization_validator.validate(
            visualization=visualization,
            query=query,
        )
        if visualization_errors:
            print(f"Visualization validation errors: {visualization_errors}")
            raise HTTPException(status_code=400, detail=[str(error) for error in visualization_errors])

        sql = engine.compiler.compile(query)
        result = await engine.executor.execute(sql=sql)
        normalized_result = engine.normalizer.normalize(result)
        return normalized_result