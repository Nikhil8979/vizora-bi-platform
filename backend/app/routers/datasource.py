from fastapi import APIRouter, Depends
from app.schemas.data_source import CollectionResponse, CreateDataSourceRequest, CreateDataSourceResponse, DataSourceResponse, FieldResponse, NamespaceResponse
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

@router.get("/{organization_id}/{data_source_id}/")
async def get_data_source_by_id(current_organization:CurrentOrganization,service:DataSourceServiceDeps, data_source_id:UUID):
    data_source = await service.get_data_source_by_id(organization_id=current_organization.id, data_source_id=data_source_id)
    return api_success(data=DataSourceResponse.model_validate(data_source), message="Data source retrieved successfully", code=200)

@router.delete("/{organization_id}/{data_source_id}/")
async def delete_data_source(current_organization:CurrentOrganization,service:DataSourceServiceDeps, data_source_id:UUID):
    await service.delete_data_source(organization_id=current_organization.id, data_source_id=data_source_id)
    return api_success(data=None, message="Data source deleted successfully", code=200)

@router.post("/{organization_id}/{data_source_id}/test-connection/")
async def test_data_source_connection(current_organization:CurrentOrganization,service:DataSourceServiceDeps, data_source_id:UUID):
    result = await service.test_data_source_connection(organization_id=current_organization.id, data_source_id=data_source_id)
    return api_success(data=result, message="Data source connection tested successfully", code=200)

@router.get("/{organization_id}/{data_source_id}/namespaces/")
async def get_data_source_namespaces(current_organization:CurrentOrganization,service:DataSourceServiceDeps, data_source_id:UUID):
    namespaces = await service.get_data_source_namespaces(organization_id=current_organization.id, data_source_id=data_source_id)
    return api_success(data=[NamespaceResponse.model_validate(namespace) for namespace in namespaces], message="Data source namespaces retrieved successfully", code=200)

@router.get("/{organization_id}/{data_source_id}/namespaces/{namespace_name}/collections/")
async def get_data_source_collections(current_organization:CurrentOrganization,service:DataSourceServiceDeps, data_source_id:UUID, namespace_name:str):
    collections = await service.get_data_source_collections(organization_id=current_organization.id, data_source_id=data_source_id, namespace_name=namespace_name)
    return api_success(data=[CollectionResponse.model_validate(collection) for collection in collections], message="Data source collections retrieved successfully", code=200)

@router.get("/{organization_id}/{data_source_id}/namespaces/{namespace_name}/collections/{collection_name}/fields/")
async def get_data_source_fields(current_organization:CurrentOrganization,service:DataSourceServiceDeps, data_source_id:UUID, namespace_name:str, collection_name:str):
    fields = await service.get_data_source_fields(organization_id=current_organization.id, data_source_id=data_source_id, namespace_name=namespace_name, collection_name=collection_name)
    return api_success(data=[FieldResponse.model_validate(field) for field in fields], message="Data source fields retrieved successfully", code=200)