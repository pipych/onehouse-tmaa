"""
OneHouse - Automatic Server Map Preview Generator
Captures a clean, UI-free snapshot of BlueMap at active coordinates
and saves it as an optimized WebP image in public/map-preview.webp
"""
import subprocess
import os
import time
from PIL import Image

MAP_URL = "https://map.onehouse.pp.ua/#world:-56:60:-235:123:0:0:0:1:flat"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TEMP_SHOT = os.path.join(os.environ.get("TEMP", "."), "map_headless_shot.png")
OUT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "map-preview.webp"))

def main():
    print(f"Capturing screenshot from {MAP_URL}...")
    args = [
        CHROME_PATH,
        "--headless=new",
        f"--screenshot={TEMP_SHOT}",
        "--window-size=1200,600",
        "--virtual-time-budget=9000",
        "--hide-scrollbars",
        MAP_URL
    ]
    subprocess.run(args, check=True)
    
    if not os.path.exists(TEMP_SHOT):
        raise RuntimeError("Failed to capture map screenshot")
        
    print("Cropping center terrain without website UI buttons...")
    im = Image.open(TEMP_SHOT)
    # Crop box eliminating top badge and right side toolbars
    cropped = im.crop((120, 80, 1040, 560))
    
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    cropped.save(OUT_PATH, "WEBP", quality=85, method=6)
    print(f"Saved optimized preview to {OUT_PATH} ({os.path.getsize(OUT_PATH) // 1024} KB)")

if __name__ == "__main__":
    main()
