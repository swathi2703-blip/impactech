from pydantic import BaseModel, EmailStr, Field, model_validator


class OtpRequest(BaseModel):
    email: EmailStr | None = None
    emails: list[EmailStr] = Field(default_factory=list)
    code: str = Field(pattern=r"^\d{6}$")
    repo: str
    username: str
    purpose: str

    @model_validator(mode="after")
    def validate_recipients(self):
        if not self.email and not self.emails:
            raise ValueError("Either email or emails must be provided")
        return self


class MentorRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=6000)
    code: str | None = Field(default=None, max_length=12000)


class VerificationLinkSendRequest(BaseModel):
    email: EmailStr | None = None
    emails: list[EmailStr] = Field(default_factory=list)
    repo: str
    username: str
    purpose: str
    frontendBaseUrl: str | None = None

    @model_validator(mode="after")
    def validate_recipients(self):
        if not self.email and not self.emails:
            raise ValueError("Either email or emails must be provided")
        return self


class VerificationLinkConfirmRequest(BaseModel):
    token: str = Field(min_length=10, max_length=512)
