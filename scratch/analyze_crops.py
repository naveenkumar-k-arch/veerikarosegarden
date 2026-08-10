import os
import glob
from PIL import Image

folder = r"C:\Users\kupen\OneDrive\Desktop\image_flower\new producta"
out_dir = r"d:\intern\flower\public\products"
os.makedirs(out_dir, exist_ok=True)

files = sorted(glob.glob(os.path.join(folder, "*.*")))

def crop_smart(img_path):
    with Image.open(img_path) as img:
        w, h = img.size
        
        # Determine crop region
        if h > w * 1.5:  # Tall phone screenshot / WhatsApp image (e.g. 1080x2400 or 608x1320)
            # Remove top status bar (~15%) and bottom nav bar (~20%), taking central square box
            box_size = min(w, int(h * 0.6))
            left = (w - box_size) // 2
            # Center vertically in the main image display region (between 18% and 78% height)
            top = int(h * 0.22)
            if top + box_size > h - int(h * 0.12):
                top = max(0, (h - box_size) // 2)
            
            right = left + box_size
            bottom = top + box_size
            
            # Ensure within bounds
            if right > w: right = w
            if bottom > h: bottom = h
            
            cropped = img.crop((left, top, right, bottom))
        else:
            # Center square crop
            box_size = min(w, h)
            left = (w - box_size) // 2
            top = (h - box_size) // 2
            cropped = img.crop((left, top, left + box_size, top + box_size))
            
        # Resize to crisp 800x800 square
        resized = cropped.resize((800, 800), Image.Resampling.LANCZOS)
        return resized

# Process first 3 images to test output
for i, f in enumerate(files[:3]):
    out_name = f"test_crop_{i+1}.jpeg"
    out_path = os.path.join(out_dir, out_name)
    cropped_img = crop_smart(f)
    cropped_img.save(out_path, "JPEG", quality=92)
    print(f"Saved test crop {i+1}: {out_path}")
