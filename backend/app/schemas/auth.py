from pydantic import BaseModel,EmailStr,Field,model_validator
class LoginRequest(BaseModel):
    email:EmailStr
    password:str = Field(...,min_length=6,max_length=128)

class RegisterRequest(BaseModel):
    full_name:str = Field(...,min_length=2,max_length=80,description="User full name")
    email:EmailStr
    password:str = Field(...,min_length=6,max_length=64)
    confirm_password:str = Field(...,min_length=6,max_length=64)
    @model_validator(mode="after")
    def password_match(self):
        if(self.password != self.confirm_password):
            raise ValueError("password and confirm password do not match")
        return self
    

class RegisterResponse(BaseModel):    
    id:int
    name:str = Field(...,min_length=2,max_length=80,description="User full name")
    email:EmailStr
    model_config = {"from_attributes": True}
    
class LoginResponse(BaseModel):    
    id:int
    name:str = Field(...,min_length=2,max_length=80,description="User full name")
    email:EmailStr
    token:str
    model_config = {"from_attributes": True}    
    


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id:int
    email:str
    name:str