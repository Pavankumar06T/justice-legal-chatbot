from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain.chat_models import init_chat_model
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pathlib import Path
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

#----RAG PART----#
PERSIST_DIR = "./chroma_store"
#---initialize---#
llm = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")


if Path(PERSIST_DIR).exists() and any(Path(PERSIST_DIR).iterdir()):
    vectordb = Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings)
else:
    exit(1) 

retriever = vectordb.as_retriever(k=10)
#----helper fns----#
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
#----main RAG fn----#
def RAG(q):
    try:
        qr_prompt = f"Rewrite the following question into a retrieval query ONLY GIVE THE SENTENCE:\n{q}"
        qr = llm.invoke(qr_prompt).content
    except Exception as e:
        print("Error calling Gemini:", e)
        return
    
    
    results = retriever.invoke(qr)
    print(results)
    snippets = [d.page_content for d in results]

    
    try:
        ans = ask_gemini(q, snippets)
        return(ans)
    except Exception as e:
        print("Error calling Gemini:", e)
#----RAG END----#

#----FASTAPI PART----#
app = FastAPI(title="Justice Department AI Chatbot", version="1.0.0")

# Enable CORS for frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # adjust for your frontend origin if different
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#----WRAPPER PART----#
class ChatInput(BaseModel):
    user_message: str

class ChatResponse(BaseModel):
    bot_response: str
    status: str = "success"
#----WRAPPER END----#
#-----ENDPOINTS-----###
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
async def chat_endpoint(input_data: ChatInput):
    try:
        response=RAG(input_data.user_message)
        bot_response = response.text or "I’m sorry, I couldn’t generate a response."
        return ChatResponse(bot_response=bot_response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
