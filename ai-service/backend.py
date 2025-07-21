#In case if you want to run this file, you will need two files, .env. I will send that to ya'll personally
#STEPS TO RUN THE CODE
#1. RUN pip install -r requirements.txt
#2. RUN python backend.py


import os
from bs4 import BeautifulSoup
from langgraph.graph import StateGraph
from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq
from langchain_core.runnables import RunnableLambda
from playwright.async_api import async_playwright
import asyncio
from typing import TypedDict
from dotenv import load_dotenv

load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("API_KEY")

class GraphState(TypedDict):
    url: str
    content: str
    report: str

# -- STEP 1: Scraper --
async def scrape_site(url: str) -> str:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url)
        await page.wait_for_timeout(2000)  # wait for content
        content = await page.content()
        await browser.close()

        soup = BeautifulSoup(content, "html.parser")
        text = soup.get_text(separator="\n", strip=True)
        return text[:5000]  # send only part for now

# -- STEP 2: LangGraph Node to Scrape --
async def scrape_node(state: dict) -> dict:
    url = state["url"]
    html = await scrape_site(url)
    return {"url": url, "content": html}

# -- STEP 3: LLM Node to Analyze Accessibility --
def analyze_node(state: dict) -> dict:
    model = ChatGroq(model="llama3-70b-8192")
    prompt = f"""
You're an expert in web accessibility. Analyze the following web page text for any WCAG 2.1 accessibility issues. 
Return a structured report with:

1. Identified issues
2. WCAG guideline it violates
3. Suggestions

Web Page Content:
{state['content']}
    """
    response = model.invoke([HumanMessage(content=prompt)])
    return {"url": state["url"], "report": response.content}

# -- STEP 4: Build LangGraph --
graph = StateGraph(GraphState)

# Add steps
graph.add_node("scrape", RunnableLambda(scrape_node))
graph.add_node("analyze", RunnableLambda(analyze_node))

# Set edges
graph.set_entry_point("scrape")
graph.add_edge("scrape", "analyze")
graph.set_finish_point("analyze")

# Compile
app = graph.compile()

# -- STEP 5: Run --
def run_checker(url: str):
    result = asyncio.run(app.ainvoke({"url": "https://example.com"}))
    print(f"\n🔍 Accessibility Report for {url}:\n")
    print(result["report"])

if __name__ == "__main__":
    test_url = "https://example.com"
    run_checker(test_url)
