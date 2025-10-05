from langchain.chat_models import init_chat_model
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from pathlib import Path
import logging
import re

PERSIST_DIR = "../chroma_store"
#-----LLM----#
llm = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

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

def retrieval(q):
    try:
        results = retriever.get_relevant_documents(q)
        snippets = [d.page_content for d in results]
        
    except Exception as e:
        logging.error(f"Retriever error: {e}")
        snippets = []
    return snippets

def augmentation(question,snippets):
    context = build_context(snippets)
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
        return prompt
def generation(prompt: str) -> str:
    """
    Generates a response from the LLM and applies robust formatting.
    """
    try:
        resp = llm.invoke(prompt)
        content = resp.content

        # 1. Convert markdown bold to HTML strong tags reliably
        # This pattern finds text wrapped in **...** and replaces the tags correctly.
        formatted_response = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', content)

        # 2. Ensure any numbered list item starts on a new line
        # This finds any number (e.g., "1.", "10.") and ensures a newline is before it.
        formatted_response = re.sub(r'(\d+\.)\s*', r'\n\1 ', formatted_response)

        # 3. Ensure any bullet point starts on a new line
        # This finds a bullet (•) and ensures a newline is before it.
        formatted_response = re.sub(r'(•)\s*', r'\n\1 ', formatted_response)
        
        # 4. A simple way to add line breaks after sentences
        formatted_response = formatted_response.replace(". ", ".\n")

        # 5. Clean up any excess blank lines created by the formatting
        # This replaces multiple newlines with a single one.
        formatted_response = re.sub(r'\n\s*\n', '\n', formatted_response).strip()
        
        return formatted_response
        
    except Exception as e:
        logging.error(f"LLM Generation error: {e}")
        return "I apologize, but I am currently unable to process your request. Please try again later."
    
def RAG(q: str) -> str:
    retrieved_documents = retrieval(q)
    
    prompt = augmentation(q, retrieved_documents)
    
    answer = generation(prompt)
    
    return answer