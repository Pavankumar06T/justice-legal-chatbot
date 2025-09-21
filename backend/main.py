from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv
import logging
import uuid
import datetime
from typing import List, Optional
from deep_translator import GoogleTranslator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String, DateTime, text
from sqlalchemy.ext.declarative import declarative_base


load_dotenv()

# ---- Database Setup ---- #
DATABASE_URL = "sqlite+aiosqlite:///./backend.db"
engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    user_message = Column(String)
    bot_response = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    language = Column(String, default="en")

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

def list_available_models(api_key):
    """List all available Gemini models"""
    try:
        genai.configure(api_key=api_key)
        print("Available Gemini models:")
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                print(f"  - {model.name}")
    except Exception as e:
        print(f"Error listing models: {e}")

# ---- LLM Import ---- #
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    print("Using langchain_google_genai import")
except ImportError:
    try:
        from langchain.chat_models import ChatGoogleGenerativeAI
        print("Using langchain.chat_models import")
    except ImportError as e:
        print(f"Error: Could not import ChatGoogleGenerativeAI: {e}")
        # Mock LLM for testing
        class MockLLM:
            def invoke(self, prompt):
                return type('obj', (object,), {
                    'content': f"This is a mock response to: {prompt[:50]}..."
                })
        ChatGoogleGenerativeAI = MockLLM

# ---- Embeddings Import ---- #
try:
    # Try the new recommended package first
    from langchain_huggingface import HuggingFaceEmbeddings
    print("Using langchain_huggingface import")
except ImportError:
    try:
        # Fall back to community version
        from langchain_community.embeddings import HuggingFaceEmbeddings
        print("Using langchain_community.embeddings import")
    except ImportError as e:
        print(f"Error: Could not import HuggingFaceEmbeddings: {e}")
        exit(1)

from langchain_chroma import Chroma

# ---- RAG Setup ---- #
PERSIST_DIR = "C:/Users/GunaPawan/Downloads/chroma_store"

# List available models first
google_api_key = os.getenv("GOOGLE_API_KEY")
if google_api_key:
    list_available_models(google_api_key)

try:
    if google_api_key:
        # Try different model names in sequence
        models_to_try = [
            "gemini-pro",  # Original name
            "gemini-1.0-pro",  # Versioned name
            "gemini-1.5-pro",  # Latest pro
            "gemini-1.5-flash",  # Faster model
            "models/gemini-pro",  # With models/ prefix
        ]
        
        llm = None
        for model_name in models_to_try:
            try:
                llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=google_api_key)
                # Test the model with a simple prompt
                test_response = llm.invoke("Hello")
                print(f"Successfully initialized Gemini model: {model_name}")
                break
            except Exception as model_error:
                print(f"Model {model_name} failed: {model_error}")
                continue
        
        if llm is None:
            raise Exception("All Gemini models failed")
            
    else:
        print("GOOGLE_API_KEY not found → Using Mock LLM")
        class MockLLM:
            def invoke(self, prompt):
                return type('obj', (object,), {
                    'content': f"This is a mock response: {prompt[:50]}..."
                })
        llm = MockLLM()
        
except Exception as e:
    print(f"Error initializing Gemini: {e}")
    print("Falling back to Mock LLM")
    class MockLLM:
        def invoke(self, prompt):
            return type('obj', (object,), {
                'content': f"Mock response due to initialization error. Please check your Google API key and model availability. Error: {str(e)[:100]}..."
            })
    llm = MockLLM()

