import time
from fastapi import FastAPI,status,HTTPException,Request
from app.routers import auth

app = FastAPI(title="Vizora BI Platform API")



# @app.exception_handler(HTTPException)
# async def http_exception_handler(request: Request, exc: HTTPException):
#     return api_error(
#         message=str(exc.detail),
#         code=exc.status_code,
#         errors=[{"field": None, "message": str(exc.detail)}],
#     )


# @app.exception_handler(RequestValidationError)
# async def validation_exception_handler(request: Request, exc: RequestValidationError):
#     formatted = []

#     for err in exc.errors():
#         loc_items = [str(x) for x in err.get("loc", [])]

#         if loc_items and loc_items[0] in {"body", "query", "path"}:
#             loc_items = loc_items[1:]

#         field = ".".join(loc_items) if loc_items else None
#         msg = err.get("msg", "Invalid input")

#         formatted.append({"field": field, "message": msg})

#     return api_error(
#         message="Validation failed",
#         code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#         errors=formatted,
#     )

# @app.exception_handler(IntegrityError)
# async def integrity_exception_handler(request: Request, exc: IntegrityError):
#     # handles DB unique constraint etc.
#     return api_error(
#         message="Database integrity error",
#         code=status.HTTP_409_CONFLICT,
#         errors=[{"field": None, "message": "Resource already exists or violates constraint"}],
#     )


# @app.exception_handler(Exception)
# async def unhandled_exception_handler(request: Request, exc: Exception):
#     # fallback for unexpected errors
#     return api_error(
#         message="Internal server error",
#         code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#         errors=[{"field": None, "message": str(exc)}],
#     )
    
@app.middleware("http")
async def add_proccess_time_header(request:Request,call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

app.include_router(auth.router,prefix="/api/v1")


@app.get("/")
async def root():
    return {"message":"Hello World"}