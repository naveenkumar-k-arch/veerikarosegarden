import os
import glob
from PIL import Image

folder = r"C:\Users\kupen\OneDrive\Desktop\image_flower\new producta"
files = sorted(glob.glob(os.path.join(folder, "*.*")))

print(f"Total files found in '{folder}': {len(files)}")

wa_images = []
ss_images = []
other_images = []

for f in files:
    fname = os.path.basename(f)
    if fname.startswith("IMG-") or "WA" in fname:
        wa_images.append(f)
    elif fname.startswith("Screenshot_") or "Screenshot" in fname:
        ss_images.append(f)
    else:
        other_images.append(f)

print(f"WhatsApp Images: {len(wa_images)}")
print(f"Screenshot Images: {len(ss_images)}")
print(f"Other Images: {len(other_images)}")

# Print first 5 WhatsApp images dimensions
print("\nSample WhatsApp Images:")
for f in wa_images[:5]:
    try:
        with Image.open(f) as img:
            print(f"  {os.path.basename(f)}: size={img.size}, mode={img.mode}")
    except Exception as e:
        print(f"  Err reading {os.path.basename(f)}: {e}")

# Print first 5 Screenshots dimensions
print("\nSample Screenshots:")
for f in ss_images[:5]:
    try:
        with Image.open(f) as img:
            print(f"  {os.path.basename(f)}: size={img.size}, mode={img.mode}")
    except Exception as e:
        print(f"  Err reading {os.path.basename(f)}: {e}")
