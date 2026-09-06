from typing import Annotated

from fastapi import APIRouter, Depends
from uuid import UUID
from app.dependencies import CurrentOrganization, CurrentUser, DbSession
from fastapi import HTTPException
from app.schemas.question import SaveQuestionRequest, SaveQuestionResponse, QuestionResponse, QuestionExecutionResponse
from app.services.questions.question import QuestionService
from app.utils.responses import api_success
from app.core.pagination import PaginationParams, pagination_params
router = APIRouter(prefix="/question", tags=["Saved Questions"])

def get_question_service(db: DbSession) -> QuestionService:
    return QuestionService(db=db)

@router.post("/{organization_id}")
async def save_question(
    request: SaveQuestionRequest,
    current_organization: CurrentOrganization,
    current_user: CurrentUser,
    question_service: QuestionService = Depends(get_question_service),
):
    saved_question = await question_service.save_question(request=request, organization_id=current_organization.id, created_by=current_user.id)
    return api_success(
        data=SaveQuestionResponse.model_validate(saved_question),
        message="Question saved successfully",
        code=200,
    )




@router.get("/{organization_id}/list")
async def list_questions(
    current_organization: CurrentOrganization,  
    pagination: Annotated[PaginationParams, Depends(pagination_params)],
    question_service: QuestionService = Depends(get_question_service),
):
    questions = await question_service.list_questions(organization_id=current_organization.id, limit=pagination.limit, page=pagination.page)
    return api_success(
        data=[QuestionResponse.model_validate(question) for question in questions],
        message="Questions retrieved successfully",
        code=200,
    )

@router.get("/{organization_id}/{question_id}")
async def get_question(
    current_organization: CurrentOrganization,
    question_id: UUID,
    question_service: QuestionService = Depends(get_question_service),
):
    question = await question_service.get_question_by_id(question_id=question_id, organization_id=current_organization.id)
    return api_success(
        data=QuestionResponse.model_validate(question),
        message="Question retrieved successfully",
        code=200,
    )


@router.patch("/{organization_id}/{question_id}")
async def update_question(
    request: SaveQuestionRequest,
    current_organization: CurrentOrganization,
    current_user: CurrentUser,
    question_id: UUID,
    question_service: QuestionService = Depends(get_question_service),
):
    updated_question = await question_service.update_question(request=request, organization_id=current_organization.id, question_id=question_id, updated_by=current_user.id)
    return api_success(
        data=SaveQuestionResponse.model_validate(updated_question),
        message="Question updated successfully",
        code=200,
    )

@router.delete("/{organization_id}/{question_id}")
async def delete_question(
    current_organization: CurrentOrganization,
    question_id: UUID,
    question_service: QuestionService = Depends(get_question_service),
):
    await question_service.delete_question(question_id=question_id, organization_id=current_organization.id)
    return api_success(
        data=None,
        message="Question deleted successfully",
        code=200,
    )

@router.get("/{organization_id}/{question_id}/execute")
async def execute_question(
    current_organization: CurrentOrganization,
    question_id: UUID,
    question_service: QuestionService = Depends(get_question_service),
):
    result = await question_service.execute_question(question_id=question_id, organization_id=current_organization.id)
    print(f"Execution result: {result}")
    return api_success(
        data=QuestionExecutionResponse.model_validate(result),
        message="Question executed successfully",
        code=200,
    )