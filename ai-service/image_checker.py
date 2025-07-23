from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin

def find_uncaptioned_images(url):
    html = requests.get(url).text
    soup = BeautifulSoup(html, "html.parser")
    img_tags = soup.find_all("img")
    uncaptioned = []
    for tag in img_tags:
        alt = tag.get("alt")
        src = tag.get("src")
        if (not alt or alt.strip() == "") and src:
            if not src.startswith("http"):
                src = url + src  # Basic fix for relative URLs
            uncaptioned.append(src)
    return uncaptioned
