from pydantic import BaseModel
from typing import Optional, List
import datetime


class ChatInput(BaseModel):
    user_message: str
    session_id: Optional[str] = None
    language: str = "en"

class ChatResponse(BaseModel):
    bot_response: str
    status: str = "success"
    session_id: str

class SessionHistoryItem(BaseModel):
    user_message: str
    bot_response: str
    timestamp: datetime.datetime
    language: str

class SessionInfo(BaseModel):
    session_id: str
    label: str
    created: datetime.datetime
    history: Optional[List[SessionHistoryItem]] = None

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str