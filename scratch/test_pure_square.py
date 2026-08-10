import os
import glob
import numpy as np
from PIL import Image

folder = r"C:\Users\kupen\OneDrive\Desktop\image_flower\new producta"
out_dir = r"d:\intern\flower\public\products"
os.makedirs(out_dir, exist_ok=True)

files = sorted(glob.glob(os.path.join(folder, "*.*")))

def crop_pure_plant_square(img_path):
    with Image.open(img_path) as img:
        w, h = img.size
        arr = np.array(img.convert('RGB'))
        fname = os.path.basename(img_path)
        
        # 1. Find photo bottom (where dark background starts)
        photo_bottom = int(h * 0.48)
        for y in range(int(h * 0.16), int(h * 0.70)):
            row = arr[y, :, :]
            dark_pixels = np.sum((row[:, 0] < 35) & (row[:, 1] < 40) & (row[:, 2] < 45))
            if dark_pixels > w * 0.75:
                photo_bottom = y - 4  # 4px margin above dark bar
                break
                
        # 2. Find photo top (below app status bar / header)
        if "WA" in fname or fname.startswith("IMG-"):
            photo_top = int(h * 0.11)  # Cuts off WhatsApp header icons (back, cart, menu)
        else:
            photo_top = int(h * 0.11)  # Cuts off status bar
            
        for y in range(photo_top, photo_bottom):
            row = arr[y, :, :]
            dark_pixels = np.sum((row[:, 0] < 35) & (row[:, 1] < 40) & (row[:, 2] < 45))
            if dark_pixels < w * 0.5:
                photo_top = y
                break
                
        # Calculate actual photo height
        ch = photo_bottom - photo_top
        if ch < int(h * 0.15):
            photo_top = int(h * 0.12)
            photo_bottom = int(h * 0.48)
            ch = photo_bottom - photo_top
            
        # Crop square centered horizontally with side length = ch
        c_left = max(0, (w - ch) // 2)
        c_right = min(w, c_left + ch)
        
        # Crop
        cropped = img.crop((c_left, photo_top, c_right, photo_bottom))
        
        # Ensure exact square (if c_right was bounded by w)
        cw, ch_final = cropped.size
        sq_side = min(cw, ch_final)
        final_square = cropped.crop(( (cw - sq_side)//2, (ch_final - sq_side)//2, (cw - sq_side)//2 + sq_side, (ch_final - sq_side)//2 + sq_side ))
        
        return final_square.resize((800, 800), Image.Resampling.LANCZOS)

# Test samples
wa_files = [f for f in files if "WA" in os.path.basename(f) or os.path.basename(f).startswith("IMG-")]
ss_files = [f for f in files if f not in wa_files]

sample_files = wa_files[:2] + ss_files[:2]

for i, f in enumerate(sample_files):
    out_name = f"pure_square_{i+1}.jpeg"
    out_path = os.path.join(out_dir, out_name)
    crop_img = crop_pure_plant_square(f)
    crop_img.save(out_path, "JPEG", quality=95)
    print(f"Saved pure square {i+1} ({os.path.basename(f)}): {out_path}")
