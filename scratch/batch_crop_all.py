import os
import glob
import numpy as np
from PIL import Image

src_folder = r"C:\Users\kupen\OneDrive\Desktop\image_flower\new producta"
out_dir = r"d:\intern\flower\public\products"
os.makedirs(out_dir, exist_ok=True)

files = sorted(glob.glob(os.path.join(src_folder, "*.*")))

print(f"Processing all {len(files)} image files...")

def crop_and_square_plant(img_path, out_path):
    with Image.open(img_path) as img:
        w, h = img.size
        arr = np.array(img.convert('RGB'))
        fname = os.path.basename(img_path)
        
        # Determine layout based on dimensions & name
        if "WA" in fname or fname.startswith("IMG-") or w <= 650:
            # WhatsApp 608 x 1320
            # Header ends ~120px, photo is ~120 to ~700px, text starts ~700px
            top = int(h * 0.11)
            bottom = int(h * 0.47)
            # Find exact dark bar boundary if available
            for y in range(int(h * 0.18), int(h * 0.65)):
                row = arr[y, :, :]
                dark_count = np.sum((row[:, 0] < 35) & (row[:, 1] < 40) & (row[:, 2] < 45))
                if dark_count > w * 0.75:
                    bottom = y - 2
                    break
            
            # Crop photo width slice
            photo_h = bottom - top
            if photo_h < int(h * 0.12):
                top = int(h * 0.11)
                bottom = int(h * 0.46)
                photo_h = bottom - top
                
            c_left = max(0, (w - photo_h) // 2)
            c_right = min(w, c_left + photo_h)
            cropped = img.crop((c_left, top, c_right, bottom))
        else:
            # Screenshot 1080 x 2400
            # Photo area: y = 220 to y = 1150
            top = int(h * 0.09)
            bottom = int(h * 0.46)
            for y in range(int(h * 0.18), int(h * 0.65)):
                row = arr[y, :, :]
                dark_count = np.sum((row[:, 0] < 35) & (row[:, 1] < 40) & (row[:, 2] < 45))
                if dark_count > w * 0.75:
                    bottom = y - 2
                    break
                    
            photo_h = bottom - top
            if photo_h < int(h * 0.12):
                top = int(h * 0.09)
                bottom = int(h * 0.45)
                photo_h = bottom - top
                
            c_left = max(0, (w - photo_h) // 2)
            c_right = min(w, c_left + photo_h)
            cropped = img.crop((c_left, top, c_right, bottom))
            
        # Ensure exact square
        cw, ch = cropped.size
        sq_side = min(cw, ch)
        c_left = (cw - sq_side) // 2
        c_top = (ch - sq_side) // 2
        final_square = cropped.crop((c_left, c_top, c_left + sq_side, c_top + sq_side))
        
        # Save as high quality 800x800 JPEG
        final_square.resize((800, 800), Image.Resampling.LANCZOS).save(out_path, "JPEG", quality=95)

results = []
for i, f in enumerate(files, 1):
    out_filename = f"new_plant_{i:02d}.jpg"
    out_filepath = os.path.join(out_dir, out_filename)
    try:
        crop_and_square_plant(f, out_filepath)
        results.append((i, f, out_filename))
    except Exception as e:
        print(f"Error processing {f}: {e}")

print(f"Successfully processed and saved {len(results)} image files to {out_dir}!")
