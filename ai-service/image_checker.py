from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin

def find_uncaptioned_images(url):
    try:
        headers={
            "User-Agent": "Mozilla/5.0"
        }
        html = requests.get(url,headers=headers, timeout=10).text
    except Exception as e:
        raise RuntimeError(f"Failed to fetch URL: {e}")
    
    soup = BeautifulSoup(html, "html.parser")
    img_tags = soup.find_all("img")

    print(f"Found {len(img_tags)} image(s) on the page.")
    print("==== FETCHED HTML START ====")
    print(html[:1000])  # Limit to 1000 characters
    print("==== FETCHED HTML END ====")

    uncaptioned = []

    for tag in img_tags:
        src = tag.get("src")
        alt = tag.attrs.get("alt", None)  # ✅ More strict than tag.get("alt")

        print(f"Image src: {src}, alt: {alt}")

        if src and (alt is None or alt.strip() == ""):
            full_src = urljoin(url, src)
            print(f"🟥 Uncaptioned image detected: {full_src}")
            uncaptioned.append(full_src)

    return uncaptioned
