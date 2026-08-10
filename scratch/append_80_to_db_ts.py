import json
import re

json_path = r"d:\intern\flower\scratch\new_80_products.json"
db_ts_path = r"d:\intern\flower\src\server\db.ts"

with open(json_path, "r", encoding="utf-8") as f:
    products = json.load(f)

# Format each item as a TypeScript object string
ts_items = []
for p in products:
    discount = round(((p["originalPrice"] - p["price"]) / p["originalPrice"]) * 100)
    ts_str = f"""  {{
    id: '{p["id"]}',
    sku: '{p["sku"]}',
    name: '{p["name"].replace("'", "\\'")}',
    englishName: '{p["name"].replace("'", "\\'")}',
    tamilName: '{p["nameTamil"].replace("'", "\\'")}',
    scientificName: '{p["scientificName"]}',
    categoryId: '{p["categoryId"]}',
    categoryName: '{p["category"]}',
    description: '{p["description"].replace("'", "\\'")}',
    mrp: {int(p["originalPrice"])},
    sellingPrice: {int(p["price"])},
    discount: {discount},
    stock: 150,
    plantHeight: '1.5 - 2 Feet',
    potSize: '{p["potSize"]}',
    sunlight: '{p["careSunlight"]}',
    waterRequirement: '{p["careWatering"]}',
    floweringSeason: '{p["bloomType"]}',
    careInstructions: {{
      watering: '{p["careWatering"]}',
      sunlight: '{p["careSunlight"]}',
      fertilizer: '{p["careFertilizer"]}',
      soil: '{p["careSoil"]}'
    }},
    image: '{p["image"]}',
    images: ['{p["image"]}'],
    featured: {str(p["isFeatured"]).lower()},
    bestSeller: {str(p["isBestSeller"]).lower()},
    trending: true,
    tags: ['{p["category"].lower()}', 'nursery plant'],
    rating: 4.8,
    reviewCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }}"""
    ts_items.append(ts_str)

ts_block = ",\n".join(ts_items)

with open(db_ts_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find end of DEFAULT_PRODUCTS array (e.g. before `];` after product definitions)
# Look for line `const DEFAULT_PRODUCTS: Product[] = [`
match = re.search(r"const DEFAULT_PRODUCTS: Product\[\] = \[", content)
if match:
    # Find the closing `];` of DEFAULT_PRODUCTS
    start_pos = match.end()
    bracket_pos = content.find("\n];", start_pos)
    if bracket_pos != -1:
        new_content = content[:bracket_pos] + ",\n" + ts_block + content[bracket_pos:]
        with open(db_ts_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Successfully appended {len(products)} products to DEFAULT_PRODUCTS in src/server/db.ts!")
    else:
        print("Could not find closing bracket for DEFAULT_PRODUCTS")
else:
    print("Could not find DEFAULT_PRODUCTS declaration")
