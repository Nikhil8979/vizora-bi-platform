from typing import TypeVar
from fastapi.responses import JSONResponse
from app.schemas.common import ApiResponse
from fastapi.encoders import jsonable_encoder

T = TypeVar("T")

def api_success(data: T, message: str = "Success", code: int = 200) -> JSONResponse:
    payload = ApiResponse[T](success=True, message=message, data=data) 
    return JSONResponse(status_code=code, content=jsonable_encoder(payload))


def api_error(message: str, errors=None, code: int = 400):
    return JSONResponse(
        status_code=code,
        content={
            "success": False,
            "message": message,
            "data": None,
            "errors": errors or []
        },
    )