# ---- Embeddings ---- #
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# ---- Vector DB ---- #
if Path(PERSIST_DIR).exists() and any(Path(PERSIST_DIR).iterdir()):
    try:
        vectordb = Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings)
        print("Loaded existing vector database")
    except Exception as e:
        print(f"Error loading DB: {e}")
        from langchain.docstore.document import Document
        # Create a comprehensive legal knowledge base
        legal_docs = [
            Document(page_content="The Justice Department provides legal services and ensures justice for all citizens."),
            Document(page_content="You can file a complaint online through the Justice Department portal or visit a local police station."),
            Document(page_content="Legal rights include fair representation, due process, equality before law, and access to justice."),
            Document(page_content="Human rights are basic rights and freedoms that belong to every person from birth until death."),
            Document(page_content="To file a complaint at a police station: visit the station, provide details of the incident, submit a written complaint, and get an acknowledgment receipt."),
            Document(page_content="Basic human rights include right to life, freedom from torture, freedom of expression, right to work, and right to education."),
            Document(page_content="The Justice Department handles civil rights violations, discrimination cases, and ensures equal protection under the law."),
            Document(page_content="You have the right to legal representation. If you cannot afford a lawyer, the court may appoint one for you."),
            Document(page_content="To report a crime: contact local police, provide all relevant information, preserve any evidence, and follow up on your case."),
            Document(page_content="The legal system provides remedies for violations of rights through courts, tribunals, and human rights commissions."),
            Document(page_content="Citizens have the right to information about government activities and decisions that affect them."),
            Document(page_content="The Justice Department offers legal aid services for those who cannot afford private attorneys."),
            Document(page_content="You can appeal a court decision if you believe there was an error in the judgment or procedure."),
            Document(page_content="Fundamental rights are protected by the Constitution and cannot be violated by the state without due process."),
            Document(page_content="To seek legal help: contact local legal aid clinics, bar associations, or the Justice Department's helpline."),
            Document(page_content="Human rights are universal, inalienable, indivisible, interdependent, and equal for all people."),
            Document(page_content="The police must register your complaint and provide you with a copy of the First Information Report (FIR)."),
            Document(page_content="You have the right to remain silent and not incriminate yourself during police questioning."),
            Document(page_content="Legal procedures ensure fairness in investigations, trials, and sentencing."),
            Document(page_content="The justice system includes civil courts, criminal courts, family courts, and administrative tribunals."),
            Document(page_content="You can file a Right to Information (RTI) application to access government documents and information."),
            Document(page_content="The Justice Department works to prevent human trafficking, child labor, and other forms of exploitation."),
            Document(page_content="Everyone has the right to a fair and public hearing by an independent and impartial tribunal."),
            Document(page_content="Legal aid is available for women, children, senior citizens, and economically disadvantaged individuals."),
            Document(page_content="You can file a complaint with the Human Rights Commission if your rights have been violated by government authorities."),
        ]
        vectordb = Chroma.from_documents(documents=legal_docs, embedding=embeddings, persist_directory=PERSIST_DIR)
        vectordb.persist()
else:
    print("Vector DB not found → creating new one")
    from langchain.docstore.document import Document
    # Create a comprehensive legal knowledge base
    legal_docs = [
        Document(page_content="The Justice Department provides legal services and ensures justice for all citizens."),
        Document(page_content="You can file a complaint online through the Justice Department portal or visit a local police station."),
        Document(page_content="Legal rights include fair representation, due process, equality before law, and access to justice."),
        Document(page_content="Human rights are basic rights and freedoms that belong to every person from birth until death."),
        Document(page_content="To file a complaint at a police station: visit the station, provide details of the incident, submit a written complaint, and get an acknowledgment receipt."),
        Document(page_content="Basic human rights include right to life, freedom from torture, freedom of expression, right to work, and right to education."),
        Document(page_content="The Justice Department handles civil rights violations, discrimination cases, and ensures equal protection under the law."),
        Document(page_content="You have the right to legal representation. If you cannot afford a lawyer, the court may appoint one for you."),
        Document(page_content="To report a crime: contact local police, provide all relevant information, preserve any evidence, and follow up on your case."),
        Document(page_content="The legal system provides remedies for violations of rights through courts, tribunals, and human rights commissions."),
        Document(page_content="Citizens have the right to information about government activities and decisions that affect them."),
        Document(page_content="The Justice Department offers legal aid services for those who cannot afford private attorneys."),
        Document(page_content="You can appeal a court decision if you believe there was an error in the judgment or procedure."),
        Document(page_content="Fundamental rights are protected by the Constitution and cannot be violated by the state without due process."),
        Document(page_content="To seek legal help: contact local legal aid clinics, bar associations, or the Justice Department's helpline."),
        Document(page_content="Human rights are universal, inalienable, indivisible, interdependent, and equal for all people."),
        Document(page_content="The police must register your complaint and provide you with a copy of the First Information Report (FIR)."),
        Document(page_content="You have the right to remain silent and not incriminate yourself during police questioning."),
        Document(page_content="Legal procedures ensure fairness in investigations, trials, and sentencing."),
        Document(page_content="The justice system includes civil courts, criminal courts, family courts, and administrative tribunals."),
        Document(page_content="You can file a Right to Information (RTI) application to access government documents and information."),
        Document(page_content="The Justice Department works to prevent human trafficking, child labor, and other forms of exploitation."),
        Document(page_content="Everyone has the right to a fair and public hearing by an independent and impartial tribunal."),
        Document(page_content="Legal aid is available for women, children, senior citizens, and economically disadvantaged individuals."),
        Document(page_content="You can file a complaint with the Human Rights Commission if your rights have been violated by government authorities."),
    ]
    vectordb = Chroma.from_documents(documents=legal_docs, embedding=embeddings, persist_directory=PERSIST_DIR)
    vectordb.persist()

