import os
import glob
from PIL import Image, ImageDraw, ImageFont

title_dir = r"d:\intern\flower\scratch\title_crops"
out_dir = r"d:\intern\flower\scratch\montages"
os.makedirs(out_dir, exist_ok=True)

files = sorted(glob.glob(os.path.join(title_dir, "text_crop_*.jpg")))

print(f"Building montages for {len(files)} items...")

def build_montage(file_subset, montage_num):
    cols = 2
    rows = 10
    card_w = 500
    card_h = 160
    
    montage_img = Image.new("RGB", (cols * card_w, rows * card_h), (15, 23, 30))
    draw = ImageDraw.Draw(montage_img)
    
    for idx, fpath in enumerate(file_subset):
        col_idx = idx % cols
        row_idx = idx // cols
        
        x_pos = col_idx * card_w
        y_pos = row_idx * card_h
        
        try:
            with Image.open(fpath) as card:
                resized_card = card.resize((card_w - 40, card_h - 10), Image.Resampling.LANCZOS)
                montage_img.paste(resized_card, (x_pos + 40, y_pos + 5))
                
                # Draw index number
                item_num = (montage_num - 1) * 20 + idx + 1
                draw.text((x_pos + 5, y_pos + 40), f"#{item_num:02d}", fill=(255, 215, 0))
        except Exception as e:
            print(f"Err pasting {fpath}: {e}")
            
    out_path = os.path.join(out_dir, f"montage_{montage_num}.jpg")
    montage_img.save(out_path, "JPEG", quality=90)
    print(f"Saved montage {montage_num}: {out_path}")

for m in range(4):
    subset = files[m*20 : (m+1)*20]
    if subset:
        build_montage(subset, m+1)
