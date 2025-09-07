from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not set in .env file")

client = genai.Client(api_key=API_KEY)

app = FastAPI(title="Justice Department AI Chatbot", version="1.0.0")

# Enable CORS for frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # adjust for your frontend origin if different
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatInput(BaseModel):
    user_message: str

class ChatResponse(BaseModel):
    bot_response: str
    status: str = "success"

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
        system_prompt = (
            "You are an AI assistant for a Justice Department chatbot. "
            "Provide helpful, accurate information about legal rights, justice department services, "
            "legal aid, and general legal guidance. Be professional and clear."
        )
        full_prompt = f"{system_prompt}\n\nUser: {input_data.user_message}"

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt,
        )

        bot_response = response.text or "I’m sorry, I couldn’t generate a response."
        return ChatResponse(bot_response=bot_response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
