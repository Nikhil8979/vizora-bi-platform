from fastapi import APIRouter, Depends
from typing import Annotated

from app.dependencies import CurrentOrganization, DbSession
from app.query_engine.defination.query import QueryDefinition
from app.query_engine.defination.builder import QueryDefinitionBuilder
from app.query_engine.service.query_service import QueryService

router = APIRouter(prefix="/query-engine", tags=["Query Engine"])


def get_query_service(db: DbSession) -> QueryService:
    return QueryService(
        db=db,
        query_definition_builder=QueryDefinitionBuilder(),
    )


QueryServiceDeps = Annotated[QueryService, Depends(get_query_service)]


@router.post("/queries/execute", status_code=200)
async def execute_query(
    query_definition: QueryDefinition,
    current_organization: CurrentOrganization,
    query_service: QueryServiceDeps,
):
    result = await query_service.execute(
        query_definition=query_definition,
        organization_id=current_organization.id,
    )
    return {
        "columns": result.columns,
        "rows": result.rows,
        "row_count": result.row_count,
    }