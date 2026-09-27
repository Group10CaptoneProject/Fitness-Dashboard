from pydantic import BaseModel , EmailStr, Field

class RegisterUser(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr = Field(max_length=100)
    first_name: str = Field(min_length = 1, max_length=50)
    last_name: str = Field(min_length = 1, max_length=50)
    password: str = Field(min_length=6, max_length=255)

class LoginUser(BaseModel):
    email: EmailStr = Field(max_length=100)
    password: str = Field(min_length=6, max_length=255)

class ForgotPassword(BaseModel):
    email: EmailStr = Field(max_length=100)

