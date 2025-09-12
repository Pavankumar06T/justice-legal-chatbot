from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from langchain.chat_models import init_chat_model
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv
import logging
import asyncio
import os
import uuid
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String, DateTime, text
from sqlalchemy.ext.declarative import declarative_base
import datetime
from typing import List, Optional
from deep_translator import GoogleTranslator

load_dotenv()

# DB setup async with SQLite
DATABASE_URL = "sqlite+aiosqlite:///./backend.db"
engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)
Base = declarative_base()


class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    user_message = Column(String)
    bot_response = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    language = Column(String, default='en')  # Store language for each message


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


#---- RAG constants ----#
PERSIST_DIR = "C:/Users/GunaPawan/Downloads/Justice_Chatbot/chroma_store"

#--- Initialize LLM and embeddings (keep synchronous if needed) ---#
llm = init_chat_model("gemini-2.5-flash", model_provider="google_genai")
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

# Initialize vector DB (blocking here, move to async if supported)
if Path(PERSIST_DIR).exists() and any(Path(PERSIST_DIR).iterdir()):
    vectordb = Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings)
else:
    raise RuntimeError(f"Vector DB persist directory '{PERSIST_DIR}' missing or empty.")

retriever = vectordb.as_retriever(k=10)


#---- Helper Functions ----#
def build_context(snippets):
    return "\n\n---\n\n".join(snippets)


def ask_gemini(question, top_docs):
    context = build_context(top_docs)
    prompt = f"""You are an AI assistant for a Justice Department chatbot.
Use the context below to answer the question.
Do NOT mention the context.

Context:
{context}

Question:
{question}
"""
    resp = llm.invoke(prompt)
    return resp.content


async def RAG(q: str):
    try:
        qr_prompt = f"Rewrite the following question into a retrieval query ONLY GIVE THE SENTENCE:\n{q}"
        qr = llm.invoke(qr_prompt).content
    except Exception as e:
        logging.error(f"Error calling Gemini query rewrite: {e}")
        return None

    try:
        results = retriever.get_relevant_documents(qr)
        snippets = [d.page_content for d in results]
    except Exception as e:
        logging.error(f"Error retrieving documents: {e}")
        return None

    try:
        ans = ask_gemini(q, snippets)
        return ans
    except Exception as e:
        logging.error(f"Error calling Gemini answer generation: {e}")
        return None


#---- FastAPI setup ----#
app = FastAPI(title="Justice Department AI Chatbot", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # adjust to frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#---- Request/Response models ----#
class ChatInput(BaseModel):
    user_message: str
    session_id: str = None  # Optional session ID
    language: str = 'en'    # Language code


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


#----- Startup event to create tables -----#
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


#----- API Endpoints -----#
@app.get("/")
async def root():
    return {
        "message": "Justice Department AI Chatbot Backend",
        "status": "running",
        "endpoints": {"chat": "POST /chat", "docs": "/docs"},
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "justice-chatbot-backend"}


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(input_data: ChatInput, db: AsyncSession = Depends(get_db)):
    session_id = input_data.session_id or str(uuid.uuid4())  # Generate new if none provided
    user_message = input_data.user_message
    language = input_data.language or 'en'  # Default to English

    # Retrieve recent chat history for context (last 5 messages)
    history_query = await db.execute(
        text(
            "SELECT user_message, bot_response FROM chat_history "
            "WHERE session_id = :sid ORDER BY timestamp DESC LIMIT 5"
        ),
        {"sid": session_id},
    )
    rows = history_query.fetchall()
    # Reverse for chronological order
    history = rows[::-1] if rows else []

    # For simplicity just send user message to RAG for now
    response_text = await RAG(user_message)

    if response_text is None:
        raise HTTPException(status_code=500, detail="Failed to generate response")

    # Translate response if needed
    original_response = response_text
    if language != 'en':
        try:
            response_text = GoogleTranslator(source='auto', target=language).translate(response_text)
        except Exception as e:
            logging.error(f"Translation error: {e}")
            # Fall back to English if translation fails
            response_text = original_response
            language = 'en'

    # Store chat in DB
    chat_entry = ChatHistory(
        session_id=session_id,
        user_message=user_message,
        bot_response=original_response,  # Store original English version in DB
        language=language
    )
    db.add(chat_entry)
    await db.commit()

    return ChatResponse(bot_response=response_text, session_id=session_id)


@app.get("/sessions/{session_id}/history", response_model=SessionInfo)
async def get_session_history(session_id: str, db: AsyncSession = Depends(get_db)):
    # Get session metadata (first message as label and creation time)
    session_query = await db.execute(
        text(
            "SELECT user_message, timestamp, language FROM chat_history "
            "WHERE session_id = :sid ORDER BY timestamp ASC LIMIT 1"
        ),
        {"sid": session_id},
    )
    session_data = session_query.fetchone()
    
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all messages in the session
    history_query = await db.execute(
        text(
            "SELECT user_message, bot_response, timestamp, language FROM chat_history "
            "WHERE session_id = :sid ORDER BY timestamp ASC"
        ),
        {"sid": session_id},
    )
    history_data = history_query.fetchall()
    
    history = [
        SessionHistoryItem(
            user_message=row[0],
            bot_response=row[1],
            timestamp=row[2],
            language=row[3]
        ) for row in history_data
    ]
    
    return SessionInfo(
        session_id=session_id,
        label=session_data[0][:50] + "..." if len(session_data[0]) > 50 else session_data[0],
        created=session_data[1],
        history=history
    )


@app.get("/sessions", response_model=List[SessionInfo])
async def get_all_sessions(db: AsyncSession = Depends(get_db)):
    # Get unique session IDs with their first message and creation time
    sessions_query = await db.execute(
        text(
            "SELECT session_id, user_message, MIN(timestamp) as created "
            "FROM chat_history GROUP BY session_id ORDER BY created DESC"
        )
    )
    sessions_data = sessions_query.fetchall()
    
    sessions = []
    for row in sessions_data:
        sessions.append(
            SessionInfo(
                session_id=row[0],
                label=row[1][:50] + "..." if len(row[1]) > 50 else row[1],
                created=row[2],
                history=None  # Don't include full history in list view
            )
        )
    
    return sessions


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(
        text("DELETE FROM chat_history WHERE session_id = :sid"),
        {"sid": session_id},
    )
    await db.commit()
    return {"status": "success", "message": "Session deleted"}