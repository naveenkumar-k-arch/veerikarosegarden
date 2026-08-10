import os
import glob
from PIL import Image

folder = r"C:\Users\kupen\OneDrive\Desktop\image_flower\new producta"
out_dir = r"d:\intern\flower\public\products"
os.makedirs(out_dir, exist_ok=True)

files = sorted(glob.glob(os.path.join(folder, "*.*")))

def crop_plant_photo_only(img_path):
    with Image.open(img_path) as img:
        w, h = img.size
        fname = os.path.basename(img_path)
        
        if "WA" in fname or fname.startswith("IMG-"):
            # WhatsApp layout 608x1320
            # Top header is y=0 to ~120
            # Photo is y=120 to ~720
            top = int(h * 0.09)      # ~118px
            bottom = int(h * 0.55)   # ~726px
            left = 0
            right = w
            
            # Crop photo area
            cropped = img.crop((left, top, right, bottom))
            
            # Center square crop within photo area if needed
            cw, ch = cropped.size
            sq_size = min(cw, ch)
            c_left = (cw - sq_size) // 2
            c_top = (ch - sq_size) // 2
            final_crop = cropped.crop((c_left, c_top, c_left + sq_size, c_top + sq_size))
        else:
            # Mobile screenshot layout 1080x2400
            # Top status bar & app header: y=0 to ~220
            # Photo area: y=220 to ~1350
            top = int(h * 0.09)      # ~216px
            bottom = int(h * 0.55)   # ~1320px
            left = 0
            right = w
            
            cropped = img.crop((left, top, right, bottom))
            
            cw, ch = cropped.size
            sq_size = min(cw, ch)
            c_left = (cw - sq_size) // 2
            c_top = (ch - sq_size) // 2
            final_crop = cropped.crop((c_left, c_top, c_left + sq_size, c_top + sq_size))
            
        # Resize to crisp 800x800 square
        resized = final_crop.resize((800, 800), Image.Resampling.LANCZOS)
        return resized

# Process 4 samples (2 WhatsApp, 2 Screenshots)
wa_files = [f for f in files if "WA" in os.path.basename(f) or os.path.basename(f).startswith("IMG-")]
ss_files = [f for f in files if f not in wa_files]

sample_files = wa_files[:2] + ss_files[:2]

for i, f in enumerate(sample_files):
    out_name = f"precise_crop_{i+1}.jpeg"
    out_path = os.path.join(out_dir, out_name)
    crop_img = crop_plant_photo_only(f)
    crop_img.save(out_path, "JPEG", quality=93)
    print(f"Saved precise crop {i+1} ({os.path.basename(f)}): {out_path}")
