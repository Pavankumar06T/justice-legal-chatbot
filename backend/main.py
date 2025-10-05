#---fastAPI imports---#
from fastapi import FastAPI, HTTPException, Depends, status # <-- ADDED status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm # <-- ADDED OAuth2PasswordRequestForm
from pydantic import BaseModel # <-- ADDED BaseModel

#---Env---#
import os
from dotenv import load_dotenv
#---Other imports---#
import logging
import uuid
from typing import List
#---translation import---#
from deep_translator import GoogleTranslator
#---database imports---#

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError # <-- ADDED IntegrityError
from sqlalchemy.ext.declarative import declarative_base
#--security--#
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta ,timezone
from typing import Optional

# --- Configuration --- #
SECRET_KEY = "PIGGYNNBACK20mins-AxTaHzX"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

load_dotenv()
# ---- RAG Setup ---- #

from RAG import RAG


# ---- Database Setup ---- #

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base


DATABASE_URL = "sqlite+aiosqlite:///./backend.db"
engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    user_message = Column(String)
    bot_response = Column(String)
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))
    language = Column(String, default="en")

class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, index=True)
    
    username = Column(String, unique=True, index=True) # Ensure username is unique
    password = Column(String) # This will store the hashed password

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# ---- Pydantic Models ---- #

from pydanticmodel import ChatInput, ChatResponse, SessionHistoryItem, SessionInfo, UserCreate,Token

# ---- FastAPI Setup ---- #
app = FastAPI(title="Justice Department AI Chatbot", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Startup Event ---- #
@app.on_event("startup")
async def on_startup():
    # This assumes User and ChatHistory models are imported and Base knows about them
    # from .database import Base as DBBase # Make sure Base has all models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ---- Security & Password Hashing ---- #

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

#---auth checking ---#
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user_query = await db.execute(text("SELECT id, username FROM user WHERE username = :username"), {"username": username})
    user = user_query.fetchone()

    if user is None:
        raise credentials_exception
    return user

# ---- API Endpoints ---- #
@app.get("/")
async def root():
    return {"message": "Justice Department AI Chatbot Backend", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    input_data: ChatInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
   
    if input_data.user_message.strip() == "/new_chat":
        session_id = str(uuid.uuid4())
        chat_entry = ChatHistory(
            session_id=session_id,
            user_id=current_user.id, # <-- ASSOCIATE WITH USER
            user_message="",
            bot_response="",
            language=input_data.language or "en",
        )
        db.add(chat_entry)
        await db.commit()
        return ChatResponse(bot_response="New chat session created", session_id=session_id)

    
    session_id = input_data.session_id or str(uuid.uuid4())
    user_message = input_data.user_message
    language = input_data.language or "en"
    response_text = RAG(user_message)
    original_response = response_text
    if language != "en":
        try:
            response_text = GoogleTranslator(source="auto", target=language).translate(response_text)
        except Exception as e:
            logging.error(f"Translation error: {e}")
            response_text = original_response
            language = "en"
    chat_entry = ChatHistory(
        session_id=session_id,
        user_id=current_user.id,
        user_message=user_message,
        bot_response=original_response,
        language=language,
    )
    db.add(chat_entry)
    await db.commit()
    return ChatResponse(bot_response=response_text, session_id=session_id)

@app.get("/sessions/{session_id}/history", response_model=SessionInfo)
async def get_session_history(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    
    session_query = await db.execute(
        text("SELECT user_message, timestamp FROM chat_history WHERE session_id = :sid AND user_id = :uid AND user_message != '' ORDER BY timestamp ASC LIMIT 1"),
        {"sid": session_id, "uid": current_user.id},
    )
    session_data = session_query.fetchone()

    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found or you do not have access")

    
    history_query = await db.execute(
        text("SELECT user_message, bot_response, timestamp, language FROM chat_history WHERE session_id = :sid AND user_id = :uid AND user_message != '' ORDER BY timestamp ASC"),
        {"sid": session_id, "uid": current_user.id},
    )
    history_data = history_query.fetchall()
    history = [SessionHistoryItem(user_message=row[0], bot_response=row[1], timestamp=row[2], language=row[3]) for row in history_data]
    return SessionInfo(
        session_id=session_id,
        label=session_data[0][:50] + "..." if len(session_data[0]) > 50 else session_data[0],
        created=session_data[1],
        history=history,
    )

@app.get("/sessions", response_model=List[SessionInfo])
async def get_all_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    
    sessions_query = await db.execute(
        text("SELECT session_id, user_message, MIN(timestamp) as created FROM chat_history WHERE user_id = :uid AND user_message != '' GROUP BY session_id ORDER BY created DESC"),
        {"uid": current_user.id}
    )
    sessions_data = sessions_query.fetchall()
    sessions = [
        SessionInfo(session_id=row[0], label=row[1][:50] + "..." if len(row[1]) > 50 else row[1], created=row[2], history=None)
        for row in sessions_data
    ]
    return sessions

@app.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # <-- PROTECT THE ENDPOINT
):
    # <-- UPDATED QUERY to only delete if user_id matches -->
    result = await db.execute(
        text("DELETE FROM chat_history WHERE session_id = :sid AND user_id = :uid"),
        {"sid": session_id, "uid": current_user.id}
    )
    await db.commit()

    # <-- ADDED check to see if anything was deleted -->
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Session not found or you do not have access")
    return {"status": "success", "message": "Session deleted"}

#--- for auth(now working) ---#

@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    hashed_password = get_password_hash(user_data.password)
    new_user = User(username=user_data.username, password=hashed_password)
    db.add(new_user)
    try:
        await db.commit()
        return {"message": f"User {user_data.username} created successfully."}
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Username already registered")

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user_query = await db.execute(
        text("SELECT id, username, password FROM user WHERE username = :username"),
        {"username": form_data.username}
    )
    user = user_query.fetchone()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "id": user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

#--uvicorn--#
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)