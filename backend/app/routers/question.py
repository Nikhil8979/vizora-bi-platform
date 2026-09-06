from fastapi import APIRouter, Depends
from app.dependencies import CurrentOrganization, CurrentUser, DbSession
from app.schemas.question import SaveQuestionRequest, SaveQuestionResponse
from app.services.questions.question import QuestionService
from app.utils.responses import api_success
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
