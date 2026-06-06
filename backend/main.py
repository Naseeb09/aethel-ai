import asyncio
import os
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Aethel Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client with OpenRouter configuration
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENAI_API_KEY")
)

class ChatRequest(BaseModel):
    prompt: str

class ChatResponse(BaseModel):
    response: str
    thoughts: List[str]
    latency_ms: int

SYSTEM_PROMPT = """You are AETHEL, a highly advanced, ultra-logical AI engine. 
Your persona is 'Midnight Chill': sophisticated, calm, direct, and slightly brutalist in efficiency.

When a user provides a prompt, you MUST first perform a deep logical analysis.
Output your response in the following format:

<THINKING>
- [One sentence logical step]
- [Another one sentence logical step]
- ... (minimum 3 steps)
</THINKING>

<RESPONSE>
[Your direct, useful, and high-impact response here. Avoid fluff.]
</RESPONSE>

Never break this format. Your thinking must be real and logical, not simulated slop."""

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    start_time = asyncio.get_event_loop().time()
    
    try:
        if not os.getenv("OPENAI_API_KEY"):
            # Fallback for when API key is missing
            return ChatResponse(
                response="SYSTEM ERROR: API_KEY_MISSING. Please provide OPENAI_API_KEY in .env file.",
                thoughts=["Checking credentials...", "Auth failure detected.", "Aborting link."],
                latency_ms=0
            )

        response = client.chat.completions.create(
            model="openrouter/auto", # Use OpenRouter's auto-routing to find an available model
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.prompt}
            ],
            temperature=0.7
        )

        content = response.choices[0].message.content
        
        # Parse thinking steps
        thinking_match = re.search(r"<THINKING>(.*?)</THINKING>", content, re.DOTALL)
        response_match = re.search(r"<RESPONSE>(.*?)</RESPONSE>", content, re.DOTALL)
        
        thoughts = []
        if thinking_match:
            raw_thoughts = thinking_match.group(1).strip().split("\n")
            thoughts = [t.strip("- ").strip() for t in raw_thoughts if t.strip()]
        
        final_response = ""
        if response_match:
            final_response = response_match.group(1).strip()
        else:
            final_response = content.strip()

        end_time = asyncio.get_event_loop().time()
        latency_ms = int((end_time - start_time) * 1000)
        
        return ChatResponse(
            response=final_response,
            thoughts=thoughts,
            latency_ms=latency_ms
        )

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
