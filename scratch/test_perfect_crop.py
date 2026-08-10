import os
import glob
import numpy as np
from PIL import Image

folder = r"C:\Users\kupen\OneDrive\Desktop\image_flower\new producta"
out_dir = r"d:\intern\flower\public\products"
os.makedirs(out_dir, exist_ok=True)

files = sorted(glob.glob(os.path.join(folder, "*.*")))

def find_exact_photo_box(img_path):
    with Image.open(img_path) as img:
        w, h = img.size
        arr = np.array(img.convert('RGB'))
        
        photo_bottom = int(h * 0.48)
        for y in range(int(h * 0.15), int(h * 0.70)):
            row = arr[y, :, :]
            dark_pixels = np.sum((row[:, 0] < 35) & (row[:, 1] < 40) & (row[:, 2] < 45))
            if dark_pixels > w * 0.75:
                photo_bottom = y - 2  # 2px safety margin above text box
                break
                
        photo_top = int(h * 0.08)
        for y in range(int(h * 0.02), photo_bottom):
            row = arr[y, :, :]
            dark_pixels = np.sum((row[:, 0] < 35) & (row[:, 1] < 40) & (row[:, 2] < 45))
            if dark_pixels < w * 0.5:
                photo_top = y
                break
                
        if photo_bottom - photo_top < int(h * 0.15):
            photo_top = int(h * 0.08)
            photo_bottom = int(h * 0.46)
            
        cropped = img.crop((0, photo_top, w, photo_bottom))
        
        cw, ch = cropped.size
        sq_size = min(cw, ch)
        c_left = (cw - sq_size) // 2
        c_top = (ch - sq_size) // 2
        
        final_square = cropped.crop((c_left, c_top, c_left + sq_size, c_top + sq_size))
        return final_square.resize((800, 800), Image.Resampling.LANCZOS)

# Test 4 samples
wa_files = [f for f in files if "WA" in os.path.basename(f) or os.path.basename(f).startswith("IMG-")]
ss_files = [f for f in files if f not in wa_files]

sample_files = wa_files[:2] + ss_files[:2]

for i, f in enumerate(sample_files):
    out_name = f"perfect_crop_{i+1}.jpeg"
    out_path = os.path.join(out_dir, out_name)
    crop_img = find_exact_photo_box(f)
    crop_img.save(out_path, "JPEG", quality=95)
    print(f"Saved perfect crop {i+1} ({os.path.basename(f)}): {out_path}")
