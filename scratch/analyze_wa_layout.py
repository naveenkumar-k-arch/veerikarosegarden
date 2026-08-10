import os
import glob
import numpy as np
from PIL import Image

folder = r"C:\Users\kupen\OneDrive\Desktop\image_flower\new producta"
wa_files = sorted([f for f in glob.glob(os.path.join(folder, "*.*")) if "WA" in os.path.basename(f) or os.path.basename(f).startswith("IMG-")])

print(f"Analyzing {len(wa_files)} WhatsApp images...")

for f in wa_files[:5]:
    with Image.open(f) as img:
        w, h = img.size
        # Convert to numpy array to inspect dark background
        arr = np.array(img)
        
        # Check average brightness per row
        row_brightness = arr.mean(axis=(1, 2))
        
        # Find where the dark WhatsApp details box starts (brightness drops significantly below 40)
        dark_rows = np.where(row_brightness < 45)[0]
        
        print(f"File: {os.path.basename(f)} ({w}x{h})")
        if len(dark_rows) > 0:
            print(f"  Dark background detected starting around row: {dark_rows[0]} (out of {h})")
        else:
            print("  No obvious dark row boundary")
