import os
import glob
import numpy as np
from PIL import Image

src_folder = r"C:\Users\kupen\OneDrive\Desktop\image_flower\new producta"
out_text_dir = r"d:\intern\flower\scratch\text_crops"
os.makedirs(out_text_dir, exist_ok=True)

files = sorted(glob.glob(os.path.join(src_folder, "*.*")))

print(f"Extracting text crop cards for all {len(files)} files...")

for i, f in enumerate(files, 1):
    with Image.open(f) as img:
        w, h = img.size
        # Bottom details area: y = int(h * 0.45) to int(h * 0.80)
        crop_text = img.crop((0, int(h * 0.42), w, int(h * 0.85)))
        out_path = os.path.join(out_text_dir, f"text_crop_{i:02d}.jpg")
        crop_text.save(out_path, "JPEG", quality=90)

print(f"Saved {len(files)} text crop cards in {out_text_dir}!")