retriever = vectordb.as_retriever(search_kwargs={"k": 5})  # Increased from 3 to 5 for better context

# ---- Helper Functions ---- #
def build_context(snippets):
    return "\n\n".join(snippets)

def ask_gemini(question, top_docs):
    context = build_context(top_docs)
    
    # For simple greetings, provide a concise response
    if question.lower().strip() in ["hi", "hello", "hey", "hi there"]:
        prompt = f"""You are a legal expert assistant for a Justice Department chatbot.
Respond to this greeting briefly and welcomingly.

Question: {question}

Provide a friendly, concise welcome message (1-2 sentences) that introduces your purpose as a legal assistant.
"""
    else:
        prompt = f"""You are a legal expert assistant for a Justice Department chatbot. 
Provide clear, structured, and actionable information about legal procedures and rights.

IMPORTANT FORMATTING INSTRUCTIONS:
- ALWAYS use clear section headings with Roman numerals (I., II., III.)
- ALWAYS use numbered lists (1., 2., 3.) for step-by-step procedures
- ALWAYS use bullet points (•) for lists of items, rights, or considerations
- NEVER combine multiple points into paragraphs
- Put each step or point on a new line
- Use <strong> tags for emphasis where needed instead of **bold**
- Keep information concise and easily scannable
- Add line breaks between sections

Context information:
{context}

Question: {question}

Structure your response with these clear sections:

I. [MAIN HEADING]
• Point 1
• Point 2
• Point 3

II. [NEXT HEADING]
1. Step 1
2. Step 2
3. Step 3

III. KEY POINTS TO REMEMBER:
• Important consideration 1
• Important consideration 2
• Additional notes

IV. ADDITIONAL RESOURCES:
- Information about where to get more help

Provide a comprehensive yet easily digestible response with proper line breaks.
"""
    try:
        resp = llm.invoke(prompt)
        # Ensure proper line breaks in the response and convert markdown bold to HTML strong tags
        formatted_response = resp.content.replace(". ", ".\n").replace("• ", "\n• ").replace("1. ", "\n1. ").replace("2. ", "\n2. ").replace("3. ", "\n3. ")
        # Convert markdown bold to HTML strong tags
        formatted_response = formatted_response.replace("**", "<strong>").replace("**", "</strong>")
        return formatted_response
    except Exception as e:
        return f"Error accessing Gemini: {str(e)}"

def RAG(q: str):
    try:
        results = retriever.get_relevant_documents(q)
        snippets = [d.page_content for d in results]
        print(f"Retrieved {len(snippets)} relevant documents for query: {q}")
    except Exception as e:
        logging.error(f"Retriever error: {e}")
        snippets = []

    # If no relevant documents found, use a fallback approach
    if not snippets:
        fallback_prompt = f"""You are a Justice Department assistant. Answer the following question about legal rights, procedures, or services.
        
Question: {q}

Provide a helpful and informative response based on general knowledge of legal systems and human rights.
Format your response with clear sections, numbered steps, and bullet points on separate lines.
Use <strong> tags for emphasis instead of **bold**.
"""
        try:
            resp = llm.invoke(fallback_prompt)
            # Ensure proper line breaks in the response and convert markdown bold to HTML strong tags
            formatted_response = resp.content.replace(". ", ".\n").replace("• ", "\n• ").replace("1. ", "\n1. ").replace("2. ", "\n2. ").replace("3. ", "\n3. ")
            # Convert markdown bold to HTML strong tags
            formatted_response = formatted_response.replace("**", "<strong>").replace("**", "</strong>")
            return formatted_response
        except Exception as e:
            logging.error(f"Fallback LLM error: {e}")
            return "I apologize, but I'm experiencing technical difficulties. Please try again shortly."

    try:
        return ask_gemini(q, snippets)
    except Exception as e:
        logging.error(f"LLM error: {e}")
        return "Error while generating response. Please try again."

