from image_checker import find_uncaptioned_images
from blip_captioner import generate_caption

url = "https://example.com"

images = find_uncaptioned_images(url)

for img_url in images:
    print(f"Image: {img_url}")
    try:
        caption = generate_caption(img_url)
        print(f"Generated ALT text: {caption}\n")
    except Exception as e:
        print(f" Failed to generate caption: {e}\n")
