from fastapi import APIRouter, Depends
from app.schemas.data_source import CreateDataSourceRequest, CreateDataSourceResponse, DataSourceResponse
from app.dependencies import CurrentOrganization,CurrentUser, DbSession
from uuid import UUID
from typing import Annotated
from app.services.datasources.data_source_service import DataSourceService
from app.utils.responses import api_success
router = APIRouter(prefix="/datasources", tags=["Data Sources"])

def get_data_source_service(db: DbSession) -> DataSourceService:
    return DataSourceService(db=db)     
DataSourceServiceDeps = Annotated[DataSourceService, Depends(get_data_source_service)]
@router.post("/{organization_id}/")
async def create_data_source(request:CreateDataSourceRequest,current_organization:CurrentOrganization,current_user:CurrentUser,service:DataSourceServiceDeps):
    data_source = await service.create_data_source(data_source=request, organization_id=current_organization.id, user_id=current_user.id)
    return api_success(data=CreateDataSourceResponse.model_validate(data_source), message="Data source created successfully", code=200)

@router.get("/{organization_id}/")
async def get_data_sources(current_organization:CurrentOrganization,service:DataSourceServiceDeps):
    data_sources = await service.get_data_sources(organization_id=current_organization.id)
    return api_success(data=[DataSourceResponse.model_validate(ds) for ds in data_sources], message="Data sources retrieved successfully", code=200)

@router.delete("/{organization_id}/{data_source_id}/")
async def delete_data_source(current_organization:CurrentOrganization,service:DataSourceServiceDeps, data_source_id:int):
    await service.delete_data_source(organization_id=current_organization.id, data_source_id=data_source_id)
    return api_success(data=None, message="Data source deleted successfully", code=200)

@router.post("/{organization_id}/{data_source_id}/test-connection/")
async def test_data_source_connection(current_organization:CurrentOrganization,service:DataSourceServiceDeps, data_source_id:UUID):
    result = await service.test_data_source_connection(organization_id=current_organization.id, data_source_id=data_source_id)
    return api_success(data=result, message="Data source connection tested successfully", code=200)

@router.get("/{organization_id}/{data_source_id}/schema/")
async def get_data_source_schema(current_organization:CurrentOrganization,service:DataSourceServiceDeps, data_source_id:UUID):
    schema = await service.get_data_source_schema(organization_id=current_organization.id, data_source_id=data_source_id)
    return api_success(data=schema, message="Data source schema retrieved successfully", code=200)

@router.get("/{organization_id}/{data_source_id}/tables/{schema_name}/")
async def get_data_source_tables(current_organization:CurrentOrganization,service:DataSourceServiceDeps, data_source_id:UUID, schema_name:str):
    tables = await service.get_data_source_tables(organization_id=current_organization.id, data_source_id=data_source_id, schema_name=schema_name)
    return api_success(data=tables, message="Data source tables retrieved successfully", code=200)
@router.get("/{organization_id}/{data_source_id}/tables/{schema_name}/{table_name}/columns/")
async def get_data_source_table_columns(current_organization:CurrentOrganization,service:DataSourceServiceDeps, data_source_id:UUID, schema_name:str, table_name:str):
    columns = await service.get_data_source_table_columns(organization_id=current_organization.id, data_source_id=data_source_id, schema_name=schema_name, table_name=table_name)
    return api_success(data=columns, message="Data source table columns retrieved successfully", code=200)