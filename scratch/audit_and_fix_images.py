import re
import os

db_path = r"d:\intern\flower\src\server\db.ts"
catalog_path = r"d:\intern\flower\src\data\catalogData.ts"

with open(db_path, "r", encoding="utf-8") as f:
    db_content = f.read()

# Category replacement dictionary
cat_images = {
    'cat-rose': '/products/double-delight.jpeg',
    'cat-herbals': '/products/ww.jpeg',
    'cat-jasmine': '/products/sgssg.jpeg',
    'cat-1786261986350': '/products/new_plant_01.jpg',
    'cat-creeper': '/products/white-creeper.jpeg',
    'cat-miniature': '/products/button-rose.jpeg',
    'cat-rare': '/products/rejtrjtj.jpeg',
    'cat-fruits': '/products/red-water-apple.jpeg'
}

print("Auditing images in db.ts and catalogData.ts...")
