import os
import glob
import numpy as np
from PIL import Image

folder = r"C:\Users\kupen\OneDrive\Desktop\image_flower\new producta"
out_dir = r"d:\intern\flower\public\products"

files = sorted(glob.glob(os.path.join(folder, "*.*")))
ss_files = [f for f in files if "Screenshot" in os.path.basename(f)]

def crop_zoom_plant(img_path):
    with Image.open(img_path) as img:
        w, h = img.size
        arr = np.array(img.convert('RGB'))
        
        # 1. Find photo bottom (where dark background starts)
        photo_bottom = int(h * 0.48)
        for y in range(int(h * 0.16), int(h * 0.70)):
            row = arr[y, :, :]
            dark_pixels = np.sum((row[:, 0] < 35) & (row[:, 1] < 40) & (row[:, 2] < 45))
            if dark_pixels > w * 0.75:
                photo_bottom = y - 4
                break
                
        # 2. Find photo top (where dark background ends)
        photo_top = int(h * 0.11)
        for y in range(int(h * 0.05), photo_bottom):
            row = arr[y, :, :]
            dark_pixels = np.sum((row[:, 0] < 35) & (row[:, 1] < 40) & (row[:, 2] < 45))
            if dark_pixels < w * 0.5:
                photo_top = y + 2
                break
                
        h_photo = photo_bottom - photo_top
        if h_photo < int(h * 0.15):
            photo_top = int(h * 0.12)
            photo_bottom = int(h * 0.46)
            h_photo = photo_bottom - photo_top
            
        # Zoom crop: square box of size h_photo centered horizontally
        c_left = max(0, (w - h_photo) // 2)
        c_right = min(w, c_left + h_photo)
        
        cropped = img.crop((c_left, photo_top, c_right, photo_bottom))
        
        return cropped.resize((800, 800), Image.Resampling.LANCZOS)

for i, f in enumerate(ss_files[:3]):
    out_name = f"zoom_crop_{i+1}.jpeg"
    out_path = os.path.join(out_dir, out_name)
    crop_img = crop_zoom_plant(f)
    crop_img.save(out_path, "JPEG", quality=95)
    print(f"Saved zoom crop {i+1}: {out_path}")