# ---- FastAPI Setup ---- #
app = FastAPI(title="Justice Department AI Chatbot", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Pydantic Models ---- #
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

# ---- Startup Event ---- #
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ---- API Endpoints ---- #
@app.get("/")
async def root():
    return {"message": "Justice Department AI Chatbot Backend", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/test-gemini")
async def test_gemini():
    """Test if Gemini API is working"""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    
    if not google_api_key:
        return {"status": "error", "message": "GOOGLE_API_KEY not found in environment variables"}
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=google_api_key)
        
        # Test with a simple prompt
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content("Say hello in a creative way")
        
        return {
            "status": "success", 
            "message": "Gemini API is working correctly",
            "response": response.text
        }
        
    except Exception as e:
        return {"status": "error", "message": f"Gemini API error: {str(e)}"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(input_data: ChatInput, db: AsyncSession = Depends(get_db)):
    # Handle special command for new chat
    if input_data.user_message.strip() == "/new_chat":
        # Just create a session without sending a message
        session_id = str(uuid.uuid4())
        
        # Create an empty chat entry to establish the session
        chat_entry = ChatHistory(
            session_id=session_id,
            user_message="",
            bot_response="",
            language=input_data.language or "en",
        )
        db.add(chat_entry)
        await db.commit()
        
        return ChatResponse(
            bot_response="New chat session created", 
            session_id=session_id
        )
    
    # Normal chat processing
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
        user_message=user_message,
        bot_response=original_response,
        language=language,
    )
    db.add(chat_entry)
    await db.commit()

    return ChatResponse(bot_response=response_text, session_id=session_id)

@app.get("/sessions/{session_id}/history", response_model=SessionInfo)
async def get_session_history(session_id: str, db: AsyncSession = Depends(get_db)):
    session_query = await db.execute(
        text("SELECT user_message, timestamp FROM chat_history WHERE session_id = :sid AND user_message != '' ORDER BY timestamp ASC LIMIT 1"),
        {"sid": session_id},
    )
    session_data = session_query.fetchone()

    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    history_query = await db.execute(
        text("SELECT user_message, bot_response, timestamp, language FROM chat_history WHERE session_id = :sid AND user_message != '' ORDER BY timestamp ASC"),
        {"sid": session_id},
    )
    history_data = history_query.fetchall()

    history = [
        SessionHistoryItem(user_message=row[0], bot_response=row[1], timestamp=row[2], language=row[3])
        for row in history_data
    ]

    return SessionInfo(
        session_id=session_id,
        label=session_data[0][:50] + "..." if len(session_data[0]) > 50 else session_data[0],
        created=session_data[1],
        history=history,
    )

@app.get("/sessions", response_model=List[SessionInfo])
async def get_all_sessions(db: AsyncSession = Depends(get_db)):
    sessions_query = await db.execute(
        text("SELECT session_id, user_message, MIN(timestamp) as created FROM chat_history WHERE user_message != '' GROUP BY session_id ORDER BY created DESC")
    )
    sessions_data = sessions_query.fetchall()

    sessions = [
        SessionInfo(
            session_id=row[0],
            label=row[1][:50] + "..." if len(row[1]) > 50 else row[1],
            created=row[2],
            history=None,
        )
        for row in sessions_data
    ]
    return sessions

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM chat_history WHERE session_id = :sid"), {"sid": session_id})
    await db.commit()
    return {"status": "success", "message": "Session deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)