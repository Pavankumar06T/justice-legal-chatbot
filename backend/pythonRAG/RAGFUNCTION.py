from langchain.chat_models import init_chat_model
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os
from pathlib import Path
from dotenv import load_dotenv

# Load API key
load_dotenv()

PERSIST_DIR = "./chroma_store"

llm = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")


if Path(PERSIST_DIR).exists() and any(Path(PERSIST_DIR).iterdir()):
    vectordb = Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings)
else:
    exit(1) 

retriever = vectordb.as_retriever(k=10)

def build_context(snippets):
    return "\n\n---\n\n".join(snippets)

def ask_gemini(question, top_docs):
    context = build_context(top_docs)
    prompt = f"""Use only the context below to answer the question. 
Do your best to answer from context. Do NOT mention the context.

Context:
{context}

Question:
{question}
"""
    resp = llm.invoke(prompt)
    return resp.content

def RAGFUNC(q):
    print("FUNCTION CALLED")
    
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
        print(ans)
    except Exception as e:
        print("Error calling Gemini:", e)

if __name__ == "__main__":
    '''remove comment to test
    while True:
        question = input("Q: ")
        if question.lower() in ['exit', 'quit']:
            break
        RAGFUNC(question)
    '''


    


