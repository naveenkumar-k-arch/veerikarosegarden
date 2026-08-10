import os
import glob
import numpy as np
from PIL import Image

folder = r"C:\Users\kupen\OneDrive\Desktop\image_flower\new producta"
out_dir = r"d:\intern\flower\public\products"
os.makedirs(out_dir, exist_ok=True)

files = sorted(glob.glob(os.path.join(folder, "*.*")))

def auto_crop_photo(img_path):
    with Image.open(img_path) as img:
        w, h = img.size
        arr = np.array(img.convert('RGB'))
        
        # Calculate color variance per row
        row_std = arr.std(axis=1).mean(axis=1)
        
        # Skip top status bar (5%) and bottom details (bottom 35%)
        top_search = int(h * 0.05)
        bottom_search = int(h * 0.65)
        
        # Find rows with color variance > 18 (indicates real photo pixels)
        photo_rows = np.where(row_std[top_search:bottom_search] > 16.0)[0] + top_search
        
        if len(photo_rows) > 0:
            top_y = photo_rows[0]
            bottom_y = photo_rows[-1]
        else:
            top_y = int(h * 0.1)
            bottom_y = int(h * 0.45)
            
        # Crop row slice to check column boundaries
        photo_slice = arr[top_y:bottom_y, :, :]
        col_std = photo_slice.std(axis=0).mean(axis=1)
        photo_cols = np.where(col_std > 12.0)[0]
        
        if len(photo_cols) > 0:
            left_x = photo_cols[0]
            right_x = photo_cols[-1]
        else:
            left_x = 0
            right_x = w
            
        # Ensure minimum valid region
        if (right_x - left_x) < w * 0.3:
            left_x, right_x = 0, w
        if (bottom_y - top_y) < h * 0.2:
            top_y, bottom_y = int(h * 0.1), int(h * 0.45)
            
        cropped = img.crop((left_x, top_y, right_x, bottom_y))
        
        # Square crop
        cw, ch = cropped.size
        sq_size = min(cw, ch)
        c_left = (cw - sq_size) // 2
        c_top = (ch - sq_size) // 2
        
        final_crop = cropped.crop((c_left, c_top, c_left + sq_size, c_top + sq_size))
        return final_crop.resize((800, 800), Image.Resampling.LANCZOS)

# Test 4 samples
wa_files = [f for f in files if "WA" in os.path.basename(f) or os.path.basename(f).startswith("IMG-")]
ss_files = [f for f in files if f not in wa_files]

sample_files = wa_files[:2] + ss_files[:2]

for i, f in enumerate(sample_files):
    out_name = f"auto_crop_{i+1}.jpeg"
    out_path = os.path.join(out_dir, out_name)
    crop_img = auto_crop_photo(f)
    crop_img.save(out_path, "JPEG", quality=95)
    print(f"Saved auto crop {i+1} ({os.path.basename(f)}): {out_path}")
