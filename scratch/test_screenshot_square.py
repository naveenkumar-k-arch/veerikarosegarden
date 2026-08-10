import os
import glob
from PIL import Image

folder = r"C:\Users\kupen\OneDrive\Desktop\image_flower\new producta"
out_dir = r"d:\intern\flower\public\products"

files = sorted(glob.glob(os.path.join(folder, "*.*")))
ss_files = [f for f in files if "Screenshot" in os.path.basename(f)]

def crop_ss_1080(img_path):
    with Image.open(img_path) as img:
        w, h = img.size
        # 1080 x 2400
        # Upper middle square: y = 200 to y = 1280 (height = 1080, width = 1080)
        top = int(h * 0.08) # 192px
        left = 0
        right = w
        bottom = top + w
        
        cropped = img.crop((left, top, right, bottom))
        return cropped.resize((800, 800), Image.Resampling.LANCZOS)

for i, f in enumerate(ss_files[:3]):
    out_name = f"ss_1080_crop_{i+1}.jpeg"
    out_path = os.path.join(out_dir, out_name)
    crop_img = crop_ss_1080(f)
    crop_img.save(out_path, "JPEG", quality=95)
    print(f"Saved 1080 SS crop {i+1}: {out_path}")
