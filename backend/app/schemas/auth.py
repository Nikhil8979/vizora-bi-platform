from pydantic import BaseModel,EmailStr,Field,model_validator

from app.schemas.organization import OrganizationResponse
from .user import UserResponse
class LoginRequest(BaseModel):
    email:EmailStr
    password:str = Field(...,min_length=6,max_length=128)

class RegisterRequest(BaseModel):
    full_name:str = Field(...,min_length=2,max_length=80,description="User full name")
    email:EmailStr
    password:str = Field(...,min_length=6,max_length=64)
    confirm_password:str = Field(...,min_length=6,max_length=64)
    organization_name: str = Field(min_length=2, max_length=255)
    @model_validator(mode="after")
    def password_match(self):
        if(self.password != self.confirm_password):
            raise ValueError("password and confirm password do not match")
        return self
    

class RegisterResponse(BaseModel):    
    user: UserResponse
    organization:OrganizationResponse
    role:str = Field(...,min_length=2,max_length=50,description="User role in the organization")
    access_token:str
    token_type:str
    model_config = {"from_attributes": True}
    
class LoginResponse(BaseModel):    
    user: UserResponse
    organizations:list[OrganizationResponse]
    access_token:str
    token_type:str
    model_config = {"from_attributes": True}    
    


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id:int
    email:str
    name:str

class CurrentUser(BaseModel):
    id:int
    email:str
    name:str    
    model_config = {"from_attributes": True}