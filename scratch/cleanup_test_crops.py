import os
import glob

products_dir = r"d:\intern\flower\public\products"
test_prefixes = ["auto_crop_", "perfect_crop_", "precise_crop_", "pure_square_", "ss_1080_crop_", "test_crop_", "zoom_crop_"]

for fname in os.listdir(products_dir):
    if any(fname.startswith(prefix) for prefix in test_prefixes):
        fpath = os.path.join(products_dir, fname)
        try:
            os.remove(fpath)
            print(f"Removed temp file: {fname}")
        except Exception as e:
            print(f"Err removing {fname}: {e}")
