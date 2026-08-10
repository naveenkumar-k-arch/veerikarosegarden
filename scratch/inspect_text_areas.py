import os
import glob
from PIL import Image

text_dir = r"d:\intern\flower\scratch\text_crops"
out_title_dir = r"d:\intern\flower\scratch\title_crops"
os.makedirs(out_title_dir, exist_ok=True)

files = sorted(glob.glob(os.path.join(text_dir, "*.jpg")))

for f in files:
    fname = os.path.basename(f)
    with Image.open(f) as img:
        w, h = img.size
        # Title & price line region: y = 20 to y = 140
        crop_title = img.crop((0, 20, w, int(h * 0.45)))
        out_path = os.path.join(out_title_dir, fname)
        crop_title.save(out_path, "JPEG", quality=90)

print(f"Created {len(files)} title crops in {out_title_dir}!")
