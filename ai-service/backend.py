import os
import sys
import json
import time
import traceback
import requests
from bs4 import BeautifulSoup
from typing import TypedDict
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import StateGraph
from langchain_core.runnables import RunnableLambda
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

# Windows event loop policy (if needed)
if sys.platform == "win32":
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Load .env variables
load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("API_KEY")

# Define state type
class GraphState(TypedDict):
    url: str
    content: str
    report: str

# FastAPI model
class URLRequest(BaseModel):
    url: str

# FastAPI app
api = FastAPI()

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# STEP 1: Scrape content using requests
def scrape_site(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers, timeout=10)
    soup = BeautifulSoup(response.content, "html.parser")
    text = soup.get_text(separator="\n", strip=True)
    return text[:5000]  # Limit characters for LLM input

# STEP 2: LangGraph scrape node
def scrape_node(state: dict) -> dict:
    url = state["url"]
    html = scrape_site(url)
    return {"url": url, "content": html}

# STEP 3: LangGraph analyze node using Groq
def analyze_node(state: dict) -> dict:
    model = ChatGroq(
        model="llama3-70b-8192",
        api_key=os.getenv("API_KEY")
    )

    prompt = f"""
You are an expert in web accessibility.

Analyze the following web page and return ONLY a valid JSON object (no markdown, no prose, no preamble) with:


{{
  "score": integer (0–100),
  "totalIssues": integer,
  "scanTime": string (e.g., "2.3s"),
  "issues": [
    {{
      "id": integer,
      "type": "critical: | "moderate" | "low" ,
      "severity": "high" | "medium" | "low",
      "title": string,
      "description": string,
      "element": string,
      "suggestion": string,
      "count": integer
    }}
  ]
}}

Content:
{state['content']}
    """

    start = time.time()
    response = model.invoke([HumanMessage(content=prompt)])
    duration = round(time.time() - start, 1)

    try:
        report = json.loads(response.content)
        report["url"] = state["url"]
        report["scanTime"] = f"{duration}s"
        return {
        **state,
        "report": report
    }
    except Exception as e:
        return {
            "url": state["url"],
            "report": response.content,
            "error": str(e)
        }
    

# STEP 4: Build LangGraph
graph = StateGraph(GraphState)
graph.add_node("scrape", RunnableLambda(scrape_node))
graph.add_node("analyze", RunnableLambda(analyze_node))
graph.set_entry_point("scrape")
graph.add_edge("scrape", "analyze")
graph.set_finish_point("analyze")
app = graph.compile()

# STEP 5: FastAPI endpoint
@api.post("/check-accessibility")
async def check_accessibility(request: URLRequest):
    try:
        url = request.url
        print(f"🔗 Scanning URL: {url}")
        state = await app.ainvoke({"url": url})
        print("📦 Full LangGraph Output:", state)
        if "report" in state:
            return state["report"]
        else:
            return {"error": "No report generated", "debug": state}
    except Exception as e:
        print("❌ Backend Error:")
        traceback.print_exc()
        return {
            "error": str(e),
            "trace": traceback.format_exc()
        }
