from image_checker import find_uncaptioned_images
from blip_captioner import generate_caption
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app= FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLInput(BaseModel):
    url:str

@app.post("/generate-alt-text")

def generate_alt_text(data:URLInput):
    url=data.url.strip()

    try:
        images= find_uncaptioned_images(url)
    except Exception as e:
        return{"error":f"Failed to crawl the site:{str(e)}"}
    
    if not images:
        return{"message":"All images on this page have alt text."}
    
    result=[]

    for img_url in images:
        try:
            caption=generate_caption(img_url)
            result.append({"img_url":img_url, "caption":caption})
        except Exception as e:
            result.append({"img_url":img_url, "caption":f"Failed:{str(e)}"})
    return {"uncaptioned_images":result}
