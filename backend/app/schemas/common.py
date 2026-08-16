from pydantic.generics import GenericModel
from typing import TypeVar,Generic,Optional,Any
from fastapi.responses import JSONResponse

T = TypeVar("T")

    
class ApiResponse(GenericModel,Generic[T]):
    success:bool
    message:str
    data:Optional[T] = None